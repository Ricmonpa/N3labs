import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { INDUSTRIES, type Industry } from "@/lib/geo-visibility/catalog.ts";
import { buildReport, type Report } from "@/lib/geo-visibility/report.ts";
import type { RunRecord, Study } from "@/lib/geo-visibility/types.ts";

/**
 * Demo público: mediciones reales del catálogo, hechas una sola vez con scripts/demo-measure.ts
 * y guardadas en src/data/demo. Las páginas se arman al compilar: verlas no cuesta nada.
 */
type DemoFile = { industry: string; measuredAt: string; study: Study; records: RunRecord[] };

const DIR = join(process.cwd(), "src", "data", "demo");
const cache = new Map<string, DemoFile | null>();

export const slugOf = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function load(id: string): DemoFile | null {
  if (!cache.has(id)) {
    const file = join(DIR, `${id}.json`);
    cache.set(id, existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as DemoFile) : null);
  }
  return cache.get(id)!;
}

/** Industrias con medición lista (al menos la mitad de las respuestas esperadas). */
export function demoIndustries(): (Industry & { measuredAt: string; answers: number })[] {
  return INDUSTRIES.flatMap((industry) => {
    const d = load(industry.id);
    const expected = d ? d.study.prompts.length * d.study.runs * d.study.engines.length : 0;
    const answers = d?.records.filter((r) => r.ok).length ?? 0;
    return d && answers >= expected / 2 ? [{ ...industry, measuredAt: d.measuredAt, answers }] : [];
  });
}

/** El informe de la industria visto desde una de sus marcas: la elegida pasa a ser "tu marca". */
export function demoReport(industryId: string, brandSlug: string): { report: Report; study: Study } | null {
  const d = load(industryId);
  if (!d) return null;
  const all = [d.study.brand, ...d.study.competitors];
  const brand = all.find((b) => slugOf(b.name) === brandSlug);
  if (!brand) return null;
  const study: Study = { ...d.study, brand, competitors: all.filter((b) => b !== brand) };
  return { report: { ...buildReport(study, d.records), generatedAt: d.measuredAt }, study };
}
