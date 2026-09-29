import { safeFetch, type SafeResponse } from "./safeFetch";
import { findTags, jsonLdBlocks, jsonLdNodes, nodeTypes } from "./html";

/**
 * Datos estructurados más allá de la portada: toma del sitemap (y de los links de la portada)
 * una ficha de producto, un servicio, contacto, "nosotros" y un artículo, lee su JSON-LD y dice
 * qué tiene, qué le falta según el tipo de página y qué está mal armado.
 * No suma a la calificación técnica: es el detalle que se le enseña al cliente.
 */

export type PageKind = "home" | "product" | "service" | "contact" | "about" | "article";
export type FindingStatus = "pass" | "warn" | "fail" | "info";
export type Finding = { status: FindingStatus; text: string };

export type StructuredPage = {
  kind: PageKind;
  url: string;
  /** null when the page couldn't be fetched. */
  httpStatus: number | null;
  blocks: number;
  invalid: number;
  types: string[];
  findings: Finding[];
  /** The most relevant node, pretty-printed and trimmed, to show as it is. */
  sample: string | null;
};

export type StructuredReport = {
  pages: StructuredPage[];
  /** URLs read from the sitemap, before picking; null when there was no sitemap. */
  sitemapUrls: number | null;
  /** Page kinds we looked for but the site doesn't seem to have. */
  notFound: PageKind[];
};

type Lang = "es" | "en";
type Node = Record<string, unknown>;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 N3-GEO-Audit/1.0";
/** Everything here shares one time budget, so the audit never waits long for it. */
const BUDGET_MS = 20_000;
const MAX_CHILD_SITEMAPS = 3;
const SAMPLE_CHARS = 1400;

const KIND_PATTERNS: [Exclude<PageKind, "home">, RegExp][] = [
  ["product", /\/(products?|productos?|item|items|p|articulo|refaccion(es)?|shop\/[^/]+|tienda\/[^/]+)\/[^/]+\/?$/i],
  ["article", /\/(blogs?|articulos|noticias|news|posts?|guias?|recursos)\/[^/]+\/?$/i],
  ["service", /\/(servicios?|services?|soluciones|solutions?)(\/[^/]+)?\/?$/i],
  ["contact", /\/(contacto|contactanos|contact|contact-us|sucursales|ubicaciones|locations?)\/?$/i],
  ["about", /\/(nosotros|quienes-somos|about|about-us|acerca(-de)?|empresa|us|conocenos)\/?$/i],
];

/** How many pages of each kind we read. */
const WANTED: Record<Exclude<PageKind, "home">, number> = { product: 2, service: 1, contact: 1, about: 1, article: 1 };

const ENTITY = /Organization|LocalBusiness|Corporation|Store|Restaurant|Hotel|Clinic|Dentist|Physician|Attorney|Airline|Bank|School|College|University|Person/i;

/** Listings, tags and pagination look like content pages by their path but aren't. */
const LISTING = /\/(tags?|etiquetas?|category|categor[ií]as?|categories|page|pagina|author|autor|feed)\/|\/(blogs?|news|noticias|articulos|best-sellers|ofertas|all|todos|search|buscar)\/?$/i;

function classify(path: string): Exclude<PageKind, "home"> | null {
  if (LISTING.test(path)) return null;
  for (const [kind, re] of KIND_PATTERNS) if (re.test(path)) return kind;
  return null;
}

function sameSite(a: string, b: string) {
  return a.replace(/^www\./, "") === b.replace(/^www\./, "");
}

async function fetchWithin(url: string, deadline: number): Promise<SafeResponse | null> {
  const left = deadline - Date.now();
  if (left < 1500) return null;
  try {
    return await Promise.race([
      safeFetch(url, UA),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), left)),
    ]);
  } catch {
    return null;
  }
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/** URLs from the sitemap; follows an index into a few child sitemaps (pages and products first). */
async function sitemapUrls(sitemaps: string[], deadline: number): Promise<string[] | null> {
  if (!sitemaps.length) return null;
  const first = await fetchWithin(sitemaps[0], deadline);
  if (!first || first.status >= 400) return null;
  if (!/<sitemapindex\b/i.test(first.body.slice(0, 5000))) return locs(first.body);

  const rank = (u: string) => (/product|producto/i.test(u) ? 0 : /page|pagina/i.test(u) ? 1 : /post|blog/i.test(u) ? 2 : 3);
  const children = locs(first.body)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, MAX_CHILD_SITEMAPS);
  const bodies = await Promise.all(children.map((u) => fetchWithin(u, deadline)));
  return bodies.flatMap((b) => (b && b.status < 400 ? locs(b.body) : []));
}

function linksFrom(html: string, base: URL): string[] {
  const out: string[] = [];
  for (const a of findTags(html, "a")) {
    try {
      const u = new URL(a.attrs.href ?? "", base);
      u.hash = "";
      out.push(u.toString());
    } catch {
      /* not a link */
    }
  }
  return out;
}

/** The locale/channel part of the home URL (e.g. /es/ or /default-channel/es/), to stay in one language. */
function localePrefix(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts.length ? `/${parts.join("/")}/` : "/";
}

function pick(candidates: string[], home: URL): Map<Exclude<PageKind, "home">, string[]> {
  const prefix = localePrefix(home.pathname);
  const byKind = new Map<Exclude<PageKind, "home">, string[]>();
  const seen = new Set<string>([home.toString()]);
  for (const raw of candidates) {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    u.search = "";
    if (!sameSite(u.hostname, home.hostname) || seen.has(u.toString())) continue;
    seen.add(u.toString());
    const kind = classify(u.pathname);
    if (!kind) continue;
    const list = byKind.get(kind) ?? [];
    list.push(u.toString());
    byKind.set(kind, list);
  }
  const chosen = new Map<Exclude<PageKind, "home">, string[]>();
  for (const [kind, list] of byKind) {
    // Same language as the home first; then spread picks across the list, not just the first ones.
    const inLocale = list.filter((u) => new URL(u).pathname.startsWith(prefix));
    const pool = inLocale.length ? inLocale : list;
    const n = WANTED[kind];
    const step = Math.max(1, Math.floor(pool.length / n));
    chosen.set(
      kind,
      Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[Math.min(i * step + Math.floor(step / 2), pool.length - 1)]),
    );
  }
  return chosen;
}

const has = (v: unknown) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

function asNodes(v: unknown): Node[] {
  return (Array.isArray(v) ? v : [v]).filter((x): x is Node => !!x && typeof x === "object");
}

function ofType(nodes: Node[], re: RegExp) {
  return nodes.filter((n) => nodeTypes(n).some((t) => re.test(t)));
}

function sample(node: Node | undefined): string | null {
  if (!node) return null;
  const text = JSON.stringify(node, null, 2);
  return text.length > SAMPLE_CHARS ? `${text.slice(0, SAMPLE_CHARS)}\n…` : text;
}

function evaluate(kind: PageKind, nodes: Node[], L: (es: string, en: string) => string): { findings: Finding[]; main?: Node } {
  const f: Finding[] = [];
  const add = (status: FindingStatus, es: string, en: string) => f.push({ status, text: L(es, en) });
  const entities = ofType(nodes, ENTITY);
  const breadcrumbs = ofType(nodes, /^BreadcrumbList$/i);

  if (kind === "home" || kind === "about") {
    const org = entities[0];
    if (!org) {
      add(kind === "home" ? "fail" : "warn", "No declara quién es la empresa (Organization o LocalBusiness).", "Doesn't declare who the business is (Organization or LocalBusiness).");
    } else {
      add("pass", `Declara la empresa como ${nodeTypes(org).join("/")}.`, `Declares the business as ${nodeTypes(org).join("/")}.`);
      if (!has(org.logo)) add("warn", "La empresa no trae logo.", "The business has no logo.");
      if (!has(org.sameAs)) add("warn", "No enlaza sus perfiles oficiales (sameAs).", "Doesn't link its official profiles (sameAs).");
      if (!has(org.address) && !has(org.department) && !has(org.location)) add("info", "No trae dirección ni sucursales.", "No address or branches.");
    }
    if (kind === "home" && !ofType(nodes, /^WebSite$/i).length) add("info", "Sin WebSite (nombre del sitio y buscador interno).", "No WebSite (site name and internal search).");
    return { findings: f, main: org };
  }

  if (kind === "product") {
    const product = ofType(nodes, /^(Product|ProductGroup|IndividualProduct|ProductModel)$/i)[0];
    if (!product) {
      add("fail", "La ficha no declara el producto (Product): para las máquinas no hay precio, marca ni existencia.", "The page doesn't declare the product (Product): machines see no price, brand or stock.");
      return { findings: f };
    }
    add("pass", "Declara el producto (Product).", "Declares the product (Product).");
    const offer = asNodes(product.offers)[0];
    if (!offer) add("fail", "El producto no trae oferta (offers): falta precio y existencia.", "The product has no offer (offers): no price or stock.");
    else {
      const price = offer.price ?? offer.lowPrice;
      if (!has(price)) add("fail", "La oferta no trae precio.", "The offer has no price.");
      if (!has(offer.priceCurrency)) add("fail", "El precio no dice la moneda (priceCurrency).", "The price has no currency (priceCurrency).");
      if (!has(offer.availability)) add("warn", "No dice si hay existencia (availability).", "Doesn't say whether it's in stock (availability).");
      if (has(price) && has(offer.priceCurrency) && has(offer.availability)) add("pass", "Precio, moneda y existencia declarados.", "Price, currency and stock declared.");
    }
    if (!has(product.brand)) add("warn", "No dice la marca (brand).", "No brand.");
    if (!has(product.sku) && !has(product.mpn) && !has(product.gtin13) && !has(product.gtin) && !has(product.gtin12))
      add("warn", "Sin número de parte ni código (sku, mpn o gtin).", "No part number or code (sku, mpn or gtin).");
    if (!has(product.image)) add("warn", "Sin imagen del producto.", "No product image.");
    if (!has(product.description)) add("warn", "Sin descripción del producto.", "No product description.");
    if (!breadcrumbs.length) add("info", "Sin ruta de navegación (BreadcrumbList).", "No breadcrumb trail (BreadcrumbList).");
    return { findings: f, main: product };
  }

  if (kind === "service") {
    const service = ofType(nodes, /^Service$|Service$/)[0];
    if (!service) add("warn", "No declara el servicio (Service): qué ofrece, dónde y a quién.", "Doesn't declare the service (Service): what, where and for whom.");
    else {
      add("pass", "Declara el servicio (Service).", "Declares the service (Service).");
      if (!has(service.areaServed)) add("info", "No dice en qué zonas da el servicio (areaServed).", "Doesn't say where it's offered (areaServed).");
      if (!has(service.provider)) add("info", "No liga el servicio con la empresa (provider).", "Doesn't tie the service to the business (provider).");
    }
    if (ofType(nodes, /^FAQPage$/i).length) add("pass", "Tiene preguntas frecuentes marcadas (FAQPage).", "Has marked-up FAQs (FAQPage).");
    return { findings: f, main: service ?? entities[0] };
  }

  if (kind === "contact") {
    const place = entities.find((n) => has(n.address) || has(n.telephone) || has(n.contactPoint)) ?? entities[0];
    if (!place) add("warn", "Contacto sin datos estructurados de la empresa: dirección, teléfono y horario quedan solo como texto.", "Contact page without business data: address, phone and hours are only plain text.");
    else {
      add("pass", `Declara la empresa (${nodeTypes(place).join("/")}).`, `Declares the business (${nodeTypes(place).join("/")}).`);
      if (!has(place.address)) add("warn", "No trae dirección (address).", "No address.");
      if (!has(place.telephone) && !has(place.contactPoint)) add("warn", "No trae teléfono (telephone o contactPoint).", "No phone (telephone or contactPoint).");
    }
    return { findings: f, main: place };
  }

  // article
  const article = ofType(nodes, /Article$|^BlogPosting$|^NewsArticle$/)[0];
  if (!article) add("fail", "El artículo no se declara como Article: sin autor ni fecha legibles.", "The article isn't declared as Article: no readable author or date.");
  else {
    add("pass", `Declara el artículo (${nodeTypes(article).join("/")}).`, `Declares the article (${nodeTypes(article).join("/")}).`);
    if (!has(article.datePublished) && !has(article.dateModified)) add("warn", "Sin fecha de publicación.", "No publication date.");
    if (!has(article.author)) add("warn", "Sin autor.", "No author.");
  }
  return { findings: f, main: article };
}

function readPage(kind: PageKind, url: string, res: SafeResponse | null, L: (es: string, en: string) => string): StructuredPage {
  if (!res || res.status >= 400) {
    return {
      kind,
      url,
      httpStatus: res?.status ?? null,
      blocks: 0,
      invalid: 0,
      types: [],
      findings: [{ status: "info", text: L(`No se pudo leer la página${res ? ` (respondió ${res.status})` : ""}.`, `Couldn't read the page${res ? ` (returned ${res.status})` : ""}.`) }],
      sample: null,
    };
  }
  const blocks = jsonLdBlocks(res.body);
  const valid = blocks.filter((b) => b.parsed !== null);
  const nodes = valid.flatMap((b) => jsonLdNodes(b.parsed));
  const { findings, main } = evaluate(kind, nodes, L);
  if (blocks.length === 0) findings.unshift({ status: "fail", text: L("No tiene ningún bloque JSON-LD.", "Has no JSON-LD block at all.") });
  if (valid.length < blocks.length)
    findings.unshift({
      status: "fail",
      text: L(`${blocks.length - valid.length} bloque(s) con JSON inválido: los buscadores los ignoran.`, `${blocks.length - valid.length} block(s) with invalid JSON: search engines ignore them.`),
    });
  return {
    kind,
    url: res.finalUrl || url,
    httpStatus: res.status,
    blocks: blocks.length,
    invalid: blocks.length - valid.length,
    types: [...new Set(nodes.flatMap(nodeTypes))],
    findings,
    sample: sample(main),
  };
}

export async function structuredData(
  input: { homeUrl: string; homeHtml: string; sitemaps: string[] },
  lang: Lang,
): Promise<StructuredReport> {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const deadline = Date.now() + BUDGET_MS;
  const home = new URL(input.homeUrl);

  const fromSitemap = await sitemapUrls(input.sitemaps, deadline);
  // Links on the home page come first: they're the pages the business chose to show.
  const chosen = pick([...linksFrom(input.homeHtml, home), ...(fromSitemap ?? [])], home);
  const targets = [...chosen].flatMap(([kind, urls]) => urls.map((url) => ({ kind, url })));
  const responses = await Promise.all(targets.map((t) => fetchWithin(t.url, deadline)));

  const order: PageKind[] = ["home", "product", "service", "contact", "about", "article"];
  const pages = [
    readPage("home", home.toString(), { status: 200, finalUrl: home.toString(), headers: new Headers(), body: input.homeHtml, ms: 0, truncated: false }, L),
    ...targets.map((t, i) => readPage(t.kind, t.url, responses[i], L)),
  ].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));

  return {
    pages,
    sitemapUrls: fromSitemap ? fromSitemap.length : null,
    notFound: (Object.keys(WANTED) as Exclude<PageKind, "home">[]).filter((k) => !chosen.has(k)),
  };
}
