import type { Engine, EngineAnswer, Market, Source } from "../types.ts";

// Agent API (the Sonar chat-completions API is retired on 2026-09-27).
const ENDPOINT = "https://api.perplexity.ai/v1/agent";
const MODEL = process.env.PERPLEXITY_MODEL ?? "perplexity/sonar";
const MAX_STEPS = Number(process.env.PERPLEXITY_MAX_STEPS ?? 3);

type AgentResponse = {
  model?: string;
  status?: string;
  error?: unknown;
  output?: Array<
    | {
        type: "message";
        content?: Array<{
          type: string;
          text?: string;
          annotations?: Array<{ type: string; url?: string; title?: string }>;
        }>;
      }
    | { type: "search_results"; queries?: string[]; results?: Array<{ url: string; title?: string }> }
    | { type: string }
  >;
  usage?: { cost?: { total_cost?: number } };
};

export const perplexityEngine: Engine = {
  id: "perplexity",
  label: "Perplexity",
  envKey: "PERPLEXITY_API_KEY",
  model: MODEL,
  async ask(prompt: string, market: Market): Promise<EngineAnswer> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        max_steps: MAX_STEPS,
        tools: [
          {
            type: "web_search",
            user_location: { country: market.country, city: market.city, region: market.region },
          },
        ],
      }),
      signal: AbortSignal.timeout(180_000),
    });

    const body = (await res.json().catch(() => null)) as AgentResponse | null;
    if (!res.ok || !body) {
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(body?.error ?? body).slice(0, 300)}`);
    }
    if (body.status && body.status !== "completed") {
      throw new Error(`status ${body.status}`);
    }

    const citations: Source[] = [];
    const sources: Source[] = [];
    const searchQueries: string[] = [];
    let text = "";

    for (const item of body.output ?? []) {
      if (item.type === "message" && "content" in item) {
        for (const part of item.content ?? []) {
          if (part.type !== "output_text") continue;
          text += part.text ?? "";
          for (const a of part.annotations ?? []) {
            if (a.type === "url_citation" && a.url) citations.push({ url: a.url, title: a.title });
          }
        }
      } else if (item.type === "search_results" && "results" in item) {
        searchQueries.push(...(item.queries ?? []));
        for (const r of item.results ?? []) sources.push({ url: r.url, title: r.title });
      }
    }

    return {
      model: body.model ?? MODEL,
      text,
      citations,
      sources,
      searchQueries,
      costUsd: body.usage?.cost?.total_cost ?? null,
      usage: body.usage,
      raw: body,
    };
  },
};
