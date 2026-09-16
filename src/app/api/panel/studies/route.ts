import { createStudy, listStudies } from "@/lib/panel/store";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { validateStudy } from "@/lib/geo-visibility/study.ts";
import type { Study } from "@/lib/geo-visibility/types.ts";

export const GET = panelRoute(async () => ok(await listStudies()));

export const POST = panelRoute(async ({ request, session }) => {
  const study = await readJson<Study>(request);
  if (!study) return fail(400, "invalid_json");
  const problems = validateStudy(study);
  if (problems.length) return fail(422, "invalid_study", { problems });
  return ok(await createStudy(study, session.email));
});
