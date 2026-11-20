import { NotConfiguredError } from "@/lib/panel/db";
import { fail, ok, readJson } from "@/lib/panel/http";
import { RegisterError, registerGeoTool } from "@/lib/panel/geotool";

type Body = { name?: unknown; email?: unknown; company?: unknown; whatsapp?: unknown; lang?: unknown; origin?: unknown };
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Registro para usar el N3 GeoTool. Queda en el panel, en Prospectos. */
export async function POST(request: Request) {
  const body = await readJson<Body>(request);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    await registerGeoTool({
      name: str(body?.name, 200),
      email: str(body?.email, 300),
      company: str(body?.company, 300),
      whatsapp: str(body?.whatsapp, 60),
      lang: body?.lang === "en" ? "en" : "es",
      origin: str(body?.origin, 300),
      ip,
    });
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof RegisterError) return fail(err.code === "rate_limited" ? 429 : 422, err.code);
    if (err instanceof NotConfiguredError) return fail(503, "unavailable");
    console.error("geotool register failed", err);
    return fail(500, "unavailable");
  }
}
