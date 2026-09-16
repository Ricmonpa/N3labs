import "server-only";
import { lookup } from "node:dns/promises";
import { GoogleGenAI } from "@google/genai";
import { safeFetch } from "@/lib/geo/safeFetch";
import { elementTexts, findTags, metaContent, removeNonContent, stripToText } from "@/lib/geo/html";
import type { PromptType, Study, StudyPrompt } from "@/lib/geo-visibility/types.ts";

export type SuggestInput = { url: string; notes?: string; city?: string; country: string; language: string; timezone?: string };

export type Suggestion = {
  study: Study;
  summary: string;
  /** "ai" when a model drafted it; "template" when no model was available. */
  source: "ai" | "template";
  warnings: string[];
};

export class SuggestError extends Error {
  constructor(public code: "invalid_url" | "site_unreachable") {
    super(code);
  }
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 N3-GEO-Panel/1.0";
const PREFIX: Record<PromptType, string> = { category: "c", problem: "p", comparison: "x", brand: "b" };

const cleanDomain = (d: string) =>
  d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "");

function withIds(items: { type: PromptType; text: string }[]): StudyPrompt[] {
  const counters: Record<string, number> = {};
  const seen = new Set<string>();
  const out: StudyPrompt[] = [];
  for (const { type, text } of items) {
    const t = text.trim();
    if (!t || seen.has(t.toLowerCase()) || !PREFIX[type]) continue;
    seen.add(t.toLowerCase());
    counters[type] = (counters[type] ?? 0) + 1;
    out.push({ id: `${PREFIX[type]}${counters[type]}`, type, text: t });
  }
  return out;
}

async function domainExists(domain: string) {
  try {
    await Promise.race([lookup(domain), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000))]);
    return true;
  } catch {
    return false;
  }
}

/** What the homepage says about the business, trimmed for a prompt. */
async function readSite(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new SuggestError("invalid_url");
  }
  const domain = cleanDomain(url.hostname);
  try {
    const page = await safeFetch(url.toString(), UA);
    const metas = findTags(page.body, "meta");
    const title = elementTexts(page.body, "title")[0] ?? "";
    const text = stripToText(removeNonContent(page.body)).slice(0, 6000);
    return {
      domain: cleanDomain(new URL(page.finalUrl).hostname) || domain,
      title,
      siteName: metaContent(metas, "og:site_name") ?? "",
      description: metaContent(metas, "description") ?? metaContent(metas, "og:description") ?? "",
      headings: [...elementTexts(page.body, "h1"), ...elementTexts(page.body, "h2")].slice(0, 12),
      text,
      reachable: page.status < 400,
    };
  } catch {
    // Still useful: the model can research the domain on its own.
    return { domain, title: "", siteName: "", description: "", headings: [], text: "", reachable: false };
  }
}

const SCHEMA = {
  type: "object",
  properties: {
    brandName: { type: "string", description: "Nombre comercial de la marca, como la conocen sus clientes." },
    aliases: { type: "array", items: { type: "string" }, description: "Otras formas en que se escribe el nombre (sin incluir brandName)." },
    summary: { type: "string", description: "Una o dos frases: qué vende, a quién y dónde." },
    competitors: {
      type: "array",
      description: "De 4 a 6 competidores reales y activos en el mismo mercado, con su dominio oficial.",
      items: {
        type: "object",
        properties: { name: { type: "string" }, domain: { type: "string" } },
        required: ["name", "domain"],
      },
    },
    prompts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["category", "problem", "comparison", "brand"] },
          text: { type: "string" },
        },
        required: ["type", "text"],
      },
    },
  },
  required: ["brandName", "aliases", "summary", "competitors", "prompts"],
};

function instructions(input: SuggestInput, site: Awaited<ReturnType<typeof readSite>>) {
  const place = [input.city, input.country].filter(Boolean).join(", ");
  return `Eres analista de GEO (visibilidad de marcas en respuestas de IA como ChatGPT, Gemini, Claude y Perplexity).
Prepara un estudio para la marca del sitio ${site.domain}. Mercado: ${place}. Idioma de las preguntas: ${input.language}.
${input.notes ? `Notas del equipo sobre el cliente: ${input.notes}\n` : ""}
Lo que dice su sitio:
- Título: ${site.title}
- Nombre del sitio: ${site.siteName}
- Descripción: ${site.description}
- Encabezados: ${site.headings.join(" | ")}
- Texto: ${site.text.slice(0, 4000)}
${site.reachable ? "" : "(No se pudo leer el sitio: investiga la marca por su dominio.)\n"}
Busca en la web para confirmar qué hace la marca y quiénes son sus competidores reales en ${place}.

Devuelve:
- competitors: de 4 a 6 empresas reales que un cliente compararía con esta marca en ${place}, con su dominio oficial verificado. No inventes dominios.
- prompts: 26 preguntas escritas como las haría un posible cliente a una IA, en ${input.language}, naturales y variadas:
  - 10 "category": busca proveedores de lo que vende la marca, sin nombrarla (ej. "¿Cuáles son las mejores … en ${input.city || place}?").
  - 10 "problem": describe una necesidad o problema concreto de su cliente ideal y pide a quién acudir o qué empresa recomienda.
  - 3 "comparison": compara tipos de proveedores o enfoques de la categoría, sin nombrar a la marca.
  - 3 "brand": preguntas directas sobre la marca por su nombre (qué es, si es buena opción, opiniones).
  Solo las de tipo "brand" pueden mencionar a la marca. Ninguna pregunta debe mencionar a los competidores.`;
}

async function draftWithGemini(input: SuggestInput, site: Awaited<ReturnType<typeof readSite>>) {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const request = {
    model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
    input: instructions(input, site),
    response_format: { type: "text" as const, mime_type: "application/json", schema: SCHEMA },
  };
  let interaction;
  try {
    interaction = await client.interactions.create({ ...request, tools: [{ type: "google_search" }] });
  } catch {
    // Some models don't allow search together with a response schema.
    interaction = await client.interactions.create(request);
  }
  let text = interaction.output_text ?? "";
  if (!text) {
    for (const step of interaction.steps) {
      if (step.type !== "model_output") continue;
      for (const block of step.content ?? []) if (block.type === "text") text += block.text;
    }
  }
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json) as {
    brandName: string;
    aliases?: string[];
    summary?: string;
    competitors?: { name: string; domain: string }[];
    prompts?: { type: PromptType; text: string }[];
  };
}

function templatePrompts(brand: string, what: string, where: string): { type: PromptType; text: string }[] {
  const w = what || "empresas como la nuestra";
  return [
    { type: "category", text: `¿Cuáles son las mejores ${w} en ${where}?` },
    { type: "category", text: `¿Qué ${w} me recomiendas en ${where}?` },
    { type: "category", text: `Estoy buscando ${w} en ${where}. ¿Qué opciones hay?` },
    { type: "category", text: `¿Cuáles son las ${w} más confiables en ${where}?` },
    { type: "problem", text: `Necesito contratar ${w} en ${where}. ¿Qué debo buscar y a quién me recomiendas?` },
    { type: "problem", text: `Tuve una mala experiencia con mi proveedor actual. ¿Qué otras ${w} hay en ${where}?` },
    { type: "problem", text: `¿Qué ${w} en ${where} tienen buena relación calidad-precio?` },
    { type: "comparison", text: `¿Qué conviene más en ${where}: una empresa grande o una especializada de ${w}?` },
    { type: "brand", text: `¿Qué es ${brand}?` },
    { type: "brand", text: `¿${brand} es una buena opción?` },
  ];
}

export async function suggestStudy(input: SuggestInput): Promise<Suggestion> {
  const site = await readSite(input.url);
  const warnings: string[] = [];
  if (!site.reachable) warnings.push("No se pudo leer el sitio; la propuesta se basa en lo que se encontró en la web.");
  const market = { country: input.country, city: input.city, region: input.city, timezone: input.timezone, language: input.language };
  const where = input.city || input.country;
  const fallbackName = site.siteName || site.title.split(/[|–—-]/)[0]?.trim() || site.domain.split(".")[0];

  if (process.env.GEMINI_API_KEY) {
    try {
      const draft = await draftWithGemini(input, site);
      const brandName = draft.brandName?.trim() || fallbackName;
      const seen = new Set([site.domain]);
      const candidates = (draft.competitors ?? [])
        .map((c) => ({ name: c.name?.trim(), domain: cleanDomain(c.domain ?? "") }))
        .filter((c) => c.name && c.domain && !seen.has(c.domain) && seen.add(c.domain));
      // Drop domains that don't exist: models sometimes invent them.
      const checks = await Promise.all(candidates.map((c) => domainExists(c.domain)));
      const competitors = candidates.filter((_, i) => checks[i]).map((c) => ({ name: c.name!, domains: [c.domain], aliases: [] }));
      if (competitors.length < candidates.length) warnings.push(`Se descartaron ${candidates.length - competitors.length} competidores con dominios que no existen.`);
      const prompts = withIds(draft.prompts ?? []);
      if (prompts.length >= 5) {
        return {
          source: "ai",
          summary: draft.summary ?? "",
          warnings,
          study: {
            name: brandName,
            brand: { name: brandName, aliases: (draft.aliases ?? []).filter((a) => a && a !== brandName), domains: [site.domain] },
            competitors,
            market,
            runs: 3,
            engines: ["openai", "anthropic", "perplexity", "gemini"],
            prompts,
          },
        };
      }
      warnings.push("La IA no devolvió suficientes preguntas; se usó una plantilla.");
    } catch (err) {
      console.error("suggestStudy: model draft failed", err);
      warnings.push("No se pudo generar la propuesta con IA; se usó una plantilla para que la ajustes.");
    }
  } else {
    warnings.push("Sin llave de Gemini en el servidor: se usó una plantilla para que la ajustes.");
  }

  return {
    source: "template",
    summary: site.description,
    warnings,
    study: {
      name: fallbackName,
      brand: { name: fallbackName, aliases: [], domains: [site.domain] },
      competitors: [],
      market,
      runs: 3,
      engines: ["openai", "anthropic", "perplexity", "gemini"],
      prompts: withIds(templatePrompts(fallbackName, input.notes ?? "", where)),
    },
  };
}
