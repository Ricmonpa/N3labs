import { parseArgs } from "node:util";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadStudy } from "./study.ts";
import { ENGINES } from "./engines/index.ts";
import { createMockEngine } from "./engines/mock.ts";
import { analyzeDir } from "./analyze.ts";
import type { Engine, EngineId, RunRecord, Study, StudyPrompt } from "./types.ts";

const USAGE = `Uso:
  npm run run -- --study studies/potenttial.json [opciones]

Opciones:
  --engines openai,anthropic,perplexity,gemini   Motores (por defecto, los del estudio)
  --runs N           Repeticiones por pregunta (por defecto, las del estudio)
  --limit N          Solo las primeras N preguntas (para probar)
  --concurrency N    Llamadas en paralelo (por defecto 3)
  --out DIR          Carpeta de resultados (por defecto out/<estudio>/<fecha>)
  --simulate         Respuestas inventadas, sin llaves ni costo (solo para probar el flujo)
  --yes              Confirma que quieres gastar en llamadas reales`;

const MAX_ATTEMPTS = 3;

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number") return status === 408 || status === 409 || status === 429 || status >= 500;
  const msg = String((err as Error)?.message ?? err);
  return /HTTP (408|409|429|5\d\d)|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
}

/** Readable error text; some SDKs bury the provider's message in a JSON string body. */
function describeError(err: unknown): string {
  const e = err as { status?: unknown; body?: unknown; message?: unknown };
  if (typeof e?.body === "string") {
    try {
      const parsed = JSON.parse(e.body);
      const inner = (Array.isArray(parsed) ? parsed[0] : parsed)?.error;
      if (inner?.message) return `${e.status ?? inner.code ?? ""} ${inner.message}`.trim();
    } catch {
      /* fall through */
    }
  }
  return String(e?.message ?? err);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function doneKeys(file: string): Promise<Set<string>> {
  if (!existsSync(file)) return new Set();
  const keys = new Set<string>();
  for (const line of (await readFile(file, "utf8")).split("\n")) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line) as RunRecord;
    if (rec.ok) keys.add(rec.key);
  }
  return keys;
}

async function main() {
  const { values } = parseArgs({
    options: {
      study: { type: "string" },
      engines: { type: "string" },
      runs: { type: "string" },
      limit: { type: "string" },
      concurrency: { type: "string" },
      out: { type: "string" },
      simulate: { type: "boolean", default: false },
      yes: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help || !values.study) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 1);
  }

  const study: Study = await loadStudy(values.study);
  const simulate = values.simulate;
  const runs = values.runs ? Number(values.runs) : study.runs;
  const concurrency = Math.max(1, Number(values.concurrency ?? 3));
  const prompts: StudyPrompt[] = values.limit ? study.prompts.slice(0, Number(values.limit)) : study.prompts;
  const requested = (values.engines ? values.engines.split(",") : study.engines).map((e) => e.trim()) as EngineId[];

  const engines: Engine[] = [];
  const missing: string[] = [];
  for (const id of requested) {
    if (!ENGINES[id]) throw new Error(`Motor desconocido: ${id}`);
    if (simulate) {
      engines.push(createMockEngine(id, study));
    } else if (process.env[ENGINES[id].envKey]) {
      engines.push(ENGINES[id]);
    } else {
      missing.push(`${ENGINES[id].label} (${ENGINES[id].envKey})`);
    }
  }
  if (missing.length) console.warn(`Se omiten por falta de llave: ${missing.join(", ")}`);
  if (!engines.length) {
    console.error("No hay motores disponibles. Agrega las llaves en tools/geo-visibility/.env o usa --simulate.");
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const outDir = values.out ?? path.join("out", slug(study.name), simulate ? `${date}-simulacion` : date);
  const file = path.join(outDir, "responses.jsonl");
  await mkdir(outDir, { recursive: true });
  // Save what this run actually covers, so the report header matches it.
  await writeFile(path.join(outDir, "study.json"), JSON.stringify({ ...study, prompts, runs }, null, 2));

  const skip = await doneKeys(file);
  const tasks = engines.flatMap((engine) =>
    prompts.flatMap((p) =>
      Array.from({ length: runs }, (_, i) => ({ engine, prompt: p, run: i + 1, key: `${engine.id}|${p.id}|${i + 1}` })),
    ),
  ).filter((t) => !skip.has(t.key));

  console.log(`Estudio: ${study.name}${simulate ? "  [SIMULACIÓN]" : ""}`);
  for (const e of engines) {
    const n = tasks.filter((t) => t.engine.id === e.id).length;
    console.log(`  ${e.label.padEnd(22)} ${e.model.padEnd(20)} ${n} llamadas`);
  }
  console.log(`  Total: ${tasks.length} llamadas pendientes (${skip.size} ya hechas) → ${outDir}`);

  if (!tasks.length) {
    await analyzeDir(outDir);
    return;
  }
  if (!simulate && !values.yes) {
    console.log("\nEsto hace llamadas reales con costo. Repite el comando con --yes para ejecutarlo.");
    return;
  }

  let written = Promise.resolve();
  let finished = 0;
  let failed = 0;

  const runTask = async (t: (typeof tasks)[number]) => {
    const started = Date.now();
    let record: RunRecord | null = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const answer = await t.engine.ask(t.prompt.text, study.market);
        record = { key: t.key, engine: t.engine.id, simulated: simulate, promptId: t.prompt.id, promptType: t.prompt.type, prompt: t.prompt.text, run: t.run, at: new Date().toISOString(), ms: Date.now() - started, ok: true, answer };
        break;
      } catch (err) {
        const retry = attempt < MAX_ATTEMPTS && isTransient(err);
        if (retry) {
          await sleep(2000 * 2 ** (attempt - 1) + Math.random() * 1000);
          continue;
        }
        record = { key: t.key, engine: t.engine.id, simulated: simulate, promptId: t.prompt.id, promptType: t.prompt.type, prompt: t.prompt.text, run: t.run, at: new Date().toISOString(), ms: Date.now() - started, ok: false, error: describeError(err).slice(0, 500) };
        break;
      }
    }
    const line = JSON.stringify(record) + "\n";
    // Serialize appends so lines never interleave.
    written = written.then(() => appendFile(file, line));
    await written;
    finished++;
    if (!record?.ok) failed++;
    console.log(`[${finished}/${tasks.length}] ${record?.ok ? "ok " : "ERR"} ${t.key}${record?.ok ? "" : ` — ${record?.error}`}`);
  };

  const queue = [...tasks];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) await runTask(queue.shift()!);
    }),
  );

  if (failed) console.warn(`\n${failed} llamadas fallaron. Vuelve a correr el mismo comando para reintentarlas.`);
  await analyzeDir(outDir);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
