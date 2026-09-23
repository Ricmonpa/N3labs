import { ok, panelRoute, readJson } from "@/lib/panel/http";
import { createInvite, listInvites } from "@/lib/panel/invites";

export const GET = panelRoute(async () => ok(await listInvites()));

export const POST = panelRoute(async ({ request, session }) => {
  const body = await readJson<{ label?: unknown; maxUses?: unknown }>(request);
  const label = typeof body?.label === "string" ? body.label : "";
  const maxUses = typeof body?.maxUses === "number" ? body.maxUses : 1;
  return ok(await createInvite(label, session.email, maxUses));
});
