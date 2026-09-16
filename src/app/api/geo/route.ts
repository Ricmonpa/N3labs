import { runAudit, AuditError, type Lang } from "@/lib/geo/audit";

export const maxDuration = 60;

// Best-effort per-instance rate limit: serverless instances don't share memory,
// but this still stops a single client from hammering one instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { url?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }
  const lang: Lang = body.lang === "en" ? "en" : "es";
  if (typeof body.url !== "string") {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const report = await runAudit(body.url, lang);
    return Response.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AuditError) {
      return Response.json({ error: err.code, status: err.status ?? null }, { status: 422 });
    }
    console.error("geo audit failed", err);
    return Response.json({ error: "unreachable" }, { status: 502 });
  }
}
