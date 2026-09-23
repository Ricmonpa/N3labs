import "server-only";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import type { Report } from "@/lib/geo-visibility/report.ts";
import type { Study, StudyPrompt } from "@/lib/geo-visibility/types.ts";
import { internalStepToken } from "./auth";
import { db } from "./db";
import { getInvite, inviteUsable, useInvite } from "./invites";
import { createRun, createStudy, getRun, progress } from "./store";
import { suggestStudy } from "./suggest";
import { kickRun } from "./worker";

/**
 * Public visibility scan behind /geo: a light study (Gemini only, a dozen questions, two
 * repetitions) drafted from the visitor's URL and run in the background. The full study
 * (four engines, more questions, monthly) is what N3 sells.
 */

export class ScanError extends Error {
  constructor(public code: "invalid_url" | "invalid_email" | "rate_limited" | "busy" | "unavailable") {
    super(code);
  }
}

export type ScanView =
  | { status: "preparing" }
  | { status: "running"; answered: number; total: number }
  | { status: "done"; report: Report }
  | { status: "failed" };

type ScanRow = {
  id: string;
  token: string;
  status: "preparing" | "running" | "failed";
  run_id: string | null;
  email: string;
  created_at: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Scans a single visitor (email or IP) can start per day. */
const PER_CLIENT = 3;
/** Scans per day for everyone, so a burst can't run up the bill. */
const DAILY_CAP = Number(process.env.GEO_SCAN_DAILY_CAP ?? 40);
/** A site scanned recently gets the same result instead of a new, paid run. */
const REUSE_HOURS = 24;
const PREPARE_TIMEOUT_MIN = 5;

const LITE = { category: 5, problem: 4, comparison: 1, brand: 2 } as const;
const RUNS = 2;

function domainOf(raw: string) {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes(".")) return null;
    return { url: url.toString(), domain: url.hostname.toLowerCase().replace(/^www\./, "") };
  } catch {
    return null;
  }
}

/** A dozen questions, mostly the kind where the client doesn't name the brand. */
function lite(study: Study): Study {
  const picked: StudyPrompt[] = [];
  for (const [type, n] of Object.entries(LITE)) {
    picked.push(...study.prompts.filter((p) => p.type === type).slice(0, n));
  }
  return { ...study, prompts: picked, runs: RUNS, engines: ["gemini"] };
}

/** Codes that unlock /scan-geo for a prospect, from GEO_SCAN_CODES (separados por coma). */
export function validCode(code?: string | null) {
  const codes = (process.env.GEO_SCAN_CODES ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  const given = (code ?? "").trim().toLowerCase();
  return !!given && codes.includes(given);
}

/**
 * /scan-geo está abierto: el link se comparte y funciona.
 * Para cerrarlo a invitados, pon GEO_SCAN_REQUIRE_CODE=on y lista los códigos
 * en GEO_SCAN_CODES; entonces solo corre con /scan-geo?c=<código>.
 */
export function scanOpenToEveryone() {
  return process.env.GEO_SCAN_REQUIRE_CODE !== "on";
}

export function scanAllowed(code?: string | null) {
  return !!process.env.GEMINI_API_KEY && (scanOpenToEveryone() || validCode(code));
}

export async function startScan(
  input: { url: string; name: string; email: string; lang: "es" | "en"; ip: string; code?: string; invite?: string },
  origin: string,
) {
  const site = domainOf(input.url.trim());
  if (!site) throw new ScanError("invalid_url");
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email)) throw new ScanError("invalid_email");
  // Un link de invitación del panel siempre corre, aunque el acceso esté cerrado.
  const invite = input.invite ? await getInvite(input.invite) : null;
  if (!scanAllowed(input.code) && !inviteUsable(invite)) throw new ScanError("unavailable");

  const sql = await db();

  const recent = (await sql`
    SELECT id, token FROM geo_scans
    WHERE domain = ${site.domain} AND status <> 'failed' AND created_at > now() - make_interval(hours => ${REUSE_HOURS})
    ORDER BY created_at DESC LIMIT 1`) as { id: string; token: string }[];
  if (recent[0]) return recent[0];

  const [usage] = (await sql`
    SELECT count(*) FILTER (WHERE email = ${email} OR ip = ${input.ip})::int AS mine, count(*)::int AS everyone
    FROM geo_scans WHERE created_at > now() - interval '24 hours'`) as { mine: number; everyone: number }[];
  if (usage.mine >= PER_CLIENT) throw new ScanError("rate_limited");
  if (usage.everyone >= DAILY_CAP) throw new ScanError("busy");

  const token = randomBytes(24).toString("base64url");
  const [row] = (await sql`
    INSERT INTO geo_scans (token, domain, url, name, email, ip, lang)
    VALUES (${token}, ${site.domain}, ${site.url}, ${input.name.trim().slice(0, 120)}, ${email}, ${input.ip}, ${input.lang})
    RETURNING id`) as { id: string }[];

  if (invite) await useInvite(invite.token, email);
  after(() => prepare(row.id, site.url, input.lang, email, origin));
  return { id: row.id, token };
}

/** Drafts the study from the site, then starts its run. Runs after the response is sent. */
async function prepare(scanId: string, url: string, lang: "es" | "en", email: string, origin: string) {
  const sql = await db();
  try {
    const suggestion = await suggestStudy(
      lang === "en" ? { url, country: "US", language: "en-US" } : { url, country: "MX", language: "es-MX" },
    );
    // A template study would report on generic questions; better to say it didn't run.
    if (suggestion.source !== "ai") throw new Error(suggestion.warnings.join(" ") || "no AI draft");

    const owner = `scan:${email}`;
    const study = await createStudy(lite(suggestion.study), owner);
    const runId = await createRun(study, { engines: ["gemini"], runs: RUNS, simulated: false }, owner);
    await sql`UPDATE geo_scans SET status = 'running', run_id = ${runId} WHERE id = ${scanId}`;

    await fetch(`${origin}/api/panel/runs/${runId}/step`, {
      method: "POST",
      headers: { "x-panel-step": internalStepToken(runId) },
      signal: AbortSignal.timeout(15_000),
    }).catch((err) => console.warn(`geo scan ${scanId}: could not start run`, err));
  } catch (err) {
    console.error(`geo scan ${scanId}: prepare failed`, err);
    await sql`UPDATE geo_scans SET status = 'failed', error = ${String(err).slice(0, 500)} WHERE id = ${scanId}`;
  }
}

/** Where a scan is. Also restarts the run's background work if it stalled. */
export async function getScan(id: string, token: string, origin: string): Promise<ScanView | null> {
  const sql = await db();
  const rows = (await sql`
    SELECT id, token, status, run_id, email, created_at FROM geo_scans WHERE id = ${id} AND token = ${token}`) as ScanRow[];
  const scan = rows[0];
  if (!scan) return null;

  if (scan.status === "failed") return { status: "failed" };

  if (scan.status === "preparing") {
    const stale = Date.now() - new Date(scan.created_at).getTime() > PREPARE_TIMEOUT_MIN * 60_000;
    if (!stale) return { status: "preparing" };
    await sql`UPDATE geo_scans SET status = 'failed', error = 'prepare timed out' WHERE id = ${id}`;
    return { status: "failed" };
  }

  const run = scan.run_id ? await getRun(scan.run_id) : null;
  if (!run) return { status: "failed" };

  if (run.status === "running") {
    await kickRun(run.id, origin);
    const { answered } = await progress(run.id);
    return { status: "running", answered, total: run.total };
  }

  if (run.report?.responses.ok) return { status: "done", report: run.report };
  await sql`UPDATE geo_scans SET status = 'failed', error = 'run ended without answers' WHERE id = ${id}`;
  return { status: "failed" };
}
