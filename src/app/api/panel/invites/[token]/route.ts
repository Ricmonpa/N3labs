import { requireApiSession } from "@/lib/panel/auth";
import { NotConfiguredError } from "@/lib/panel/db";
import { fail, ok } from "@/lib/panel/http";
import { deleteInvite, INVITE_TOKEN } from "@/lib/panel/invites";

export async function DELETE(request: Request, ctx: RouteContext<"/api/panel/invites/[token]">) {
  try {
    const session = await requireApiSession(request);
    if (session instanceof Response) return session;
    const { token } = await ctx.params;
    if (!INVITE_TOKEN.test(token)) return fail(404, "not_found");
    await deleteInvite(token);
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof NotConfiguredError) return fail(503, "not_configured");
    console.error("panel invites error", err);
    return fail(500, "server_error");
  }
}
