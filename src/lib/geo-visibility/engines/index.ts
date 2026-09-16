import type { Engine, EngineId } from "../types.ts";
import { openaiEngine } from "./openai.ts";
import { anthropicEngine } from "./anthropic.ts";
import { perplexityEngine } from "./perplexity.ts";
import { geminiEngine } from "./gemini.ts";

export const ENGINES: Record<EngineId, Engine> = {
  openai: openaiEngine,
  anthropic: anthropicEngine,
  perplexity: perplexityEngine,
  gemini: geminiEngine,
};

export function engineAvailability() {
  return (Object.keys(ENGINES) as EngineId[]).map((id) => ({
    id,
    label: ENGINES[id].label,
    model: ENGINES[id].model,
    envKey: ENGINES[id].envKey,
    hasKey: !!process.env[ENGINES[id].envKey],
  }));
}
