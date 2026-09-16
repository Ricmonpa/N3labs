import { readFile } from "node:fs/promises";
import type { EngineId, PromptType, Study } from "./types.ts";

const ENGINE_IDS: EngineId[] = ["openai", "anthropic", "perplexity", "gemini"];
const PROMPT_TYPES: PromptType[] = ["category", "problem", "comparison", "brand"];

export async function loadStudy(path: string): Promise<Study> {
  const study = JSON.parse(await readFile(path, "utf8")) as Study;
  const problems: string[] = [];

  if (!study.name) problems.push("falta name");
  if (!study.brand?.name || !study.brand.domains?.length) problems.push("brand necesita name y domains");
  for (const c of study.competitors ?? []) {
    if (!c.name || !c.domains?.length) problems.push(`competidor sin name o domains: ${JSON.stringify(c)}`);
  }
  if (!study.market?.country || !study.market.language) problems.push("market necesita country y language");
  if (!Number.isInteger(study.runs) || study.runs < 1) problems.push("runs debe ser un entero ≥ 1");
  for (const e of study.engines ?? []) {
    if (!ENGINE_IDS.includes(e)) problems.push(`motor desconocido: ${e}`);
  }
  const ids = new Set<string>();
  for (const p of study.prompts ?? []) {
    if (!p.id || !p.text) problems.push(`pregunta sin id o text: ${JSON.stringify(p)}`);
    if (!PROMPT_TYPES.includes(p.type)) problems.push(`tipo inválido en ${p.id}: ${p.type}`);
    if (ids.has(p.id)) problems.push(`id repetido: ${p.id}`);
    ids.add(p.id);
  }
  if (!study.prompts?.length) problems.push("no hay preguntas");

  if (problems.length) throw new Error(`Estudio inválido (${path}):\n- ${problems.join("\n- ")}`);
  study.competitors ??= [];
  return study;
}
