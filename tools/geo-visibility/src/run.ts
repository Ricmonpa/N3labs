import { parseArgs } from "node:util";
import { analyzeDir } from "./analyze.ts";
import { loadStudy, planRun, runStudy, type RunOptions } from "./runner.ts";
import type { EngineId } from "../../../src/lib/geo-visibility/types.ts";

const USAGE = `Uso:
  npm run run -- --study studies/potenttial.json [opciones]
  (el panel en línea está en /panel del sitio)

Opciones:
  --engines openai,anthropic,perplexity,gemini   Motores (por defecto, los del estudio)
  --runs N           Repeticiones por pregunta (por defecto, las del estudio)
  --limit N          Solo las primeras N preguntas (para probar)
  --concurrency N    Llamadas en paralelo (por defecto 3)
  --out DIR          Carpeta de resultados (por defecto out/<estudio>/<fecha>)
  --simulate         Respuestas inventadas, sin llaves ni costo (solo para probar el flujo)
  --yes              Confirma que quieres gastar en llamadas reales`;

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

  const study = await loadStudy(values.study);
  const opts: RunOptions = {
    study,
    engines: (values.engines ? values.engines.split(",") : study.engines).map((e) => e.trim()) as EngineId[],
    runs: values.runs ? Number(values.runs) : study.runs,
    limit: values.limit ? Number(values.limit) : undefined,
    concurrency: values.concurrency ? Number(values.concurrency) : undefined,
    simulate: values.simulate,
    outDir: values.out,
  };

  const plan = await planRun(opts);
  if (plan.missing.length) console.warn(`Se omiten por falta de llave: ${plan.missing.join(", ")}`);
  if (!plan.engines.length) {
    console.error("No hay motores disponibles. Agrega las llaves en tools/geo-visibility/.env o usa --simulate.");
    process.exit(1);
  }

  console.log(`Estudio: ${study.name}${opts.simulate ? "  [SIMULACIÓN]" : ""}`);
  for (const e of plan.engines) console.log(`  ${e.label.padEnd(22)} ${e.model.padEnd(20)} ${e.calls} llamadas`);
  console.log(`  Total: ${plan.pending} llamadas pendientes (${plan.alreadyDone} ya hechas) → ${plan.outDir}`);

  if (!plan.pending) {
    await analyzeDir(plan.outDir);
    return;
  }
  if (!opts.simulate && !values.yes) {
    console.log("\nEsto hace llamadas reales con costo. Repite el comando con --yes para ejecutarlo.");
    return;
  }

  const { failed } = await runStudy(opts, (p) =>
    console.log(`[${p.done}/${p.total}] ${p.ok ? "ok " : "ERR"} ${p.key}${p.ok ? "" : ` — ${p.error}`}`),
  );
  if (failed) console.warn(`\n${failed} llamadas fallaron. Vuelve a correr el mismo comando para reintentarlas.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
