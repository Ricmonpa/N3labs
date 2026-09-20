import { NotConfiguredError } from "@/lib/panel/db";
import { fail, ok, readJson } from "@/lib/panel/http";
import { ScanError, startScan } from "@/lib/panel/scan";

// Drafting the study (reading the site + a model call with web search) runs after the response.
export const maxDuration = 300;

type Body = { url?: unknown; name?: unknown; email?: unknown; lang?: unknown };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Starts the public visibility scan for /geo. Returns an id and token to poll it. */
export async function POST(request: Request) {
  const body = await readJson<Body>(request);
  const name = str(body?.name, 120);
  if (!name) return fail(422, "invalid_name");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    return ok(
      await startScan(
        { url: str(body?.url, 500), name, email: str(body?.email, 200), lang: body?.lang === "en" ? "en" : "es", ip },
        new URL(request.url).origin,
      ),
    );
  } catch (err) {
    if (err instanceof ScanError) return fail(err.code === "rate_limited" ? 429 : err.code === "busy" || err.code === "unavailable" ? 503 : 422, err.code);
    if (err instanceof NotConfiguredError) return fail(503, "unavailable");
    console.error("geo scan start failed", err);
    return fail(500, "unavailable");
  }
}
