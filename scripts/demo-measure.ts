/**
 * Mide una o varias industrias del catálogo para el demo público y guarda las respuestas en
 * src/data/demo/<industria>.json. Se corre a mano, una vez por medición:
 *
 *   node scripts/demo-measure.ts autos bancos
 *
 * Usa las IAs que tengan llave en .env.local. Si se corta, al volver a correrlo retoma
 * donde se quedó (no repite respuestas ya guardadas). Cada respuesta cuesta dinero real.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { INDUSTRIES, industryPrompts, type Industry } from "../src/lib/geo-visibility/catalog.ts";
import { ENGINES } from "../src/lib/geo-visibility/engines/index.ts";
import { executeTask, listTasks, pool } from "../src/lib/geo-visibility/execute.ts";
import type { EngineId, RunRecord, Study, StudyPrompt } from "../src/lib/geo-visibility/types.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "src", "data", "demo");
const RUNS = 3;

for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

export type DemoFile = { industry: string; measuredAt: string; study: Study; records: RunRecord[] };

function demoStudy(industry: Industry, engines: EngineId[]): Study {
  const counters: Record<string, number> = {};
  const prefix = { category: "c", problem: "p", comparison: "x", brand: "b" } as const;
  const prompts: StudyPrompt[] = industryPrompts(industry, "México").map((p) => {
    counters[p.type] = (counters[p.type] ?? 0) + 1;
    return { id: `${prefix[p.type]}${counters[p.type]}`, type: p.type, text: p.text };
  });
  const [brand, ...competitors] = industry.brands;
  return {
    name: industry.label,
    brand,
    competitors,
    market: { country: "MX", language: "es-MX", timezone: "America/Mexico_City" },
    runs: RUNS,
    engines,
    prompts,
  };
}

/** Lo que el informe necesita de cada respuesta; lo demás (raw, usage) pesa y no se usa. */
function slim(r: RunRecord): RunRecord {
  if (!r.answer) return r;
  return { ...r, answer: { ...r.answer, raw: null, usage: null } };
}

const ids = process.argv.slice(2);
const chosen = ids.length ? INDUSTRIES.filter((i) => ids.includes(i.id)) : INDUSTRIES;
const engines = (Object.keys(ENGINES) as EngineId[]).filter((e) => process.env[ENGINES[e].envKey]);
if (!engines.length) throw new Error("No hay llaves de IA en .env.local");
mkdirSync(OUT, { recursive: true });

for (const industry of chosen) {
  const file = join(OUT, `${industry.id}.json`);
  const study = demoStudy(industry, engines);
  const saved: DemoFile | null = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  const records = new Map((saved?.records ?? []).filter((r) => r.ok).map((r) => [r.key, r]));
  const tasks = listTasks(study.prompts, engines, RUNS)
    .filter((t) => !records.has(t.key))
    .slice(0, Number(process.env.DEMO_LIMIT) || undefined);
  console.log(`${industry.id}: ${tasks.length} preguntas por hacer (${records.size} ya guardadas) con ${engines.join(", ")}`);

  const save = () => {
    const data: DemoFile = { industry: industry.id, measuredAt: saved?.measuredAt ?? new Date().toISOString(), study, records: [...records.values()] };
    writeFileSync(file, JSON.stringify(data));
  };
  let done = 0;
  await pool(tasks, 4, async (task) => {
    const rec = await executeTask(task, ENGINES[task.engine], study, { simulated: false });
    if (rec.ok) records.set(rec.key, slim(rec));
    else console.warn(`  falló ${rec.key}: ${rec.error}`);
    if (++done % 10 === 0) {
      save();
      console.log(`  ${done}/${tasks.length}`);
    }
  });
  save();
  console.log(`${industry.id}: listo, ${records.size} respuestas`);
}
