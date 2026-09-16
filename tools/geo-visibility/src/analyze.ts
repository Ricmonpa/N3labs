import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildReport, pct } from "../../../src/lib/geo-visibility/report.ts";
import { renderMarkdown } from "../../../src/lib/geo-visibility/markdown.ts";
import type { RunRecord, Study } from "../../../src/lib/geo-visibility/types.ts";

export async function analyzeDir(dir: string) {
  const study = JSON.parse(await readFile(path.join(dir, "study.json"), "utf8")) as Study;
  const lines = (await readFile(path.join(dir, "responses.jsonl"), "utf8"))
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as RunRecord);
  const report = buildReport(study, lines);
  await writeFile(path.join(dir, "report.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(dir, "report.md"), renderMarkdown(report));
  const { unbranded, branded } = report.overall;
  console.log(`\nInforme: ${path.join(dir, "report.md")}`);
  console.log(
    `${study.brand.name} · sin nombre: menciona ${pct(unbranded.mention)}, cita ${pct(unbranded.citation)} · con nombre: menciona ${pct(branded.mention)} · ${report.responses.ok} respuestas${report.simulated ? "  [SIMULACIÓN]" : ""}`,
  );
  return report;
}

if (import.meta.main) {
  const dir = process.argv[2];
  if (!dir) {
    console.log("Uso: npm run analyze -- out/<estudio>/<fecha>");
    process.exit(1);
  }
  analyzeDir(dir).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
