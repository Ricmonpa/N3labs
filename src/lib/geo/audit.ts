import { safeFetch, FetchBlockedError, HostNotFoundError, type SafeResponse } from "./safeFetch";
import { parseRobots, evaluateRobots, type ParsedRobots, type RobotsVerdict } from "./robots";
import {
  findTags,
  elementTexts,
  visibleWordCount,
  jsonLdBlocks,
  jsonLdNodes,
  nodeTypes,
  metaContent,
} from "./html";

export type Lang = "es" | "en";
export type Status = "pass" | "warn" | "fail" | "info" | "na";

export type Check = {
  id: string;
  label: string;
  status: Status;
  earned: number;
  max: number;
  detail: string;
  evidence?: string;
};

export type Category = {
  id: string;
  label: string;
  earned: number;
  max: number;
  checks: Check[];
};

export type BotPurpose = "search" | "user" | "training";

export type BotRow = {
  token: string;
  owner: string;
  purpose: BotPurpose;
  robots: RobotsVerdict | null;
};

export type AuditReport = {
  input: string;
  finalUrl: string;
  auditedAt: string;
  /** null when the page could not be read and a score would be misleading. */
  score: number | null;
  grade: string | null;
  limited: boolean;
  categories: Category[];
  bots: BotRow[];
  facts: {
    httpStatus: number;
    responseMs: number;
    words: number;
    jsonLdTypes: string[];
    llmsTxt: boolean;
    robotsStatus: number | null;
  };
};

export class AuditError extends Error {
  constructor(public code: "invalid_url" | "not_found" | "blocked_target" | "unreachable" | "http_error", public status?: number) {
    super(code);
  }
}

const UA = {
  browser:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 N3-GEO-Audit/1.0",
  "OAI-SearchBot":
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot",
  PerplexityBot:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "Claude-SearchBot":
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)",
} as const;

const LIVE_BOTS = ["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot"] as const;

const BOTS: { token: string; owner: string; purpose: BotPurpose }[] = [
  { token: "OAI-SearchBot", owner: "OpenAI · ChatGPT Search", purpose: "search" },
  { token: "Claude-SearchBot", owner: "Anthropic · Claude", purpose: "search" },
  { token: "PerplexityBot", owner: "Perplexity", purpose: "search" },
  { token: "Googlebot", owner: "Google · Search / AI Overviews", purpose: "search" },
  { token: "Bingbot", owner: "Microsoft · Bing / Copilot", purpose: "search" },
  { token: "ChatGPT-User", owner: "OpenAI", purpose: "user" },
  { token: "Claude-User", owner: "Anthropic", purpose: "user" },
  { token: "Perplexity-User", owner: "Perplexity", purpose: "user" },
  { token: "GPTBot", owner: "OpenAI", purpose: "training" },
  { token: "ClaudeBot", owner: "Anthropic", purpose: "training" },
  { token: "Google-Extended", owner: "Google · Gemini", purpose: "training" },
  { token: "Applebot-Extended", owner: "Apple", purpose: "training" },
  { token: "CCBot", owner: "Common Crawl", purpose: "training" },
  { token: "meta-externalagent", owner: "Meta", purpose: "training" },
];

const ENTITY_TYPE =
  /Organization|LocalBusiness|Person|Corporation|Store|Restaurant|Hotel|Clinic|Dentist|Physician|Attorney|Brand|Airline|Bank|School|College|University/i;

const CHALLENGE =
  /cf-chl|challenge-platform|<title>\s*Just a moment|Attention Required! \| Cloudflare|_Incapsula_Resource|px-captcha|captcha-delivery|Access Denied<\/title>/i;

function isBlocked(res: SafeResponse | null): boolean {
  if (!res) return false;
  if ([401, 403, 406, 429, 503].includes(res.status)) return true;
  return CHALLENGE.test(res.body.slice(0, 20_000));
}

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Checks a BCP 47 tag like "es-MX". Unknown codes come back from DisplayNames unchanged. */
function validateLangTag(tag: string): { problem: "malformed" | "language" | "region" | null; region?: string } {
  let locale: Intl.Locale;
  try {
    Intl.getCanonicalLocales(tag);
    locale = new Intl.Locale(tag);
  } catch {
    return { problem: "malformed" };
  }
  if (languageNames.of(locale.language) === locale.language) return { problem: "language" };
  const region = locale.region;
  if (region && /^[A-Z]{2}$/.test(region) && regionNames.of(region) === region) {
    return { problem: "region", region };
  }
  return { problem: null, region };
}

export function normalizeInput(raw: string): URL {
  let v = raw.trim();
  if (!v || v.length > 2000) throw new AuditError("invalid_url");
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    if (!u.hostname.includes(".")) throw new Error();
    u.hash = "";
    return u;
  } catch {
    throw new AuditError("invalid_url");
  }
}

async function tryFetch(url: string, ua: string): Promise<SafeResponse | null> {
  try {
    return await safeFetch(url, ua);
  } catch {
    return null;
  }
}

function sum(checks: Check[]) {
  return {
    earned: checks.filter((c) => c.status !== "na").reduce((n, c) => n + c.earned, 0),
    max: checks.filter((c) => c.status !== "na").reduce((n, c) => n + c.max, 0),
  };
}

function latestDate(values: (string | null | undefined)[]): Date | null {
  const now = Date.now() + 86_400_000;
  let best: Date | null = null;
  for (const v of values) {
    if (!v) continue;
    const d = new Date(v);
    if (Number.isNaN(d.getTime()) || d.getTime() > now) continue;
    if (!best || d > best) best = d;
  }
  return best;
}

export async function runAudit(rawInput: string, lang: Lang): Promise<AuditReport> {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const target = normalizeInput(rawInput);

  let page: SafeResponse;
  try {
    page = await safeFetch(target.toString(), UA.browser);
  } catch (err) {
    if (err instanceof HostNotFoundError) throw new AuditError("not_found");
    if (err instanceof FetchBlockedError) throw new AuditError("blocked_target");
    // Plain http sites that don't answer on https: retry once over http.
    if (target.protocol === "https:" && !/^https:\/\//i.test(rawInput.trim())) {
      const httpUrl = new URL(target.toString());
      httpUrl.protocol = "http:";
      try {
        page = await safeFetch(httpUrl.toString(), UA.browser);
      } catch {
        throw new AuditError("unreachable");
      }
    } else {
      throw new AuditError("unreachable");
    }
  }

  const final = new URL(page.finalUrl);
  const pageBlocked = isBlocked(page);
  if (!pageBlocked && page.status >= 400) throw new AuditError("http_error", page.status);

  const origin = final.origin;
  const path = final.pathname + final.search;

  const [robotsRes, llmsRes, ...liveRes] = await Promise.all([
    tryFetch(`${origin}/robots.txt`, UA.browser),
    tryFetch(`${origin}/llms.txt`, UA.browser),
    ...LIVE_BOTS.map((b) => tryFetch(final.toString(), UA[b])),
  ]);

  // ---------- robots.txt ----------
  let robots: ParsedRobots | null = null;
  let robotsNote: string;
  const robotsStatus = robotsRes?.status ?? null;
  const robotsIsHtml = !!robotsRes && /<html[\s>]/i.test(robotsRes.body.slice(0, 2000));

  if (!robotsRes) {
    robotsNote = L("No pudimos descargar robots.txt.", "We couldn't download robots.txt.");
  } else if (robotsRes.status >= 500) {
    robotsNote = L(
      `robots.txt respondió ${robotsRes.status}. Varios buscadores tratan un error del servidor como "no rastrear nada".`,
      `robots.txt returned ${robotsRes.status}. Several crawlers treat a server error as "crawl nothing".`,
    );
  } else if (robotsRes.status >= 400 || robotsIsHtml) {
    robots = parseRobots("");
    robotsNote = robotsIsHtml
      ? L("No hay robots.txt real (el servidor devuelve una página HTML). Se asume acceso libre.", "No real robots.txt (the server returns an HTML page). Open access is assumed.")
      : L(`No hay robots.txt (${robotsRes.status}). Se asume acceso libre.`, `No robots.txt (${robotsRes.status}). Open access is assumed.`);
  } else {
    robots = parseRobots(robotsRes.body);
    robotsNote = L("robots.txt encontrado y evaluado.", "robots.txt found and evaluated.");
  }

  const bots: BotRow[] = BOTS.map((b) => ({
    ...b,
    robots: robots ? evaluateRobots(robots, b.token, path) : null,
  }));

  // ---------- A. Acceso de bots ----------
  const accessChecks: Check[] = [
    {
      id: "robots-file",
      label: L("Archivo robots.txt", "robots.txt file"),
      status: "info",
      earned: 0,
      max: 0,
      detail: robotsNote,
      evidence: `${origin}/robots.txt → ${robotsStatus ?? L("sin respuesta", "no response")}`,
    },
  ];

  for (const b of bots.filter((x) => x.purpose === "search")) {
    const v = b.robots;
    accessChecks.push({
      id: `robots-${b.token}`,
      label: L(`${b.token} puede rastrear esta página`, `${b.token} may crawl this page`),
      status: !v ? "warn" : v.allowed ? "pass" : "fail",
      earned: v?.allowed ? 4 : 0,
      max: 4,
      detail: !v
        ? L("No se pudo confirmar porque robots.txt no respondió bien.", "Couldn't confirm: robots.txt didn't respond properly.")
        : v.allowed
          ? L(`Permitido. ${b.owner} puede leer y citar esta página.`, `Allowed. ${b.owner} can read and cite this page.`)
          : L(
              `Bloqueado. ${b.owner} no puede leer esta página, así que no la puede citar.`,
              `Blocked. ${b.owner} can't read this page, so it can't cite it.`,
            ),
      evidence: v
        ? `${L("Grupo", "Group")}: ${v.group ?? L("ninguno", "none")} · ${L("Regla", "Rule")}: ${v.rule ?? L("ninguna aplica", "none applies")}`
        : undefined,
    });
  }

  const liveSummary = LIVE_BOTS.map((b, i) => `${b}: ${liveRes[i]?.status ?? "—"}`).join(" · ");
  const liveBlocked = LIVE_BOTS.filter((_, i) => liveRes[i] === null || isBlocked(liveRes[i]));
  if (pageBlocked) {
    accessChecks.push({
      id: "live-bots",
      label: L("Respuesta real del servidor a los bots de IA", "Real server response to AI bots"),
      status: "na",
      earned: 0,
      max: 10,
      detail: L(
        "El sitio también bloqueó nuestra visita normal, así que no podemos saber si el bloqueo es específico para bots de IA. Suele ser un firewall o Cloudflare y conviene revisarlo.",
        "The site also blocked our regular visit, so we can't tell whether the block targets AI bots specifically. It's usually a firewall or Cloudflare and worth reviewing.",
      ),
      evidence: `${L("Navegador", "Browser")}: ${page.status} · ${liveSummary}`,
    });
  } else {
    const ok = LIVE_BOTS.length - liveBlocked.length;
    accessChecks.push({
      id: "live-bots",
      label: L("Respuesta real del servidor a los bots de IA", "Real server response to AI bots"),
      status: liveBlocked.length === 0 ? "pass" : ok === 0 ? "fail" : "warn",
      earned: Math.round((10 * ok) / LIVE_BOTS.length),
      max: 10,
      detail:
        liveBlocked.length === 0
          ? L(
              "Pedimos la página identificándonos como bots de búsqueda de IA y el servidor respondió normal.",
              "We requested the page identifying as AI search bots and the server answered normally.",
            )
          : L(
              `El servidor rechazó o puso un reto a: ${liveBlocked.join(", ")}. Es típico de Cloudflare o de un firewall, y deja al sitio fuera de las citas aunque robots.txt lo permita. Ojo: los bots reales también se verifican por IP, así que tómalo como una señal fuerte, no como una prueba definitiva.`,
              `The server rejected or challenged: ${liveBlocked.join(", ")}. This is typical of Cloudflare or a firewall, and it keeps the site out of citations even if robots.txt allows it. Note: real bots are also verified by IP, so treat this as a strong signal, not definitive proof.`,
            ),
      evidence: `${L("Navegador", "Browser")}: ${page.status} · ${liveSummary}`,
    });
  }

  // Page content is unreadable: return a partial report without a score.
  const html = pageBlocked ? "" : page.body;
  const ctype = page.headers.get("content-type") ?? "";
  const isHtml = /html/i.test(ctype) || /<html[\s>]/i.test(html.slice(0, 5000));
  const na = pageBlocked;

  const metas = findTags(html, "meta");
  const links = findTags(html, "link");
  const words = isHtml ? visibleWordCount(html) : 0;

  // ---------- B. Contenido legible sin JavaScript ----------
  const robotsMeta = [metaContent(metas, "robots"), metaContent(metas, "googlebot"), page.headers.get("x-robots-tag")]
    .filter(Boolean)
    .join(", ")
    .toLowerCase();
  const noindex = /noindex|\bnone\b/.test(robotsMeta);
  const nosnippet = /nosnippet|max-snippet\s*:\s*0/.test(robotsMeta);
  const spaShell =
    /<div[^>]+id=["'](root|app|__next|__nuxt)["'][^>]*>\s*<\/div>/i.test(html) || /<app-root[^>]*>\s*<\/app-root>/i.test(html);

  const contentChecks: Check[] = [
    {
      id: "words",
      label: L("Texto visible sin ejecutar JavaScript", "Visible text without running JavaScript"),
      status: na ? "na" : words >= 300 ? "pass" : words >= 100 ? "warn" : "fail",
      earned: words >= 300 ? 12 : words >= 100 ? 6 : 0,
      max: 12,
      detail: !isHtml
        ? L("La respuesta no es HTML.", "The response isn't HTML.")
        : words >= 300
          ? L("Hay suficiente texto en el HTML inicial. Los bots que no ejecutan JavaScript ven el contenido.", "There's enough text in the initial HTML. Bots that don't run JavaScript see the content.")
          : L(
              `Solo hay ${words} palabras en el HTML inicial. Varios bots de IA no ejecutan JavaScript, así que ven la página casi vacía.${spaShell ? " Parece una app que se arma en el navegador (contenedor vacío)." : ""} La solución es renderizar en el servidor (SSR/SSG).`,
              `Only ${words} words in the initial HTML. Several AI bots don't run JavaScript, so they see an almost empty page.${spaShell ? " It looks like a client-rendered app (empty container)." : ""} The fix is server rendering (SSR/SSG).`,
            ),
      evidence: `${words} ${L("palabras", "words")}${page.truncated ? L(" (HTML recortado a 3 MB)", " (HTML truncated at 3 MB)") : ""}`,
    },
    {
      id: "indexable",
      label: L("La página permite ser indexada", "The page allows indexing"),
      status: na ? "na" : noindex ? "fail" : nosnippet ? "warn" : "pass",
      earned: noindex ? 0 : nosnippet ? 2 : 5,
      max: 5,
      detail: noindex
        ? L("Tiene una instrucción noindex. Los buscadores la sacan de su índice, y sin índice no hay cita.", "It has a noindex directive. Search engines drop it from their index, and without an index there's no citation.")
        : nosnippet
          ? L("Tiene nosnippet, que impide mostrar fragmentos, incluidos los de respuestas con IA.", "It has nosnippet, which blocks showing excerpts, including in AI answers.")
          : L("No hay instrucciones que bloqueen la indexación.", "No directives block indexing."),
      evidence: robotsMeta || L("sin meta robots ni X-Robots-Tag", "no meta robots or X-Robots-Tag"),
    },
    {
      id: "https",
      label: "HTTPS",
      status: na ? "na" : final.protocol === "https:" ? "pass" : "fail",
      earned: final.protocol === "https:" ? 3 : 0,
      max: 3,
      detail:
        final.protocol === "https:"
          ? L("La página se sirve con HTTPS.", "The page is served over HTTPS.")
          : L("La página no usa HTTPS, que es una señal básica de confianza.", "The page doesn't use HTTPS, a basic trust signal."),
      evidence: final.toString(),
    },
  ];

  // ---------- C. Entidad y datos estructurados ----------
  const blocks = jsonLdBlocks(html);
  const validBlocks = blocks.filter((b) => b.parsed !== null);
  const nodes = validBlocks.flatMap((b) => jsonLdNodes(b.parsed));
  const types = [...new Set(nodes.flatMap(nodeTypes))];
  const entityNodes = nodes.filter((n) => nodeTypes(n).some((t) => ENTITY_TYPE.test(t)));
  const sameAs = [
    ...new Set(
      entityNodes.flatMap((n) => {
        const s = n.sameAs;
        return (Array.isArray(s) ? s : [s]).filter((x): x is string => typeof x === "string");
      }),
    ),
  ];
  const ogTitle = metaContent(metas, "og:title");
  const ogType = metaContent(metas, "og:type");
  const ogImage = metaContent(metas, "og:image");

  const entityChecks: Check[] = [
    {
      id: "jsonld",
      label: L("Datos estructurados (JSON-LD)", "Structured data (JSON-LD)"),
      status: na ? "na" : blocks.length === 0 ? "fail" : validBlocks.length < blocks.length ? "warn" : "pass",
      earned: blocks.length === 0 ? 0 : validBlocks.length < blocks.length ? 4 : 8,
      max: 8,
      detail:
        blocks.length === 0
          ? L(
              "No hay JSON-LD. Los modelos leen el texto, pero los índices y grafos de conocimiento que deciden qué les llega usan estos datos para entender quién eres.",
              "No JSON-LD. Models read the text, but the indexes and knowledge graphs that decide what reaches them use this data to understand who you are.",
            )
          : validBlocks.length < blocks.length
            ? L(`${blocks.length - validBlocks.length} de ${blocks.length} bloques tienen JSON inválido y se ignoran.`, `${blocks.length - validBlocks.length} of ${blocks.length} blocks have invalid JSON and are ignored.`)
            : L(`${blocks.length} bloque(s) válidos.`, `${blocks.length} valid block(s).`),
      evidence: types.length ? `@type: ${types.join(", ")}` : undefined,
    },
    {
      id: "entity",
      label: L("Identidad de la marca declarada", "Brand identity declared"),
      status: na ? "na" : entityNodes.length ? "pass" : "fail",
      earned: entityNodes.length ? 6 : 0,
      max: 6,
      detail: entityNodes.length
        ? L("Hay una entidad declarada (organización, negocio o persona).", "An entity is declared (organization, business or person).")
        : L(
            "No se declara quién está detrás del sitio (Organization, LocalBusiness o Person). Sin esto es más fácil que te confundan con otra marca.",
            "The site doesn't declare who's behind it (Organization, LocalBusiness or Person). Without it, it's easier to be confused with another brand.",
          ),
      evidence: entityNodes.length
        ? entityNodes
            .slice(0, 3)
            .map((n) => `${nodeTypes(n).join("/")}${typeof n.name === "string" ? ` · ${n.name}` : ""}`)
            .join(" | ")
        : undefined,
    },
    {
      id: "sameas",
      label: L("Perfiles oficiales enlazados (sameAs)", "Official profiles linked (sameAs)"),
      status: na ? "na" : sameAs.length >= 2 ? "pass" : sameAs.length === 1 ? "warn" : "fail",
      earned: sameAs.length >= 2 ? 3 : sameAs.length === 1 ? 1 : 0,
      max: 3,
      detail: sameAs.length
        ? L(`${sameAs.length} perfil(es) enlazados. Ayudan a unir tu marca con sus redes, Wikipedia o Wikidata.`, `${sameAs.length} profile(s) linked. They connect your brand to its socials, Wikipedia or Wikidata.`)
        : L("No hay sameAs. Es la forma de decirle a las máquinas qué perfiles son tuyos.", "No sameAs. It's how you tell machines which profiles are yours."),
      evidence: sameAs.length ? sameAs.slice(0, 5).join(" · ") : undefined,
    },
    {
      id: "opengraph",
      label: "Open Graph",
      status: na ? "na" : ogTitle && (ogType || ogImage) ? "pass" : ogTitle || ogImage ? "warn" : "fail",
      earned: ogTitle && (ogType || ogImage) ? 3 : ogTitle || ogImage ? 1 : 0,
      max: 3,
      detail: L("Metadatos que resumen la página para plataformas y agentes.", "Metadata that summarizes the page for platforms and agents."),
      evidence: [ogTitle && `og:title="${ogTitle}"`, ogType && `og:type=${ogType}`, ogImage && "og:image ✓"].filter(Boolean).join(" · ") || undefined,
    },
  ];

  // ---------- D. Estructura del contenido ----------
  const title = elementTexts(html, "title")[0] ?? "";
  const description = metaContent(metas, "description") ?? "";
  const h1s = elementTexts(html, "h1").filter(Boolean);
  const h2s = elementTexts(html, "h2").filter(Boolean);
  const canonical = links.find((l) => (l.attrs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"))?.attrs.href;
  const htmlLang = findTags(html, "html")[0]?.attrs.lang;
  const { problem: langProblem, region: htmlLangRegion } = htmlLang ? validateLangTag(htmlLang) : { problem: null, region: undefined };

  let sitemapFound = !!robots?.sitemaps.length;
  let sitemapEvidence = robots?.sitemaps[0] ?? "";
  if (!sitemapFound && !na) {
    const sm = await tryFetch(`${origin}/sitemap.xml`, UA.browser);
    if (sm && sm.status === 200 && /<(urlset|sitemapindex)\b/i.test(sm.body.slice(0, 2000))) {
      sitemapFound = true;
      sitemapEvidence = `${origin}/sitemap.xml`;
    }
  }

  const structureChecks: Check[] = [
    {
      id: "title",
      label: L("Título de la página", "Page title"),
      status: na ? "na" : !title ? "fail" : title.length >= 10 && title.length <= 70 ? "pass" : "warn",
      earned: !title ? 0 : title.length >= 10 && title.length <= 70 ? 4 : 2,
      max: 4,
      detail: !title
        ? L("La página no tiene <title>.", "The page has no <title>.")
        : L(`${title.length} caracteres (lo ideal es entre 10 y 70).`, `${title.length} characters (10–70 is ideal).`),
      evidence: title || undefined,
    },
    {
      id: "description",
      label: L("Meta descripción", "Meta description"),
      status: na ? "na" : !description ? "fail" : description.length >= 50 && description.length <= 170 ? "pass" : "warn",
      earned: !description ? 0 : description.length >= 50 && description.length <= 170 ? 3 : 1,
      max: 3,
      detail: !description
        ? L("No hay meta descripción, que es el resumen que usan muchos sistemas.", "No meta description, the summary many systems use.")
        : L(`${description.length} caracteres (lo ideal es entre 50 y 170).`, `${description.length} characters (50–170 is ideal).`),
      evidence: description || undefined,
    },
    {
      id: "h1",
      label: L("Un solo encabezado principal (H1)", "A single main heading (H1)"),
      status: na ? "na" : h1s.length === 1 ? "pass" : h1s.length > 1 ? "warn" : "fail",
      earned: h1s.length === 1 ? 4 : h1s.length > 1 ? 2 : 0,
      max: 4,
      detail:
        h1s.length === 1
          ? L("Hay un H1 que dice de qué trata la página.", "There's one H1 stating what the page is about.")
          : h1s.length > 1
            ? L(`Hay ${h1s.length} H1. Con varios, el tema principal queda ambiguo.`, `There are ${h1s.length} H1s. With several, the main topic is ambiguous.`)
            : L("No hay H1 en el HTML inicial.", "No H1 in the initial HTML."),
      evidence: h1s.slice(0, 3).join(" | ") || undefined,
    },
    {
      id: "h2",
      label: L("Secciones con subtítulos (H2)", "Sections with subheadings (H2)"),
      status: na ? "na" : h2s.length >= 2 ? "pass" : h2s.length === 1 ? "warn" : "fail",
      earned: h2s.length >= 2 ? 3 : h2s.length === 1 ? 1 : 0,
      max: 3,
      detail: L(
        "Las IAs recuperan fragmentos, no páginas enteras. Los subtítulos claros separan el contenido en bloques que se pueden citar solos.",
        "AIs retrieve passages, not whole pages. Clear subheadings split content into blocks that can be cited on their own.",
      ),
      evidence: `${h2s.length} H2${h2s.length ? ` · ${h2s.slice(0, 3).join(" | ")}` : ""}`,
    },
    {
      id: "canonical",
      label: L("URL canónica", "Canonical URL"),
      status: na ? "na" : canonical ? "pass" : "fail",
      earned: canonical ? 2 : 0,
      max: 2,
      detail: canonical
        ? L("Declara cuál es la versión oficial de la página.", "It declares the official version of the page.")
        : L("No declara URL canónica, así que puede haber duplicados compitiendo entre sí.", "No canonical URL, so duplicates may compete with each other."),
      evidence: canonical,
    },
    {
      id: "lang",
      label: L("Idioma declarado", "Language declared"),
      status: na ? "na" : !htmlLang ? "fail" : langProblem ? "warn" : "pass",
      earned: !htmlLang ? 0 : langProblem ? 1 : 2,
      max: 2,
      detail: !htmlLang
        ? L("No declara idioma, lo que dificulta mostrarla en el mercado correcto.", "No language declared, which makes it harder to surface in the right market.")
        : langProblem === "malformed"
          ? L(
              "El código de idioma está mal escrito. Debe usar guion, por ejemplo es-MX (no es_MX).",
              "The language code is malformed. It must use a hyphen, e.g. es-MX (not es_MX).",
            )
          : langProblem === "language"
            ? L("El código de idioma no corresponde a ningún idioma conocido.", "The language code doesn't match any known language.")
            : langProblem === "region"
              ? L(
                  `El código de país "${htmlLangRegion}" no existe, así que el idioma declarado es inválido. Por ejemplo: es-MX para México o en-US para Estados Unidos.`,
                  `The country code "${htmlLangRegion}" doesn't exist, so the declared language is invalid. For example: es-MX for Mexico or en-US for the United States.`,
                )
              : L("El idioma está declarado en la etiqueta <html> y el código es válido.", "Language is declared on the <html> tag and the code is valid."),
      evidence: htmlLang ? `lang="${htmlLang}"` : undefined,
    },
    {
      id: "sitemap",
      label: "Sitemap",
      status: na ? "na" : sitemapFound ? "pass" : "fail",
      earned: sitemapFound ? 2 : 0,
      max: 2,
      detail: sitemapFound
        ? L("Hay un sitemap para que los rastreadores encuentren todas las páginas.", "There's a sitemap so crawlers can find every page.")
        : L("No encontramos sitemap (ni en robots.txt ni en /sitemap.xml).", "No sitemap found (neither in robots.txt nor at /sitemap.xml)."),
      evidence: sitemapEvidence || undefined,
    },
  ];

  // ---------- E. Frescura ----------
  const dateCandidates = [
    ...nodes.flatMap((n) => [n.dateModified, n.datePublished, n.uploadDate].filter((x): x is string => typeof x === "string")),
    metaContent(metas, "article:modified_time"),
    metaContent(metas, "article:published_time"),
    metaContent(metas, "og:updated_time"),
    ...findTags(html, "time").map((t) => t.attrs.datetime),
  ];
  const latest = latestDate(dateCandidates);
  const ageDays = latest ? Math.floor((Date.now() - latest.getTime()) / 86_400_000) : null;
  const isHome = final.pathname === "/" || final.pathname === "";

  const freshnessChecks: Check[] = [
    {
      id: "freshness",
      label: L("Fechas de publicación o actualización", "Publication or update dates"),
      // A homepage without dates is normal, so it's reported but not scored.
      status: na ? "na" : ageDays === null ? (isHome ? "info" : "warn") : ageDays <= 365 ? "pass" : ageDays <= 730 ? "warn" : "fail",
      earned: ageDays === null ? 0 : 4 + (ageDays <= 365 ? 6 : ageDays <= 730 ? 3 : 0),
      max: ageDays === null && isHome ? 0 : 10,
      detail:
        ageDays === null
          ? L(
              `No encontramos fechas legibles por máquina.${isHome ? " En una página de inicio es normal y no resta puntos; en artículos, fichas y guías sí importa." : " Las IAs prefieren información que pueden fechar."}`,
              `No machine-readable dates found.${isHome ? " That's normal on a homepage and costs no points; on articles, product pages and guides it matters." : " AIs prefer information they can date."}`,
            )
          : L(`La fecha más reciente es de hace ${ageDays} días.`, `The most recent date is ${ageDays} days old.`),
      evidence: latest ? latest.toISOString().slice(0, 10) : undefined,
    },
  ];

  // ---------- Informativo ----------
  const llmsTxt = !!llmsRes && llmsRes.status === 200 && !/<html[\s>]/i.test(llmsRes.body.slice(0, 2000));
  const infoChecks: Check[] = [
    {
      id: "llms-txt",
      label: "llms.txt",
      status: "info",
      earned: 0,
      max: 0,
      detail: L(
        "Es una propuesta de estándar. Ningún proveedor grande ha confirmado que lo use, así que no suma puntos: solo lo reportamos.",
        "It's a proposed standard. No major provider has confirmed using it, so it scores nothing: we just report it.",
      ),
      evidence: llmsTxt ? `${origin}/llms.txt ✓` : L("no encontrado", "not found"),
    },
    {
      id: "speed",
      label: L("Tiempo de respuesta", "Response time"),
      status: "info",
      earned: 0,
      max: 0,
      detail: L("Tiempo total hasta recibir el HTML, incluidas las redirecciones.", "Total time to receive the HTML, including redirects."),
      evidence: `${page.ms} ms`,
    },
  ];

  const unreadable = L(
    "No se pudo evaluar porque el servidor no nos dejó leer la página.",
    "Couldn't be assessed because the server didn't let us read the page.",
  );
  const make = (id: string, label: string, raw: Check[]): Category => {
    // Checks skipped for an unreadable page must not show evidence computed from an empty body.
    const checks = raw.map((ch) =>
      ch.status === "na" && ch.id !== "live-bots" ? { ...ch, detail: unreadable, evidence: undefined } : ch,
    );
    return { id, label, checks, ...sum(checks) };
  };

  const categories = [
    make("access", L("Acceso de los bots de IA", "AI bot access"), accessChecks),
    make("content", L("Contenido legible sin JavaScript", "Content readable without JavaScript"), contentChecks),
    make("entity", L("Entidad y datos estructurados", "Entity and structured data"), entityChecks),
    make("structure", L("Estructura del contenido", "Content structure"), structureChecks),
    make("freshness", L("Frescura", "Freshness"), freshnessChecks),
    make("info", L("Informativo (no suma puntos)", "Informational (not scored)"), infoChecks),
  ];

  const totals = sum(categories.flatMap((c) => c.checks));
  const score = na || totals.max === 0 ? null : Math.round((totals.earned / totals.max) * 100);
  const grade =
    score === null
      ? null
      : score >= 90
        ? L("Excelente", "Excellent")
        : score >= 70
          ? L("Bueno", "Good")
          : score >= 40
            ? L("Mejorable", "Needs work")
            : L("Crítico", "Critical");

  return {
    input: rawInput.trim(),
    finalUrl: final.toString(),
    auditedAt: new Date().toISOString(),
    score,
    grade,
    limited: na,
    categories,
    bots,
    facts: {
      httpStatus: page.status,
      responseMs: page.ms,
      words,
      jsonLdTypes: types,
      llmsTxt,
      robotsStatus,
    },
  };
}
