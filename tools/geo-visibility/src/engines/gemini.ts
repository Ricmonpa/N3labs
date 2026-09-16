import { GoogleGenAI } from "@google/genai";
import type { Engine, EngineAnswer, Source } from "../types.ts";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

const GROUNDING_REDIRECT = /^https:\/\/vertexaisearch\.cloud\.google\.com\/grounding-api-redirect\//;
const DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i;

/** Grounding citations point to an opaque Google redirect; the real domain is only in the title. */
function resolveCitationUrl(url: string, title?: string): string {
  if (!GROUNDING_REDIRECT.test(url)) return url;
  const domain = title?.trim();
  return domain && DOMAIN.test(domain) ? `https://${domain.toLowerCase()}/` : url;
}

export const geminiEngine: Engine = {
  id: "gemini",
  label: "Gemini",
  envKey: "GEMINI_API_KEY",
  model: MODEL,
  // The Google Search grounding tool has no user-location setting, so the market isn't applied here.
  async ask(prompt: string): Promise<EngineAnswer> {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const interaction = await client.interactions.create({
      model: MODEL,
      input: prompt,
      tools: [{ type: "google_search" }],
    });

    const citations: Source[] = [];
    const searchQueries: string[] = [];
    let text = "";

    for (const step of interaction.steps) {
      if (step.type === "google_search_call") {
        searchQueries.push(...(step.arguments.queries ?? []));
      } else if (step.type === "model_output") {
        for (const block of step.content ?? []) {
          if (block.type !== "text") continue;
          text += block.text;
          for (const a of block.annotations ?? []) {
            if (a.type !== "url_citation" || !a.url) continue;
            const url = resolveCitationUrl(a.url, a.title);
            if (!citations.some((c) => c.url === url)) citations.push({ url, title: a.title });
          }
        }
      }
    }

    return {
      model: interaction.model ?? MODEL,
      text: interaction.output_text ?? text,
      citations,
      // Gemini only exposes the pages it cites, so that's the full source list we can report.
      sources: citations,
      searchQueries,
      costUsd: null,
      usage: interaction.usage,
      raw: interaction,
    };
  },
};
