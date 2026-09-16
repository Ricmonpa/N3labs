import OpenAI from "openai";
import type { Engine, EngineAnswer, Market, Source } from "../types.ts";

// ChatGPT's consumer model changes often; override with OPENAI_MODEL to match what users see.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-6-astra";

export const openaiEngine: Engine = {
  id: "openai",
  label: "ChatGPT (OpenAI)",
  envKey: "OPENAI_API_KEY",
  model: MODEL,
  async ask(prompt: string, market: Market): Promise<EngineAnswer> {
    const client = new OpenAI();
    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      tools: [
        {
          type: "web_search",
          user_location: {
            type: "approximate",
            country: market.country,
            city: market.city,
            region: market.region,
            timezone: market.timezone,
          },
        },
      ],
      // Lists every page consulted, not only the ones cited inline.
      include: ["web_search_call.action.sources"],
    });

    const citations: Source[] = [];
    const sources: Source[] = [];
    const searchQueries: string[] = [];

    for (const item of response.output) {
      if (item.type === "message") {
        for (const part of item.content) {
          if (part.type !== "output_text") continue;
          for (const a of part.annotations) {
            if (a.type === "url_citation") citations.push({ url: a.url, title: a.title });
          }
        }
      } else if (item.type === "web_search_call" && item.action.type === "search") {
        searchQueries.push(...(item.action.queries ?? []));
        for (const s of item.action.sources ?? []) sources.push({ url: s.url });
      }
    }

    return {
      model: response.model,
      text: response.output_text,
      citations,
      sources,
      searchQueries,
      costUsd: null,
      usage: response.usage,
      raw: response,
    };
  },
};
