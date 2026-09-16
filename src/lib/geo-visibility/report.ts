import { firstMention, citesEntity, hostOf, hostMatches, wilson } from "./match.ts";
import type { EngineId, Entity, PromptType, RunRecord, Study } from "./types.ts";

export type Rate = { hits: number; n: number; rate: number; low: number; high: number };

export const ENGINE_LABEL: Record<EngineId, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

export const TYPE_LABEL: Record<PromptType, string> = {
  category: "Categoría",
  problem: "Problema",
  comparison: "Comparación",
  brand: "Marca",
};

// Search/redirect hosts, not real sources.
const IGNORED_HOSTS = ["google.com", "vertexaisearch.cloud.google.com", "bing.com"];

function rate(hits: number, n: number): Rate {
  return { hits, n, ...wilson(hits, n) };
}

export function pct(r: Rate): string {
  if (!r.n) return "—";
  const p = (x: number) => `${Math.round(x * 100)}%`;
  return `${p(r.rate)} (${p(r.low)}–${p(r.high)})`;
}

type Scored = {
  rec: RunRecord;
  mentioned: boolean[];
  cited: boolean[];
  sourced: boolean[];
  /** 1-based rank of the brand among mentioned entities, by order of first mention. */
  brandRank: number | null;
};

function score(rec: RunRecord, entities: Entity[]): Scored {
  const a = rec.answer!;
  const positions = entities.map((e) => firstMention(a.text, e));
  const mentioned = positions.map((p) => p >= 0);
  const order = positions
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p >= 0)
    .sort((x, y) => x.p - y.p);
  const rankIdx = order.findIndex((x) => x.i === 0);
  return {
    rec,
    mentioned,
    cited: entities.map((e) => citesEntity(a.citations, e)),
    sourced: entities.map((e) => citesEntity(a.sources, e)),
    brandRank: rankIdx >= 0 ? rankIdx + 1 : null,
  };
}

/** Keeps the latest successful attempt per key; failures only count if the key never succeeded. */
function latestRecords(lines: RunRecord[]): { ok: RunRecord[]; failed: RunRecord[] } {
  const ok = new Map<string, RunRecord>();
  const failed = new Map<string, RunRecord>();
  for (const r of lines) {
    if (r.ok) ok.set(r.key, r);
    else failed.set(r.key, r);
  }
  for (const k of ok.keys()) failed.delete(k);
  return { ok: [...ok.values()], failed: [...failed.values()] };
}

/** Scores every answer and aggregates the numbers the report shows. Pure: no I/O. */
export function buildReport(study: Study, lines: RunRecord[]) {
  const { ok, failed } = latestRecords(lines);
  const simulated = lines.some((l) => l.simulated);
  const entities = [study.brand, ...study.competitors];
  const scored = ok.map((r) => score(r, entities));
  const engines = [...new Set(ok.map((r) => r.engine))] as EngineId[];
  const models = Object.fromEntries(
    engines.map((e) => [e, [...new Set(ok.filter((r) => r.engine === e).map((r) => r.answer!.model))].join(", ")]),
  );

  const summarize = (rows: Scored[], i = 0) => ({
    mention: rate(rows.filter((s) => s.mentioned[i]).length, rows.length),
    citation: rate(rows.filter((s) => s.cited[i]).length, rows.length),
    source: rate(rows.filter((s) => s.sourced[i]).length, rows.length),
  });

  // Brand-name prompts almost always return the brand, so they'd inflate the headline.
  // Real discovery is measured only on prompts that don't name it.
  const unbranded = scored.filter((s) => s.rec.promptType !== "brand");
  const branded = scored.filter((s) => s.rec.promptType === "brand");
  const forEngine = (rows: Scored[], e: EngineId) => summarize(rows.filter((s) => s.rec.engine === e));
  const byEngine = Object.fromEntries(
    engines.map((e) => [e, { unbranded: forEngine(unbranded, e), branded: forEngine(branded, e) }]),
  );
  const overall = { unbranded: summarize(unbranded), branded: summarize(branded) };

  const shareOfVoice = entities.map((ent, i) => {
    const perEngine = Object.fromEntries(
      engines.map((e) => [e, rate(unbranded.filter((s) => s.rec.engine === e && s.mentioned[i]).length, unbranded.filter((s) => s.rec.engine === e).length)]),
    );
    const mentions = unbranded.filter((s) => s.mentioned[i]).length;
    return { name: ent.name, perEngine, overall: rate(mentions, unbranded.length), mentions };
  });
  const totalMentions = shareOfVoice.reduce((n, x) => n + x.mentions, 0);

  const ranks = unbranded.map((s) => s.brandRank).filter((r): r is number => r !== null);
  const avgRank = ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null;

  const types = [...new Set(study.prompts.map((p) => p.type))];
  const byType = types.map((t) => ({
    type: t,
    perEngine: Object.fromEntries(engines.map((e) => [e, summarize(scored.filter((s) => s.rec.engine === e && s.rec.promptType === t))])),
  }));

  const byPrompt = study.prompts.map((p) => ({
    id: p.id,
    type: p.type,
    text: p.text,
    perEngine: Object.fromEntries(engines.map((e) => [e, summarize(scored.filter((s) => s.rec.engine === e && s.rec.promptId === p.id))])),
  }));

  const knownDomains = entities.flatMap((e) => e.domains);
  const countDomains = (rows: Scored[]) => {
    const map = new Map<string, { runs: number; engines: Set<string>; competitor: boolean }>();
    for (const s of rows) {
      const hosts = new Set(s.rec.answer!.citations.map((c) => hostOf(c.url)).filter((h): h is string => !!h));
      for (const h of hosts) {
        if (hostMatches(h, study.brand.domains) || hostMatches(h, IGNORED_HOSTS)) continue;
        const row = map.get(h) ?? { runs: 0, engines: new Set<string>(), competitor: hostMatches(h, knownDomains) };
        row.runs++;
        row.engines.add(ENGINE_LABEL[s.rec.engine]);
        map.set(h, row);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1].runs - a[1].runs)
      .slice(0, 20)
      .map(([domain, v]) => ({ domain, runs: v.runs, engines: [...v.engines], competitor: v.competitor }));
  };
  const citedInstead = countDomains(unbranded.filter((s) => !s.cited[0]));
  const topCited = countDomains(scored);

  const costs = ok.map((r) => r.answer!.costUsd).filter((c): c is number => typeof c === "number");

  const report = {
    study: study.name,
    brand: study.brand,
    competitors: study.competitors,
    types,
    simulated,
    generatedAt: new Date().toISOString(),
    market: study.market,
    engines: engines.map((e) => ({ id: e, model: models[e] })),
    prompts: study.prompts.length,
    runsPerPrompt: study.runs,
    responses: { ok: ok.length, failed: failed.length },
    overall,
    byEngine,
    shareOfVoice: shareOfVoice.map((x) => ({ ...x, share: totalMentions ? x.mentions / totalMentions : 0 })),
    averageBrandRank: avgRank,
    byType,
    byPrompt,
    citedWhenBrandIsNot: citedInstead,
    topCitedDomains: topCited,
    knownCostUsd: costs.length ? costs.reduce((a, b) => a + b, 0) : null,
    failures: failed.map((f) => ({ key: f.key, error: f.error })),
  };
  return report;
}

export type Report = ReturnType<typeof buildReport>;

