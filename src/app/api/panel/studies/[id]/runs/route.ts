import { createRun, getStudy, MAX_CALLS_PER_RUN } from "@/lib/panel/store";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { ENGINES } from "@/lib/geo-visibility/engines/index.ts";
import { ENGINE_IDS } from "@/lib/geo-visibility/study.ts";
import type { EngineId } from "@/lib/geo-visibility/types.ts";

type Body = { engines?: unknown; runs?: unknown; limit?: unknown; simulated?: unknown };

export const POST = panelRoute(async ({ request, session, id }) => {
  const study = await getStudy(id);
  if (!study) return fail(404, "not_found");

  const body = await readJson<Body>(request);
  const simulated = body?.simulated === true;
  const requested = Array.isArray(body?.engines) ? body.engines : [];
  const engines = ENGINE_IDS.filter((e) => requested.includes(e));
  const runs = Number(body?.runs);
  const limit = body?.limit == null || body.limit === "" ? undefined : Number(body.limit);
  if (!engines.length) return fail(422, "no_engines");
  if (!Number.isInteger(runs) || runs < 1 || runs > 10) return fail(422, "invalid_runs");
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) return fail(422, "invalid_limit");
  if (!simulated) {
    const missing: EngineId[] = engines.filter((e) => !process.env[ENGINES[e].envKey]);
    if (missing.length) return fail(422, "missing_keys", { engines: missing });
  }
  const prompts = limit ? Math.min(limit, study.data.prompts.length) : study.data.prompts.length;
  const calls = prompts * engines.length * runs;
  if (calls > MAX_CALLS_PER_RUN) return fail(422, "too_many_calls", { calls, max: MAX_CALLS_PER_RUN });

  return ok({ id: await createRun(study, { engines, runs, limit, simulated }, session.email) });
});
