import { isInternalStep, requireApiSession } from "@/lib/panel/auth";
import { NotConfiguredError } from "@/lib/panel/db";
import { fail, ok, UUID } from "@/lib/panel/http";
import { getRun, progress } from "@/lib/panel/store";
import { kickRun } from "@/lib/panel/worker";

// The batch runs after the response is sent; web-search calls can take a minute or more.
export const maxDuration = 300;

/**
 * Starts the next batch in the background (if nobody else is working on the run) and returns
 * progress right away. When a batch ends, the server calls this route again, so a run keeps
 * going with the page closed; the page's polling restarts the chain if it ever breaks.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/panel/runs/[id]/step">) {
  try {
    const { id } = await ctx.params;
    if (!UUID.test(id)) return fail(404, "not_found");
    if (!isInternalStep(request, id)) {
      const session = await requireApiSession(request);
      if (session instanceof Response) return session;
    }

    const leased = await kickRun(id, new URL(request.url).origin);
    const run = await getRun(id);
    if (!run) return fail(404, "not_found");
    return ok({ busy: !leased, status: run.status, total: run.total, ...(await progress(id)) });
  } catch (err) {
    if (err instanceof NotConfiguredError) return fail(503, "not_configured");
    console.error("panel step error", err);
    return fail(500, "server_error");
  }
}
