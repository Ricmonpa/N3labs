// Dependency-free HTML reading. We only need what a non-JS crawler sees,
// so regex over the raw markup is enough (and is exactly the point).

export type Tag = { name: string; attrs: Record<string, string> };

const ATTR_RE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttrs(src: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of src.matchAll(ATTR_RE)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

export function findTags(html: string, name: string): Tag[] {
  const re = new RegExp(`<${name}\\b([^>]*)>`, "gi");
  return [...html.matchAll(re)].map((m) => ({ name, attrs: parseAttrs(m[1]) }));
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

export function stripToText(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Inner texts of every <name>…</name> element (no nesting awareness needed here). */
export function elementTexts(html: string, name: string): string[] {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "gi");
  return [...html.matchAll(re)].map((m) => stripToText(m[1]));
}

export function removeNonContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<head\b[\s\S]*?<\/head>/i, " ");
}

export function visibleWordCount(html: string): number {
  const text = stripToText(removeNonContent(html));
  return text.split(" ").filter((w) => /\p{L}/u.test(w)).length;
}

export function jsonLdBlocks(html: string): { raw: string; parsed: unknown | null }[] {
  const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  return [...html.matchAll(re)].map((m) => {
    const raw = m[1].trim();
    try {
      return { raw, parsed: JSON.parse(raw) };
    } catch {
      return { raw, parsed: null };
    }
  });
}

/** Flattens JSON-LD (arrays, @graph, nested objects) into a list of nodes. */
export function jsonLdNodes(value: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const obj = v as Record<string, unknown>;
    if (obj["@type"]) out.push(obj);
    for (const child of Object.values(obj)) walk(child);
  };
  walk(value);
  return out;
}

export function nodeTypes(node: Record<string, unknown>): string[] {
  const t = node["@type"];
  return (Array.isArray(t) ? t : [t]).filter((x): x is string => typeof x === "string");
}

export function metaContent(metas: Tag[], key: string): string | null {
  const k = key.toLowerCase();
  const tag = metas.find(
    (m) => (m.attrs.name ?? m.attrs.property ?? m.attrs["http-equiv"] ?? "").toLowerCase() === k,
  );
  return tag?.attrs.content?.trim() || null;
}
