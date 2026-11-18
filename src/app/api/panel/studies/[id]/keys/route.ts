import { getStudy, setStudyKey } from "@/lib/panel/store";
import { plausibleKey, verifyKey } from "@/lib/panel/keys";
import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { ENGINE_IDS } from "@/lib/geo-visibility/study.ts";
import type { EngineId } from "@/lib/geo-visibility/types.ts";

type Body = { engine?: unknown; key?: unknown };

/** Guarda (o quita, con key: null) la llave de API del cliente para un motor. Responde solo los últimos 4 caracteres. */
export const PUT = panelRoute(async ({ request, id }) => {
  if (!(await getStudy(id))) return fail(404, "not_found");
  const body = await readJson<Body>(request);
  const engine = ENGINE_IDS.find((e) => e === body?.engine) as EngineId | undefined;
  if (!engine) return fail(422, "no_engines");
  if (body?.key === null) return ok({ hints: await setStudyKey(id, engine, null) });

  const key = typeof body?.key === "string" ? body.key.trim() : "";
  if (!plausibleKey(key) || !(await verifyKey(engine, key))) return fail(422, "invalid_key");
  return ok({ hints: await setStudyKey(id, engine, key) });
});
