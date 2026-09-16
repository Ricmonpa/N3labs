import { fail, ok, panelRoute, readJson } from "@/lib/panel/http";
import { SuggestError, suggestStudy } from "@/lib/panel/suggest";

// Reads the client's site and asks a model (with web search) to draft the study.
export const maxDuration = 120;

type Body = { url?: unknown; notes?: unknown; city?: unknown; country?: unknown; language?: unknown; timezone?: unknown };

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const POST = panelRoute(async ({ request }) => {
  const body = await readJson<Body>(request);
  const url = str(body?.url, 500);
  if (!url) return fail(422, "invalid_url");
  try {
    return ok(
      await suggestStudy({
        url,
        notes: str(body?.notes, 1000),
        city: str(body?.city, 100),
        country: str(body?.country, 2) || "MX",
        language: str(body?.language, 20) || "es-MX",
        timezone: str(body?.timezone, 60) || undefined,
      }),
    );
  } catch (err) {
    if (err instanceof SuggestError) return fail(422, err.code);
    throw err;
  }
});
