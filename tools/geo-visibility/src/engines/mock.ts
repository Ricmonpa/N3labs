import { createHash } from "node:crypto";
import type { Engine, EngineAnswer, EngineId, Study } from "../types.ts";

// SIMULATION ONLY. Exercises the pipeline and the report without API keys.
// Answers are made up and every record is flagged `simulated`, so reports say so loudly.

function roll(seed: string): number {
  return createHash("sha256").update(seed).digest().readUInt32BE(0) / 0xffffffff;
}

export function createMockEngine(id: EngineId, study: Study): Engine {
  return {
    id,
    label: `${id} (simulado)`,
    envKey: "",
    model: "simulacion",
    async ask(prompt: string): Promise<EngineAnswer> {
      const seed = `${id}|${prompt}|${Math.random()}`;
      const entities = [study.brand, ...study.competitors];
      const mentioned = entities.filter((_, i) => roll(`${seed}|m${i}`) < 0.45);
      const cited = mentioned.filter((_, i) => roll(`${seed}|c${i}`) < 0.5);
      const filler = [1, 2, 3].map((n) => ({
        url: `https://fuente-${Math.ceil(roll(`${seed}|f${n}`) * 6)}.ejemplo.test/articulo`,
        title: `Fuente simulada ${n}`,
      }));
      const citations = [
        ...cited.map((e) => ({ url: `https://${e.domains[0]}/`, title: e.name })),
        ...filler,
      ];
      return {
        model: "simulacion",
        text: `[SIMULACIÓN] Respuesta a "${prompt}". Opciones: ${mentioned.map((e) => e.name).join(", ") || "ninguna marca"}.`,
        citations,
        sources: citations,
        searchQueries: [prompt],
        costUsd: 0,
        usage: null,
        raw: null,
      };
    },
  };
}
