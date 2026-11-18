import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { ENGINES } from "@/lib/geo-visibility/engines/index.ts";
import { createMockEngine } from "@/lib/geo-visibility/engines/mock.ts";
import { executeTask, listTasks, pool } from "@/lib/geo-visibility/execute.ts";
import { buildReport, type Report } from "@/lib/geo-visibility/report.ts";
import { MATCHER_VERSION } from "@/lib/geo-visibility/match.ts";
import type { EngineId, RunRecord, Study } from "@/lib/geo-visibility/types.ts";
import type { StoredAudit } from "./readability";
import { hintsOf, openKeys, sealKeys, type ApiKeys, type KeyHints } from "./keys";

export type Tracking = {
  every: "weekly" | "monthly";
  engines: EngineId[];
  runs: number;
};

export type StudyRow = { id: string; data: Study; tracking: Tracking | null; created_by: string; created_at: string; updated_at: string };

// Las llaves (api_keys) nunca salen en estas columnas: solo se leen cifradas con studyKeys().
const STUDY_COLUMNS = "s.id, s.data, s.tracking, s.created_by, s.created_at, s.updated_at";

export type RunStatus = "running" | "done" | "cancelled";

export type RunRow = {
  id: string;
  study_id: string;
  study: Study;
  engines: EngineId[];
  runs: number;
  simulated: boolean;
  status: RunStatus;
  total: number;
  report: Report | null;
  /** Legibilidad del sitio al arrancar la medición; null en mediciones anteriores o mientras corre. */
  audit: StoredAudit | null;
  share_token: string | null;
  created_by: string;
  created_at: string;
  finished_at: string | null;
};

export type RunSummary = Omit<RunRow, "study" | "report" | "audit"> & {
  study_name: string;
  answered: number;
  failed: number;
  headline: { mention: number; citation: number } | null;
};

/** Hard ceiling per run, so a typo can't burn the API budget. */
export const MAX_CALLS_PER_RUN = Number(process.env.PANEL_MAX_CALLS ?? 1500);

// ---------- Studies ----------

export async function listStudies(): Promise<(StudyRow & { last_run: string | null; runs_count: number })[]> {
  const sql = await db();
  return (await sql`
    SELECT s.id, s.data, s.tracking, s.created_by, s.created_at, s.updated_at, r.last_run, COALESCE(r.runs_count, 0)::int AS runs_count
    FROM geo_studies s
    LEFT JOIN (SELECT study_id, max(created_at) AS last_run, count(*) AS runs_count FROM geo_runs GROUP BY study_id) r
      ON r.study_id = s.id
    ORDER BY s.updated_at DESC`) as never;
}

export async function getStudy(id: string): Promise<StudyRow | null> {
  const sql = await db();
  const rows = (await sql.query(`SELECT ${STUDY_COLUMNS} FROM geo_studies s WHERE s.id = $1`, [id])) as StudyRow[];
  return rows[0] ?? null;
}

/** Llaves del cliente para este estudio, descifradas. Solo para uso del servidor. */
export async function studyKeys(id: string): Promise<ApiKeys> {
  const sql = await db();
  const rows = (await sql`SELECT api_keys FROM geo_studies WHERE id = ${id}`) as { api_keys: string | null }[];
  return openKeys(rows[0]?.api_keys);
}

/** Lo que la página puede mostrar de las llaves del estudio (los últimos 4 caracteres). */
export async function studyKeyHints(id: string): Promise<KeyHints> {
  return hintsOf(await studyKeys(id));
}

export async function setStudyKey(id: string, engine: EngineId, key: string | null) {
  const keys = await studyKeys(id);
  if (key) keys[engine] = key;
  else delete keys[engine];
  const sql = await db();
  await sql`UPDATE geo_studies SET api_keys = ${sealKeys(keys)} WHERE id = ${id}`;
  return hintsOf(keys);
}

export async function setTracking(id: string, tracking: Tracking | null) {
  const sql = await db();
  await sql`UPDATE geo_studies SET tracking = ${tracking ? JSON.stringify(tracking) : null}::jsonb WHERE id = ${id}`;
}

export async function createStudy(data: Study, email: string): Promise<StudyRow> {
  const sql = await db();
  const rows = (await sql`INSERT INTO geo_studies (data, created_by) VALUES (${JSON.stringify(data)}::jsonb, ${email}) RETURNING id, data, tracking, created_by, created_at, updated_at`) as StudyRow[];
  return rows[0];
}

export async function updateStudy(id: string, data: Study): Promise<StudyRow | null> {
  const sql = await db();
  const rows = (await sql`UPDATE geo_studies SET data = ${JSON.stringify(data)}::jsonb, updated_at = now() WHERE id = ${id} RETURNING id, data, tracking, created_by, created_at, updated_at`) as StudyRow[];
  return rows[0] ?? null;
}

export async function deleteStudy(id: string) {
  const sql = await db();
  await sql`DELETE FROM geo_studies WHERE id = ${id}`;
}

// ---------- Runs ----------

const SUMMARY_COLUMNS = `r.id, r.study_id, r.engines, r.runs, r.simulated, r.status, r.total, r.share_token, r.created_by, r.created_at, r.finished_at,
  r.study->>'name' AS study_name,
  (SELECT count(*) FROM geo_responses x WHERE x.run_id = r.id)::int AS answered,
  (SELECT count(*) FROM geo_responses x WHERE x.run_id = r.id AND NOT x.ok)::int AS failed,
  CASE WHEN r.report IS NULL THEN NULL ELSE jsonb_build_object(
    'mention', (r.report->'overall'->'unbranded'->'mention'->>'rate')::float,
    'citation', (r.report->'overall'->'unbranded'->'citation'->>'rate')::float) END AS headline`;

export async function listRuns(studyId?: string, limit = 50): Promise<RunSummary[]> {
  const sql = await db();
  const where = studyId ? "WHERE r.study_id = $1" : "";
  const params = studyId ? [studyId, limit] : [limit];
  return (await sql.query(
    `SELECT ${SUMMARY_COLUMNS} FROM geo_runs r ${where} ORDER BY r.created_at DESC LIMIT $${params.length}`,
    params,
  )) as RunSummary[];
}

/**
 * Reports saved with an older way of matching names are rebuilt from their stored answers
 * (no new API calls), keeping the date they were measured.
 */
async function withFreshReport(run: RunRow | null): Promise<RunRow | null> {
  if (!run?.report || run.status === "running" || run.report.matcher === MATCHER_VERSION) return run;
  const records = await getRecords(run.id);
  if (!records.some((r) => r.ok)) return run;
  const report = { ...buildReport(run.study, records), generatedAt: run.report.generatedAt };
  const sql = await db();
  await sql`UPDATE geo_runs SET report = ${JSON.stringify(report)}::jsonb WHERE id = ${run.id}`;
  return { ...run, report };
}

export async function getRun(id: string): Promise<RunRow | null> {
  const sql = await db();
  const rows = (await sql`SELECT id, study_id, study, engines, runs, simulated, status, total, report, audit, share_token, created_by, created_at, finished_at FROM geo_runs WHERE id = ${id}`) as RunRow[];
  return withFreshReport(rows[0] ?? null);
}

export async function getRunByToken(token: string): Promise<RunRow | null> {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) return null;
  const sql = await db();
  const rows = (await sql`SELECT id, study_id, study, engines, runs, simulated, status, total, report, audit, share_token, created_by, created_at, finished_at FROM geo_runs WHERE share_token = ${token} AND report IS NOT NULL`) as RunRow[];
  return withFreshReport(rows[0] ?? null);
}

export async function createRun(
  study: StudyRow,
  opts: { engines: EngineId[]; runs: number; limit?: number; simulated: boolean; keys?: ApiKeys },
  email: string,
) {
  const prompts = opts.limit ? study.data.prompts.slice(0, opts.limit) : study.data.prompts;
  const snapshot: Study = { ...study.data, prompts, runs: opts.runs, engines: opts.engines };
  const total = listTasks(prompts, opts.engines, opts.runs).length;
  const sql = await db();
  const rows = (await sql`
    INSERT INTO geo_runs (study_id, study, engines, runs, simulated, total, created_by, api_keys)
    VALUES (${study.id}, ${JSON.stringify(snapshot)}::jsonb, ${opts.engines}, ${opts.runs}, ${opts.simulated}, ${total}, ${email}, ${opts.keys ? sealKeys(opts.keys) : null})
    RETURNING id`) as { id: string }[];
  return rows[0].id;
}

export async function setRunAudit(runId: string, audit: StoredAudit) {
  const sql = await db();
  await sql`UPDATE geo_runs SET audit = ${JSON.stringify(audit)}::jsonb WHERE id = ${runId}`;
}

export async function getRecords(runId: string): Promise<RunRecord[]> {
  const sql = await db();
  const rows = (await sql`SELECT record FROM geo_responses WHERE run_id = ${runId} ORDER BY created_at`) as { record: RunRecord }[];
  return rows.map((r) => r.record);
}

export type RunError = { engine: EngineId; error: string; count: number };

export async function progress(runId: string) {
  const sql = await db();
  const rows = (await sql`SELECT count(*)::int AS answered, count(*) FILTER (WHERE NOT ok)::int AS failed FROM geo_responses WHERE run_id = ${runId}`) as { answered: number; failed: number }[];
  const errors = rows[0].failed
    ? ((await sql`
        SELECT record->>'engine' AS engine, record->>'error' AS error, count(*)::int AS count
        FROM geo_responses WHERE run_id = ${runId} AND NOT ok
        GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 3`) as RunError[])
    : [];
  return { ...rows[0], errors };
}

async function finalize(run: RunRow, status: RunStatus) {
  const sql = await db();
  const records = await getRecords(run.id);
  // A report with no valid answers would read as "0%" instead of "it didn't run".
  const report = records.some((r) => r.ok) ? buildReport(run.study, records) : null;
  await sql`
    UPDATE geo_runs SET status = ${status}, report = ${report ? JSON.stringify(report) : null}::jsonb,
      finished_at = now(), lease_until = NULL, api_keys = NULL
    WHERE id = ${run.id}`;
}

// No new questions start after this; calls already in flight can take a while longer
// (web search is slow), which is why the step route allows 300s.
const STEP_BUDGET_MS = 30_000;
const STEP_CONCURRENCY = 8;
// Failures in a row, with no success, that mean a bad key or quota rather than bad luck.
const FAIL_FAST = 4;

const RUN_COLUMNS = "id, study_id, study, engines, runs, simulated, status, total, report, share_token, created_by, created_at, finished_at, api_keys";

/** Llave de cada motor para esta medición: la del scan, luego la del estudio; sin ellas, la del servidor. */
async function keysFor(run: RunRow & { api_keys?: string | null }): Promise<ApiKeys> {
  return { ...(await studyKeys(run.study_id)), ...openKeys(run.api_keys) };
}

/** Motores que tienen con qué responder: llave del cliente o del servidor. */
export function enginesWithKeys(engines: EngineId[], keys: ApiKeys) {
  return engines.filter((e) => !!keys[e] || !!process.env[ENGINES[e].envKey]);
}

/** Takes the run for one batch of work, or returns null if it's finished or another worker holds it. */
export async function leaseRun(runId: string): Promise<RunRow | null> {
  const sql = await db();
  const rows = (await sql.query(
    `UPDATE geo_runs SET lease_until = now() + interval '330 seconds'
     WHERE id = $1 AND status = 'running' AND (lease_until IS NULL OR lease_until < now())
     RETURNING ${RUN_COLUMNS}`,
    [runId],
  )) as RunRow[];
  return rows[0] ?? null;
}

/**
 * Answers one batch of a leased run, then releases the lease. Runs in the background
 * (see the step route), and the next batch is chained from there.
 * Returns whether the run still has work left.
 */
export async function workRun(run: RunRow): Promise<boolean> {
  const sql = await db();
  const runId = run.id;
  try {
    const doneRows = (await sql`SELECT key FROM geo_responses WHERE run_id = ${runId}`) as { key: string }[];
    const done = new Set(doneRows.map((r) => r.key));
    const pending = listTasks(run.study.prompts, run.engines, run.runs).filter((t) => !done.has(t.key));
    if (!pending.length) {
      await finalize(run, "done");
      return false;
    }

    const keys = run.simulated ? {} : await keysFor(run);
    const missing = run.simulated ? [] : run.engines.filter((e) => !enginesWithKeys([e], keys).length);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STEP_BUDGET_MS);
    let okCount = 0;
    let failCount = 0;
    try {
      await pool(
        pending,
        STEP_CONCURRENCY,
        async (task) => {
          let record: RunRecord;
          if (missing.includes(task.engine)) {
            record = {
              key: task.key, engine: task.engine, simulated: false, promptId: task.prompt.id, promptType: task.prompt.type,
              prompt: task.prompt.text, run: task.run, at: new Date().toISOString(), ms: 0, ok: false,
              error: `Falta la llave ${ENGINES[task.engine].envKey} en el servidor`,
            };
          } else {
            const engine = run.simulated ? createMockEngine(task.engine, run.study) : ENGINES[task.engine];
            const { answer, ...rest } = await executeTask(task, engine, run.study, {
              simulated: run.simulated,
              signal: controller.signal,
              apiKey: keys[task.engine],
            });
            // Raw provider payloads are large and not needed for the report.
            record = answer ? { ...rest, answer: { ...answer, raw: null } } : rest;
          }
          if (record.ok) okCount++;
          else {
            failCount++;
            console.warn(`geo run ${runId}: ${task.key} failed: ${record.error}`);
            if (failCount >= FAIL_FAST && okCount === 0) controller.abort();
          }
          await sql`
            INSERT INTO geo_responses (run_id, key, ok, record) VALUES (${runId}, ${task.key}, ${record.ok}, ${JSON.stringify(record)}::jsonb)
            ON CONFLICT (run_id, key) DO UPDATE SET ok = EXCLUDED.ok, record = EXCLUDED.record, created_at = now()`;
        },
        controller.signal,
      );
    } finally {
      clearTimeout(timer);
    }

    if (failCount >= FAIL_FAST && okCount === 0) {
      await finalize(run, "cancelled");
      return false;
    }
    const answered = (await sql`SELECT count(*)::int AS n FROM geo_responses WHERE run_id = ${runId}`) as { n: number }[];
    if (answered[0].n >= run.total) {
      await finalize(run, "done");
      return false;
    }
    return true;
  } catch (err) {
    console.error(`geo run ${runId}: batch failed`, err);
    return true;
  } finally {
    await sql`UPDATE geo_runs SET lease_until = NULL WHERE id = ${runId} AND status = 'running'`;
  }
}

export async function cancelRun(runId: string) {
  const run = await getRun(runId);
  if (run?.status === "running") await finalize(run, "cancelled");
}

/** Forgets failed answers and puts the run back in the queue to ask them again. */
export async function retryFailed(runId: string) {
  const sql = await db();
  await sql`DELETE FROM geo_responses WHERE run_id = ${runId} AND NOT ok`;
  await sql`UPDATE geo_runs SET status = 'running', finished_at = NULL, lease_until = NULL WHERE id = ${runId}`;
}

export async function setSharing(runId: string, enabled: boolean) {
  const sql = await db();
  if (enabled) {
    const run = await getRun(runId);
    if (!run?.report) return null;
  }
  const token = enabled ? randomBytes(24).toString("base64url") : null;
  await sql`UPDATE geo_runs SET share_token = ${token} WHERE id = ${runId}`;
  return token;
}

export async function deleteRun(runId: string) {
  const sql = await db();
  await sql`DELETE FROM geo_runs WHERE id = ${runId}`;
}

// ---------- Tendencias ----------

export type TrendPoint = {
  id: string;
  at: string;
  engines: EngineId[];
  answers: number;
  mention: Report["overall"]["unbranded"]["mention"];
  byEngine: Partial<Record<EngineId, Report["overall"]["unbranded"]["mention"]>>;
  brands: { name: string; rate: Report["overall"]["unbranded"]["mention"]; perEngine: Partial<Record<EngineId, Report["overall"]["unbranded"]["mention"]>> }[];
};

/** Cada medición terminada del estudio, de la más vieja a la más nueva, con lo que necesita la gráfica. */
export async function listTrend(studyId: string): Promise<TrendPoint[]> {
  const sql = await db();
  const rows = (await sql`
    SELECT id, created_at, engines, report
    FROM geo_runs
    WHERE study_id = ${studyId} AND report IS NOT NULL AND NOT simulated
    ORDER BY created_at ASC LIMIT 120`) as { id: string; created_at: string; engines: EngineId[]; report: Report }[];
  return rows
    .filter((r) => r.report.responses?.ok)
    .map((r) => ({
      id: r.id,
      at: r.created_at,
      engines: r.engines,
      answers: r.report.responses.ok,
      mention: r.report.overall.unbranded.mention,
      byEngine: Object.fromEntries(Object.entries(r.report.byEngine).map(([e, v]) => [e, v.unbranded.mention])),
      brands: r.report.shareOfVoice.map((x) => ({ name: x.name, rate: x.overall, perEngine: x.perEngine })),
    }));
}

/** La medición terminada anterior a esta, del mismo estudio, para comparar. */
export async function previousRun(run: RunRow) {
  const sql = await db();
  const rows = (await sql`
    SELECT id, created_at FROM geo_runs
    WHERE study_id = ${run.study_id} AND id <> ${run.id} AND created_at < ${run.created_at}
      AND report IS NOT NULL AND simulated = ${run.simulated}
    ORDER BY created_at DESC LIMIT 1`) as { id: string; created_at: string }[];
  if (!rows[0]) return null;
  const prev = await getRun(rows[0].id);
  return prev?.report?.responses.ok ? { report: prev.report, date: prev.created_at } : null;
}

// ---------- Seguimiento automático ----------

const EVERY_DAYS: Record<Tracking["every"], number> = { weekly: 7, monthly: 30 };

/** Estudios con seguimiento cuya última medición ya tiene la edad para volver a medir. */
export async function dueStudies(): Promise<StudyRow[]> {
  const sql = await db();
  const rows = (await sql.query(
    `SELECT ${STUDY_COLUMNS}, (SELECT max(created_at) FROM geo_runs r WHERE r.study_id = s.id AND NOT r.simulated) AS last_run
     FROM geo_studies s WHERE s.tracking IS NOT NULL`,
    [],
  )) as (StudyRow & { last_run: string | null })[];
  // Un margen de 2 horas, para que el cron diario no se salte un día por minutos.
  const now = Date.now();
  return rows.filter((s) => {
    if (!s.last_run) return true;
    const days = EVERY_DAYS[s.tracking!.every] ?? 30;
    return now - new Date(s.last_run).getTime() >= days * 86_400_000 - 2 * 3_600_000;
  });
}

/** Mediciones que se quedaron a medias (sin trabajador), para reanudarlas. */
export async function stalledRuns(): Promise<string[]> {
  const sql = await db();
  const rows = (await sql`
    SELECT id FROM geo_runs WHERE status = 'running' AND (lease_until IS NULL OR lease_until < now())
    ORDER BY created_at LIMIT 20`) as { id: string }[];
  return rows.map((r) => r.id);
}
