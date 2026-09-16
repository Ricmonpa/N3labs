import type { Entity, Source } from "./types.ts";

export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namePatterns(entity: Entity): RegExp[] {
  return [entity.name, ...(entity.aliases ?? [])].map(
    (n) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(normalizeText(n))}(?![\\p{L}\\p{N}])`, "u"),
  );
}

/** Position of the first mention of the entity in the text, or -1. */
export function firstMention(text: string, entity: Entity): number {
  const hay = normalizeText(text);
  let best = -1;
  for (const re of namePatterns(entity)) {
    const m = re.exec(hay);
    if (m && (best === -1 || m.index < best)) best = m.index;
  }
  return best;
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function hostMatches(host: string, domains: string[]): boolean {
  return domains.some((d) => {
    const dom = d.toLowerCase().replace(/^www\./, "");
    return host === dom || host.endsWith(`.${dom}`);
  });
}

export function citesEntity(sources: Source[], entity: Entity): boolean {
  return sources.some((s) => {
    const host = hostOf(s.url);
    return !!host && hostMatches(host, entity.domains);
  });
}

/** Wilson score interval (95%) for a proportion; honest error bars for small samples. */
export function wilson(successes: number, n: number): { rate: number; low: number; high: number } {
  if (n === 0) return { rate: 0, low: 0, high: 0 };
  const z = 1.96;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { rate: p, low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}
