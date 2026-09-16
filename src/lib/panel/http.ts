import "server-only";
import { requireApiSession, type Session } from "./auth";
import { NotConfiguredError } from "./db";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function fail(status: number, error: string, extra?: object) {
  return Response.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export function ok(data: unknown) {
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

type Ctx = { params: Promise<{ id?: string }> };

/**
 * Wraps a panel API handler: requires a session, validates an `[id]` param when the route has one,
 * and turns missing configuration or unexpected errors into JSON.
 */
export function panelRoute(fn: (args: { request: Request; session: Session; id: string }) => Promise<Response>) {
  return async (request: Request, ctx: Ctx) => {
    try {
      const session = await requireApiSession(request);
      if (session instanceof Response) return session;
      const { id = "" } = (await ctx?.params) ?? {};
      if (id && !UUID.test(id)) return fail(404, "not_found");
      return await fn({ request, session, id });
    } catch (err) {
      if (err instanceof NotConfiguredError) return fail(503, "not_configured");
      console.error("panel api error", err);
      return fail(500, "server_error");
    }
  };
}
