import { getRun, progress, stepRun } from "@/lib/panel/store";
import { fail, ok, panelRoute } from "@/lib/panel/http";

// A step stops starting new questions after 60s, but calls already in flight (web search is slow) may run longer.
export const maxDuration = 300;

export const POST = panelRoute(async ({ id }) => {
  const { busy } = await stepRun(id);
  const run = await getRun(id);
  if (!run) return fail(404, "not_found");
  return ok({ busy, status: run.status, total: run.total, ...(await progress(id)) });
});
