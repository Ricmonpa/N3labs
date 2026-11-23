import { NotConfiguredError, db } from "@/lib/panel/db";
import { fail, ok, readJson } from "@/lib/panel/http";

const LEVELS = ["aware", "guided", "driven", "ready"] as const;
type Level = (typeof LEVELS)[number];
type Body = { cid?: unknown; level?: unknown; score?: unknown; lang?: unknown };

let tableReady: Promise<void> | null = null;
async function table() {
  const sql = await db();
  tableReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS iaready_results (
      cid text PRIMARY KEY,
      level text NOT NULL,
      score real NOT NULL,
      lang text NOT NULL DEFAULT 'es',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  await tableReady;
  return sql;
}

/** Resultados del test IA Ready, anónimos: solo nivel y puntaje, sin datos personales. */
export async function GET() {
  try {
    const sql = await table();
    const rows = (await sql`SELECT level, count(*)::int AS n FROM iaready_results GROUP BY level`) as { level: string; n: number }[];
    const levels: Record<Level, number> = { aware: 0, guided: 0, driven: 0, ready: 0 };
    for (const r of rows) if ((LEVELS as readonly string[]).includes(r.level)) levels[r.level as Level] = r.n;
    const total = LEVELS.reduce((s, l) => s + levels[l], 0);
    return ok({ total, levels });
  } catch (err) {
    if (err instanceof NotConfiguredError) return fail(503, "unavailable");
    console.error("iaready stats failed", err);
    return fail(500, "unavailable");
  }
}

/** Guarda (o actualiza) el resultado de un participante. Un participante = un navegador (cid). */
export async function POST(request: Request) {
  const body = await readJson<Body>(request);
  const cid = typeof body?.cid === "string" ? body.cid.slice(0, 64) : "";
  const level = body?.level;
  const score = Number(body?.score);
  if (!/^[\w-]{8,64}$/.test(cid) || !(LEVELS as readonly unknown[]).includes(level) || !Number.isFinite(score) || score < 0 || score > 3) {
    return fail(422, "invalid");
  }
  const lang = body?.lang === "en" || body?.lang === "pt" ? body.lang : "es";
  try {
    const sql = await table();
    await sql`INSERT INTO iaready_results (cid, level, score, lang)
      VALUES (${cid}, ${level as string}, ${score}, ${lang})
      ON CONFLICT (cid) DO UPDATE SET level = EXCLUDED.level, score = EXCLUDED.score, lang = EXCLUDED.lang, updated_at = now()`;
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof NotConfiguredError) return fail(503, "unavailable");
    console.error("iaready save failed", err);
    return fail(500, "unavailable");
  }
}
