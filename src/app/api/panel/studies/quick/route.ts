import { ENGINES } from "@/lib/geo-visibility/engines/index.ts";
import { ENGINE_IDS } from "@/lib/geo-visibility/study.ts";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { auditSite } from "@/lib/panel/readability";
import { createRun, createStudy, MAX_CALLS_PER_RUN, setRunAudit } from "@/lib/panel/store";
import { SuggestError, suggestStudy } from "@/lib/panel/suggest";
import { kickRun } from "@/lib/panel/worker";

// Drafting the study (site + a model call with web search) and the readability check run together.
export const maxDuration = 120;

type Body = { url?: unknown; notes?: unknown; city?: unknown; country?: unknown; language?: unknown; timezone?: unknown };

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Un clic: arma el estudio desde el sitio, revisa si las IAs lo pueden leer, lo guarda y arranca
 * la medición en todos los motores con llave. Si la IA no pudo armar las preguntas, devuelve el
 * borrador para revisarlo en vez de medir preguntas genéricas.
 */
export const POST = panelRoute(async ({ request, session }) => {
  const body = await readJson<Body>(request);
  const url = str(body?.url, 500);
  if (!url) return fail(422, "invalid_url");
  const language = str(body?.language, 20) || "es-MX";
  const engines = ENGINE_IDS.filter((e) => !!process.env[ENGINES[e].envKey]);
  if (!engines.length) return fail(422, "no_engines");

  let suggestion, audit;
  try {
    [suggestion, audit] = await Promise.all([
      suggestStudy({
        url,
        notes: str(body?.notes, 1000),
        city: str(body?.city, 100),
        country: str(body?.country, 2) || "MX",
        language,
        timezone: str(body?.timezone, 60) || undefined,
      }),
      auditSite(url, language.toLowerCase().startsWith("en") ? "en" : "es"),
    ]);
  } catch (err) {
    if (err instanceof SuggestError) return fail(422, err.code);
    throw err;
  }
  if (suggestion.source !== "ai") return ok({ draft: suggestion });

  const data = { ...suggestion.study, engines };
  const calls = data.prompts.length * engines.length * data.runs;
  if (calls > MAX_CALLS_PER_RUN) {
    const warning = `Serían ${calls} consultas y el máximo por medición es ${MAX_CALLS_PER_RUN}. Ajusta el estudio antes de medir.`;
    return ok({ draft: { ...suggestion, warnings: [...suggestion.warnings, warning] } });
  }

  const study = await createStudy(data, session.email);
  const runId = await createRun(study, { engines, runs: data.runs, simulated: false }, session.email);
  await setRunAudit(runId, audit);
  await kickRun(runId, new URL(request.url).origin);
  return ok({ runId, studyId: study.id });
});
