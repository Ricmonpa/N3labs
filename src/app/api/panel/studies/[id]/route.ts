import { deleteStudy, getStudy, listRuns, updateStudy } from "@/lib/panel/store";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { validateStudy } from "@/lib/geo-visibility/study.ts";
import type { Study } from "@/lib/geo-visibility/types.ts";

export const GET = panelRoute(async ({ id }) => {
  const study = await getStudy(id);
  if (!study) return fail(404, "not_found");
  return ok({ ...study, runs: await listRuns(id) });
});

export const PUT = panelRoute(async ({ request, id }) => {
  const data = await readJson<Study>(request);
  if (!data) return fail(400, "invalid_json");
  const problems = validateStudy(data);
  if (problems.length) return fail(422, "invalid_study", { problems });
  const study = await updateStudy(id, data);
  return study ? ok(study) : fail(404, "not_found");
});

export const DELETE = panelRoute(async ({ id }) => {
  await deleteStudy(id);
  return ok({ ok: true });
});
