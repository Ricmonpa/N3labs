import Anthropic from "@anthropic-ai/sdk";
import type { Engine, EngineAnswer, Market, Source } from "../types.ts";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
const MAX_RESUMES = 5;

export const anthropicEngine: Engine = {
  id: "anthropic",
  label: "Claude",
  envKey: "ANTHROPIC_API_KEY",
  model: MODEL,
  async ask(prompt: string, market: Market): Promise<EngineAnswer> {
    const client = new Anthropic();
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
    const turns: Anthropic.Beta.BetaMessage[] = [];

    for (let i = 0; i <= MAX_RESUMES; i++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        // On a policy decline the API re-runs the request on Anthropic's recommended fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 5,
            user_location: {
              type: "approximate",
              country: market.country,
              city: market.city,
              region: market.region,
              timezone: market.timezone,
            },
          },
        ],
        messages,
      });
      turns.push(response);

      if (response.stop_reason === "refusal") {
        throw new Error(`refusal: ${response.stop_details?.category ?? "unknown"}`);
      }
      if (response.stop_reason !== "pause_turn") break;
      // A long server-side search turn paused; send it back to let it finish.
      messages.push({ role: "assistant", content: response.content });
    }

    const last = turns[turns.length - 1];
    if (last.stop_reason === "pause_turn") throw new Error("search turn did not finish");

    const citations: Source[] = [];
    const sources: Source[] = [];
    const searchQueries: string[] = [];
    let text = "";

    for (const block of turns.flatMap((t) => t.content)) {
      if (block.type === "text") {
        text += block.text;
        for (const c of block.citations ?? []) {
          if (c.type === "web_search_result_location") citations.push({ url: c.url, title: c.title ?? undefined });
        }
      } else if (block.type === "server_tool_use" && block.name === "web_search") {
        const q = (block.input as { query?: unknown }).query;
        if (typeof q === "string") searchQueries.push(q);
      } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        // A successful search returns a list; an error returns a single object.
        for (const r of block.content) sources.push({ url: r.url, title: r.title });
      }
    }

    return {
      model: last.model,
      text,
      citations,
      sources,
      searchQueries,
      costUsd: null,
      usage: turns.map((t) => t.usage),
      raw: turns,
    };
  },
};
