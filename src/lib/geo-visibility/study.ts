import type { EngineId, PromptType, Study } from "./types.ts";

export const ENGINE_IDS: EngineId[] = ["openai", "anthropic", "perplexity", "gemini"];
export const PROMPT_TYPES: PromptType[] = ["category", "problem", "comparison", "brand"];

/** Returns the problems that make a study unusable (empty when valid). Fills defaults in place. */
export function validateStudy(study: Study): string[] {
  const problems: string[] = [];
  if (!study.name?.trim()) problems.push("falta el nombre del estudio");
  if (!study.brand?.name?.trim() || !study.brand.domains?.length) problems.push("la marca necesita nombre y al menos un dominio");
  for (const c of study.competitors ?? []) {
    if (!c.name?.trim() || !c.domains?.length) problems.push(`competidor sin nombre o dominio: ${c.name || "(sin nombre)"}`);
  }
  if (!study.market?.country || !study.market.language) problems.push("el mercado necesita país e idioma");
  if (!Number.isInteger(study.runs) || study.runs < 1 || study.runs > 10) problems.push("las repeticiones deben ser un entero entre 1 y 10");
  for (const e of study.engines ?? []) {
    if (!ENGINE_IDS.includes(e)) problems.push(`motor desconocido: ${e}`);
  }
  const ids = new Set<string>();
  for (const p of study.prompts ?? []) {
    if (!p.id || !p.text?.trim()) problems.push(`pregunta sin id o texto: ${p.id ?? ""}`);
    if (!PROMPT_TYPES.includes(p.type)) problems.push(`tipo inválido en ${p.id}: ${p.type}`);
    if (ids.has(p.id)) problems.push(`id repetido: ${p.id}`);
    ids.add(p.id);
  }
  if (!study.prompts?.length) problems.push("no hay preguntas");
  study.competitors ??= [];
  study.engines ??= [...ENGINE_IDS];
  return problems;
}
