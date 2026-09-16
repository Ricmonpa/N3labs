import { cancelRun, deleteRun, getRecords, getRun, progress, retryFailed, setSharing } from "@/lib/panel/store";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";

export const GET = panelRoute(async ({ request, id }) => {
  const run = await getRun(id);
  if (!run) return fail(404, "not_found");
  if (new URL(request.url).searchParams.has("answers")) {
    const records = await getRecords(id);
    return ok(
      records.map((r) => ({
        key: r.key,
        engine: r.engine,
        promptId: r.promptId,
        run: r.run,
        ok: r.ok,
        error: r.error,
        model: r.answer?.model,
        text: r.answer?.text ?? "",
        citations: r.answer?.citations ?? [],
        searchQueries: r.answer?.searchQueries ?? [],
      })),
    );
  }
  return ok({ ...run, ...(await progress(id)) });
});

export const POST = panelRoute(async ({ request, id }) => {
  const run = await getRun(id);
  if (!run) return fail(404, "not_found");
  const body = await readJson<{ action?: unknown }>(request);
  switch (body?.action) {
    case "cancel":
      await cancelRun(id);
      return ok({ ok: true });
    case "retry":
      await retryFailed(id);
      return ok({ ok: true });
    case "share":
      return ok({ token: await setSharing(id, true) });
    case "unshare":
      return ok({ token: await setSharing(id, false) });
    default:
      return fail(400, "unknown_action");
  }
});

export const DELETE = panelRoute(async ({ id }) => {
  await deleteRun(id);
  return ok({ ok: true });
});
