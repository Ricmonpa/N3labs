import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ENGINES } from "../../../src/lib/geo-visibility/engines/index.ts";
import { createMockEngine } from "../../../src/lib/geo-visibility/engines/mock.ts";
import { executeTask, listTasks, pool } from "../../../src/lib/geo-visibility/execute.ts";
import { validateStudy } from "../../../src/lib/geo-visibility/study.ts";
import type { EngineId, RunRecord, Study } from "../../../src/lib/geo-visibility/types.ts";
import { analyzeDir } from "./analyze.ts";

const OUT_ROOT = path.resolve(import.meta.dirname, "..", "out");

function slug(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function loadStudy(file: string): Promise<Study> {
  const study = JSON.parse(await readFile(file, "utf8")) as Study;
  const problems = validateStudy(study);
  if (problems.length) throw new Error(`Estudio inválido (${file}):\n- ${problems.join("\n- ")}`);
  return study;
}

async function doneKeys(file: string): Promise<Set<string>> {
  if (!existsSync(file)) return new Set();
  const keys = new Set<string>();
  for (const line of (await readFile(file, "utf8")).split("\n")) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line) as RunRecord;
    if (rec.ok) keys.add(rec.key);
  }
  return keys;
}

export type RunOptions = {
  study: Study;
  engines: EngineId[];
  runs: number;
  limit?: number;
  concurrency?: number;
  simulate?: boolean;
  outDir?: string;
};

export async function planRun(opts: RunOptions) {
  const { study, simulate = false } = opts;
  const prompts = opts.limit ? study.prompts.slice(0, opts.limit) : study.prompts;
  const available = opts.engines.filter((id) => {
    if (!ENGINES[id]) throw new Error(`Motor desconocido: ${id}`);
    return simulate || !!process.env[ENGINES[id].envKey];
  });
  const missing = opts.engines.filter((id) => !available.includes(id)).map((id) => `${ENGINES[id].label} (${ENGINES[id].envKey})`);
  const date = new Date().toISOString().slice(0, 10);
  const outDir = opts.outDir ?? path.join(OUT_ROOT, slug(study.name), simulate ? `${date}-simulacion` : date);
  const file = path.join(outDir, "responses.jsonl");
  const skip = await doneKeys(file);
  const tasks = listTasks(prompts, available, opts.runs).filter((t) => !skip.has(t.key));
  const engines = available.map((id) => ({
    id,
    label: ENGINES[id].label,
    model: simulate ? "simulacion" : ENGINES[id].model,
    calls: tasks.filter((t) => t.engine === id).length,
  }));
  return { outDir, file, prompts, tasks, engines, missing, pending: tasks.length, alreadyDone: skip.size };
}

/** Runs the pending calls (resumable), then writes the report. */
export async function runStudy(opts: RunOptions, onProgress?: (p: { done: number; total: number; key: string; ok: boolean; error?: string }) => void) {
  const { study, simulate = false } = opts;
  const plan = await planRun(opts);
  await mkdir(plan.outDir, { recursive: true });
  // Save what this run actually covers, so the report header matches it.
  await writeFile(path.join(plan.outDir, "study.json"), JSON.stringify({ ...study, prompts: plan.prompts, runs: opts.runs }, null, 2));

  let written = Promise.resolve();
  let done = 0;
  let failed = 0;
  await pool(plan.tasks, opts.concurrency ?? 3, async (t) => {
    const engine = simulate ? createMockEngine(t.engine, study) : ENGINES[t.engine];
    const { answer, ...rest } = await executeTask(t, engine, study, { simulated: simulate });
    const record: RunRecord = answer ? { ...rest, answer: { ...answer, raw: null } } : rest;
    // Serialize appends so lines never interleave.
    written = written.then(() => appendFile(plan.file, JSON.stringify(record) + "\n"));
    await written;
    done++;
    if (!record.ok) failed++;
    onProgress?.({ done, total: plan.tasks.length, key: t.key, ok: record.ok, error: record.error });
  });

  const report = existsSync(plan.file) ? await analyzeDir(plan.outDir) : null;
  return { plan, failed, report };
}
