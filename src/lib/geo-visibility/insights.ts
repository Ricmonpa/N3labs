import { firstMention, hostOf, hostMatches, normalizeText, wilson } from "./match.ts";
import type { EngineId, Entity, RunRecord, Study } from "./types.ts";

/**
 * Lo que el informe muestra además de la cifra principal: las búsquedas que la IA hace
 * por dentro antes de responder ("fan-out") y qué tipo de sitios usa como fuente.
 * Todo sale de respuestas ya guardadas; no hace llamadas. Puro: sin I/O.
 */

type Rate = { hits: number; n: number; rate: number; low: number; high: number };
const rate = (hits: number, n: number): Rate => ({ hits, n, ...wilson(hits, n) });

// Search/redirect hosts, not real sources.
const IGNORED_HOSTS = ["google.com", "vertexaisearch.cloud.google.com", "bing.com"];

// ---------- Búsquedas internas ----------

export type QueryKind = "site" | "quoted" | "open";

export type FanoutQuery = {
  query: string;
  /** Veces que alguna IA hizo esta búsqueda. */
  count: number;
  engines: EngineId[];
  kind: QueryKind;
  /** Dominio que la búsqueda pide directo (site:…), si lo hay. */
  site: string | null;
  /** Marcas del estudio que aparecen en la búsqueda (la marca primero). */
  names: string[];
  brand: boolean;
};

const SITE = /\bsite:([^\s"')]+)/i;

function kindOf(q: string): QueryKind {
  if (SITE.test(q)) return "site";
  if (/"[^"]+"/.test(q)) return "quoted";
  return "open";
}

function siteOf(q: string): string | null {
  const m = SITE.exec(q);
  if (!m) return null;
  return hostOf(`https://${m[1].replace(/^https?:\/\//i, "")}`);
}

/** La entidad aparece en la búsqueda por nombre o por su dominio. */
function namedIn(q: string, e: Entity): boolean {
  if (firstMention(q, e) >= 0) return true;
  const host = siteOf(q);
  if (host && hostMatches(host, e.domains)) return true;
  const lower = q.toLowerCase();
  return e.domains.some((d) => lower.includes(d.toLowerCase().replace(/^www\./, "")));
}

const STOPWORDS = new Set(
  (
    "de la el en y a los las del que por con para un una se su al lo es o como mas más sus le ya muy sin sobre este esta entre " +
    "cual cuál cuales cuáles qué que mejor mejores the of and in to for a an is on with best what which how vs or are top"
  ).split(" "),
);

function phrasesOf(q: string): string[] {
  const words = q
    .toLowerCase()
    .replace(/site:/g, "")
    .replace(/["'()?¿!¡,:;]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d{1,3}$/.test(w));
  const out = new Set<string>();
  for (let i = 0; i + 1 < words.length; i++) out.add(`${words[i]} ${words[i + 1]}`);
  return [...out];
}

export function fanoutInsights(study: Study, ok: RunRecord[]) {
  const entities = [study.brand, ...study.competitors];
  const engines = [...new Set(ok.map((r) => r.engine))];

  const byQuery = new Map<string, FanoutQuery>();
  const phraseCount = new Map<string, number>();
  const siteCount = new Map<string, number>();
  const entityQueries = entities.map(() => 0);
  let total = 0;

  for (const r of ok) {
    for (const raw of r.answer!.searchQueries ?? []) {
      const query = raw.trim().replace(/\s+/g, " ");
      if (!query) continue;
      total++;
      const key = normalizeText(query);
      let row = byQuery.get(key);
      if (!row) {
        const named = entities.filter((e) => namedIn(query, e));
        row = {
          query,
          count: 0,
          engines: [],
          kind: kindOf(query),
          site: siteOf(query),
          names: named.map((e) => e.name),
          brand: named[0] === study.brand,
        };
        byQuery.set(key, row);
      }
      row.count++;
      if (!row.engines.includes(r.engine)) row.engines.push(r.engine);
      entities.forEach((e, i) => row.names.includes(e.name) && entityQueries[i]++);
      if (row.site) siteCount.set(row.site, (siteCount.get(row.site) ?? 0) + 1);
      for (const p of phrasesOf(query)) phraseCount.set(p, (phraseCount.get(p) ?? 0) + 1);
    }
  }

  // Preguntas que no nombran la marca: ¿la IA la buscó por nombre de todos modos?
  const unbranded = ok.filter((r) => r.promptType !== "brand");
  const searched = unbranded.filter((r) => (r.answer!.searchQueries ?? []).length > 0);
  const searchedFor = entities.map((e) => ({
    name: e.name,
    rate: rate(searched.filter((r) => r.answer!.searchQueries.some((q) => namedIn(q, e))).length, searched.length),
  }));

  const perEngine = engines.map((engine) => {
    const rows = ok.filter((r) => r.engine === engine);
    const queries = rows.reduce((n, r) => n + (r.answer!.searchQueries ?? []).length, 0);
    return {
      engine,
      answers: rows.length,
      searched: rate(rows.filter((r) => (r.answer!.searchQueries ?? []).length > 0).length, rows.length),
      queries,
      perAnswer: rows.length ? queries / rows.length : 0,
    };
  });

  const all = [...byQuery.values()].sort((a, b) => b.count - a.count || a.query.localeCompare(b.query));
  const kinds = (["site", "quoted", "open"] as QueryKind[]).map((kind) => ({
    kind,
    count: all.filter((q) => q.kind === kind).reduce((n, q) => n + q.count, 0),
  }));

  return {
    answers: ok.length,
    total,
    unique: all.length,
    perEngine,
    kinds,
    /** Búsquedas que nombran a cada marca, sobre el total de búsquedas. */
    entities: entities.map((e, i) => ({ name: e.name, queries: entityQueries[i], share: total ? entityQueries[i] / total : 0 })),
    /** En preguntas sin el nombre de la marca: respuestas donde la IA buscó a cada marca por nombre. */
    searchedFor,
    sites: [...siteCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([host, count]) => ({ host, count, entity: entities.find((e) => hostMatches(host, e.domains))?.name ?? null })),
    phrases: [...phraseCount.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase, count]) => ({ phrase, count })),
    top: all.slice(0, 80),
  };
}

// ---------- Fuentes ----------

export type SourceType = "brand" | "competitor" | "media" | "blog" | "store" | "social" | "reference" | "other";

export const SOURCE_TYPES: SourceType[] = ["brand", "competitor", "media", "blog", "store", "social", "reference", "other"];

const STORES = ["amazon.", "rs-online.", "mouser.", "grainger.", "misumi", "radwell.", "digikey.", "newark.", "zoro.", "steren.", "mercadolibre.", "walmart.", "liverpool.com.mx", "coppel.com", "ebay.", "aliexpress.", "homedepot.", "costco.", "sears.com.mx", "elektra.", "sanborns.", "bestbuy.", "shopify.", "temu.", "shein."];
const SOCIAL = ["youtube.com", "youtu.be", "facebook.com", "instagram.com", "tiktok.com", "x.com", "twitter.com", "linkedin.com", "reddit.com", "quora.com", "pinterest.", "threads.net", "medium.com"];
const REFERENCE = ["wikipedia.org", "wikidata.org", "britannica.com", "tripadvisor.", "yelp.", "trustpilot.", "g2.com", "capterra.", "glassdoor.", "clutch.co", "seccionamarilla.", "profeco.gob.mx", "doctoralia.", "indeed.", "occ.com.mx"];
const MEDIA = [
  "eluniversal.com.mx", "milenio.com", "excelsior.com.mx", "elfinanciero.com.mx", "eleconomista.com.mx", "expansion.mx", "forbes.",
  "reuters.com", "bloomberg.", "infobae.com", "elpais.com", "nytimes.com", "cnn.com", "cnnespanol.", "bbc.", "xataka.", "motorpasion.",
  "caranddriver.", "motortrend.", "autocosmos.", "eleconomista.es", "proceso.com.mx", "jornada.com.mx", "razon.com.mx", "sdpnoticias.",
  "eleconomista.", "wsj.com", "theverge.com", "techcrunch.com", "wired.", "businessinsider.", "entrepreneur.", "merca20.", "mundoejecutivo.",
];

const hasAny = (host: string, list: string[]) => list.some((p) => (p.endsWith(".") ? host.includes(p) : hostMatches(host, [p])));

function typeOf(url: string, host: string, study: Study, competitorDomains: string[]): SourceType {
  if (hostMatches(host, study.brand.domains)) return "brand";
  if (hostMatches(host, competitorDomains)) return "competitor";
  if (hasAny(host, STORES)) return "store";
  if (hasAny(host, SOCIAL)) return "social";
  if (hasAny(host, REFERENCE) || /\.(gob|gov|edu)(\.[a-z]{2})?$/.test(host) || /\.edu$|\.gov$/.test(host)) return "reference";
  if (hasAny(host, MEDIA) || /(^|\.)(news|noticias|periodico|diario)/.test(host)) return "media";
  let path = "";
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    /* sin ruta */
  }
  if (/\/(noticias|news|nota|notas)\//.test(path) || /\/20\d\d\/\d{2}\//.test(path)) return "media";
  if (host.startsWith("blog.") || /\/(blog|guia|guias|guide|articulos?|articles?|consejos)\b/.test(path)) return "blog";
  return "other";
}

export function sourceInsights(study: Study, ok: RunRecord[]) {
  const competitorDomains = study.competitors.flatMap((c) => c.domains);
  const engines = [...new Set(ok.map((r) => r.engine))];
  const domains = new Map<string, { cited: number; consulted: number; engines: Set<EngineId>; type: SourceType; urls: Set<string> }>();
  const typeCount = new Map<SourceType, number>();
  let citations = 0;

  const row = (host: string, url: string) => {
    let d = domains.get(host);
    if (!d) {
      d = { cited: 0, consulted: 0, engines: new Set(), type: typeOf(url, host, study, competitorDomains), urls: new Set() };
      domains.set(host, d);
    }
    return d;
  };

  for (const r of ok) {
    const a = r.answer!;
    const cited = new Map<string, string>();
    for (const c of a.citations) {
      const host = hostOf(c.url);
      if (!host || hostMatches(host, IGNORED_HOSTS)) continue;
      citations++;
      const type = typeOf(c.url, host, study, competitorDomains);
      typeCount.set(type, (typeCount.get(type) ?? 0) + 1);
      if (!cited.has(host)) cited.set(host, c.url);
      row(host, c.url).urls.add(c.url);
    }
    for (const [host, url] of cited) {
      const d = row(host, url);
      d.cited++;
      d.engines.add(r.engine);
    }
    const consulted = new Set(a.sources.map((s) => hostOf(s.url)).filter((h): h is string => !!h && !hostMatches(h, IGNORED_HOSTS)));
    for (const host of consulted) {
      const d = row(host, `https://${host}/`);
      d.consulted++;
      d.engines.add(r.engine);
    }
  }

  const perEngine = engines.map((engine) => {
    const rows = ok.filter((r) => r.engine === engine);
    const cites = rows.reduce((n, r) => n + r.answer!.citations.length, 0);
    const consulted = rows.reduce((n, r) => n + r.answer!.sources.length, 0);
    return {
      engine,
      answers: rows.length,
      withCitations: rate(rows.filter((r) => r.answer!.citations.length > 0).length, rows.length),
      citationsPerAnswer: rows.length ? cites / rows.length : 0,
      consultedPerAnswer: rows.length ? consulted / rows.length : 0,
      // Gemini solo informa las páginas que cita, así que ahí "consultadas" = "citadas".
      consultedReported: engine !== "gemini",
    };
  });

  const list = [...domains.entries()]
    .map(([domain, d]) => ({
      domain,
      cited: d.cited,
      consulted: d.consulted,
      urls: d.urls.size,
      engines: [...d.engines],
      type: d.type,
      entity: [study.brand, ...study.competitors].find((e) => hostMatches(domain, e.domains))?.name ?? null,
    }))
    .sort((a, b) => b.cited - a.cited || b.consulted - a.consulted);

  return {
    answers: ok.length,
    citations,
    domains: list.length,
    withCitations: rate(ok.filter((r) => r.answer!.citations.length > 0).length, ok.length),
    types: SOURCE_TYPES.map((type) => ({ type, citations: typeCount.get(type) ?? 0 })),
    perEngine,
    top: list.slice(0, 60),
  };
}

export type FanoutInsights = ReturnType<typeof fanoutInsights>;
export type SourceInsights = ReturnType<typeof sourceInsights>;
