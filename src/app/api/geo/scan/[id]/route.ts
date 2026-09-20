import { NotConfiguredError } from "@/lib/panel/db";
import { fail, ok, readJson, UUID } from "@/lib/panel/http";
import { getScan } from "@/lib/panel/scan";

// Polling may restart the run's background batch, which can take a minute or more.
export const maxDuration = 300;

/** Progress of a public scan, and its report once it's done. POST because it may restart work. */
export async function POST(request: Request, ctx: RouteContext<"/api/geo/scan/[id]">) {
  const { id } = await ctx.params;
  const body = await readJson<{ token?: unknown }>(request);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!UUID.test(id) || !/^[A-Za-z0-9_-]{20,}$/.test(token)) return fail(404, "not_found");

  try {
    const scan = await getScan(id, token, new URL(request.url).origin);
    return scan ? ok(scan) : fail(404, "not_found");
  } catch (err) {
    if (err instanceof NotConfiguredError) return fail(503, "unavailable");
    console.error("geo scan poll failed", err);
    return fail(500, "unavailable");
  }
}
