import { authConfigured, checkCredentials, startSession } from "@/lib/panel/auth";
import { fail, ok, readJson } from "@/lib/panel/http";

// Best-effort per-instance brute-force limit.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, number[]>();

export async function POST(request: Request) {
  if (!authConfigured()) return fail(503, "not_configured");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return fail(429, "rate_limited");

  const body = await readJson<{ email?: unknown; password?: unknown }>(request);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkCredentials(email, password)) {
    recent.push(now);
    attempts.set(ip, recent);
    if (attempts.size > 5000) attempts.clear();
    return fail(401, "invalid_credentials");
  }
  attempts.delete(ip);
  await startSession(email);
  return ok({ ok: true });
}
