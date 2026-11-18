import { getStudy, MAX_CALLS_PER_RUN, setTracking, type Tracking } from "@/lib/panel/store";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { ENGINE_IDS } from "@/lib/geo-visibility/study.ts";

type Body = { every?: unknown; engines?: unknown; runs?: unknown };

/** Prende, cambia o apaga (every: null) el seguimiento automático de un estudio. */
export const PUT = panelRoute(async ({ request, id }) => {
  const study = await getStudy(id);
  if (!study) return fail(404, "not_found");
  const body = await readJson<Body>(request);
  if (body?.every === null) {
    await setTracking(id, null);
    return ok({ tracking: null });
  }
  const every = body?.every === "weekly" || body?.every === "monthly" ? body.every : null;
  if (!every) return fail(422, "invalid_tracking");
  const requested = Array.isArray(body?.engines) ? body.engines : [];
  const engines = ENGINE_IDS.filter((e) => requested.includes(e));
  if (!engines.length) return fail(422, "no_engines");
  const runs = Number(body?.runs);
  if (!Number.isInteger(runs) || runs < 1 || runs > 10) return fail(422, "invalid_runs");
  const calls = study.data.prompts.length * engines.length * runs;
  if (calls > MAX_CALLS_PER_RUN) return fail(422, "too_many_calls", { calls, max: MAX_CALLS_PER_RUN });

  const tracking: Tracking = { every, engines, runs };
  await setTracking(id, tracking);
  return ok({ tracking });
});
