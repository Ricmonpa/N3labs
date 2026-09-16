import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { ENGINES } from "@/lib/geo-visibility/engines/index.ts";
import { createMockEngine } from "@/lib/geo-visibility/engines/mock.ts";
import { executeTask, listTasks, pool } from "@/lib/geo-visibility/execute.ts";
import { buildReport, type Report } from "@/lib/geo-visibility/report.ts";
import type { EngineId, RunRecord, Study } from "@/lib/geo-visibility/types.ts";

export type StudyRow = { id: string; data: Study; created_by: string; created_at: string; updated_at: string };

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
  share_token: string | null;
  created_by: string;
  created_at: string;
  finished_at: string | null;
};

export type RunSummary = Omit<RunRow, "study" | "report"> & {
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
    SELECT s.*, r.last_run, COALESCE(r.runs_count, 0)::int AS runs_count
    FROM geo_studies s
    LEFT JOIN (SELECT study_id, max(created_at) AS last_run, count(*) AS runs_count FROM geo_runs GROUP BY study_id) r
      ON r.study_id = s.id
    ORDER BY s.updated_at DESC`) as never;
}

export async function getStudy(id: string): Promise<StudyRow | null> {
  const sql = await db();
  const rows = (await sql`SELECT * FROM geo_studies WHERE id = ${id}`) as StudyRow[];
  return rows[0] ?? null;
}

export async function createStudy(data: Study, email: string): Promise<StudyRow> {
  const sql = await db();
  const rows = (await sql`INSERT INTO geo_studies (data, created_by) VALUES (${JSON.stringify(data)}::jsonb, ${email}) RETURNING *`) as StudyRow[];
  return rows[0];
}

export async function updateStudy(id: string, data: Study): Promise<StudyRow | null> {
  const sql = await db();
  const rows = (await sql`UPDATE geo_studies SET data = ${JSON.stringify(data)}::jsonb, updated_at = now() WHERE id = ${id} RETURNING *`) as StudyRow[];
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

export async function getRun(id: string): Promise<RunRow | null> {
  const sql = await db();
  const rows = (await sql`SELECT id, study_id, study, engines, runs, simulated, status, total, report, share_token, created_by, created_at, finished_at FROM geo_runs WHERE id = ${id}`) as RunRow[];
  return rows[0] ?? null;
}

export async function getRunByToken(token: string): Promise<RunRow | null> {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) return null;
  const sql = await db();
  const rows = (await sql`SELECT id, study_id, study, engines, runs, simulated, status, total, report, share_token, created_by, created_at, finished_at FROM geo_runs WHERE share_token = ${token} AND report IS NOT NULL`) as RunRow[];
  return rows[0] ?? null;
}

export async function createRun(study: StudyRow, opts: { engines: EngineId[]; runs: number; limit?: number; simulated: boolean }, email: string) {
  const prompts = opts.limit ? study.data.prompts.slice(0, opts.limit) : study.data.prompts;
  const snapshot: Study = { ...study.data, prompts, runs: opts.runs, engines: opts.engines };
  const total = listTasks(prompts, opts.engines, opts.runs).length;
  const sql = await db();
  const rows = (await sql`
    INSERT INTO geo_runs (study_id, study, engines, runs, simulated, total, created_by)
    VALUES (${study.id}, ${JSON.stringify(snapshot)}::jsonb, ${opts.engines}, ${opts.runs}, ${opts.simulated}, ${total}, ${email})
    RETURNING id`) as { id: string }[];
  return rows[0].id;
}

export async function getRecords(runId: string): Promise<RunRecord[]> {
  const sql = await db();
  const rows = (await sql`SELECT record FROM geo_responses WHERE run_id = ${runId} ORDER BY created_at`) as { record: RunRecord }[];
  return rows.map((r) => r.record);
}

export async function progress(runId: string) {
  const sql = await db();
  const rows = (await sql`SELECT count(*)::int AS answered, count(*) FILTER (WHERE NOT ok)::int AS failed FROM geo_responses WHERE run_id = ${runId}`) as { answered: number; failed: number }[];
  return rows[0];
}

async function finalize(run: RunRow, status: RunStatus) {
  const sql = await db();
  const records = await getRecords(run.id);
  const report = records.length ? buildReport(run.study, records) : null;
  await sql`
    UPDATE geo_runs SET status = ${status}, report = ${report ? JSON.stringify(report) : null}::jsonb,
      finished_at = now(), lease_until = NULL
    WHERE id = ${run.id}`;
}

// No new questions start after this; calls already in flight may take a few more minutes,
// which is why the step route allows 300s.
const STEP_BUDGET_MS = 60_000;
const STEP_CONCURRENCY = 4;

/**
 * Advances a run by one batch. The browser calls this in a loop while the run page is open,
 * so a run survives serverless time limits and resumes where it stopped.
 */
export async function stepRun(runId: string) {
  const sql = await db();
  // Lease the run so two open tabs don't ask the same questions twice.
  const leased = (await sql`
    UPDATE geo_runs SET lease_until = now() + interval '330 seconds'
    WHERE id = ${runId} AND status = 'running' AND (lease_until IS NULL OR lease_until < now())
    RETURNING id, study_id, study, engines, runs, simulated, status, total, report, share_token, created_by, created_at, finished_at`) as RunRow[];
  const run = leased[0];
  if (!run) return { busy: true };

  try {
    const doneRows = (await sql`SELECT key FROM geo_responses WHERE run_id = ${runId}`) as { key: string }[];
    const done = new Set(doneRows.map((r) => r.key));
    const pending = listTasks(run.study.prompts, run.engines, run.runs).filter((t) => !done.has(t.key));
    if (!pending.length) {
      await finalize(run, "done");
      return { busy: false };
    }

    const missing = run.simulated ? [] : run.engines.filter((e) => !process.env[ENGINES[e].envKey]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STEP_BUDGET_MS);
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
            const { answer, ...rest } = await executeTask(task, engine, run.study, { simulated: run.simulated, signal: controller.signal });
            // Raw provider payloads are large and not needed for the report.
            record = answer ? { ...rest, answer: { ...answer, raw: null } } : rest;
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

    const answered = (await sql`SELECT count(*)::int AS n FROM geo_responses WHERE run_id = ${runId}`) as { n: number }[];
    if (answered[0].n >= run.total) await finalize(run, "done");
    return { busy: false };
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
  const token = enabled ? randomBytes(24).toString("base64url") : null;
  await sql`UPDATE geo_runs SET share_token = ${token} WHERE id = ${runId}`;
  return token;
}

export async function deleteRun(runId: string) {
  const sql = await db();
  await sql`DELETE FROM geo_runs WHERE id = ${runId}`;
}
