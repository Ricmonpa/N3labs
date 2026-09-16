import { endSession } from "@/lib/panel/auth";
import { ok } from "@/lib/panel/http";

export async function POST() {
  await endSession();
  return ok({ ok: true });
}
