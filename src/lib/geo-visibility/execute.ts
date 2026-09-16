import type { Engine, EngineId, RunRecord, Study, StudyPrompt } from "./types.ts";

const MAX_ATTEMPTS = 3;

export type Task = { engine: EngineId; prompt: StudyPrompt; run: number; key: string };

export function taskKey(engine: EngineId, promptId: string, run: number) {
  return `${engine}|${promptId}|${run}`;
}

/** Every call a study implies, in a stable order. */
export function listTasks(prompts: StudyPrompt[], engines: EngineId[], runs: number): Task[] {
  return engines.flatMap((engine) =>
    prompts.flatMap((prompt) =>
      Array.from({ length: runs }, (_, i) => ({ engine, prompt, run: i + 1, key: taskKey(engine, prompt.id, i + 1) })),
    ),
  );
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number") return status === 408 || status === 409 || status === 429 || status >= 500;
  const msg = String((err as Error)?.message ?? err);
  return /HTTP (408|409|429|5\d\d)|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
}

/** Readable error text; some SDKs bury the provider's message in a JSON string body. */
export function describeError(err: unknown): string {
  const e = err as { status?: unknown; body?: unknown; message?: unknown };
  if (typeof e?.body === "string") {
    try {
      const parsed = JSON.parse(e.body);
      const inner = (Array.isArray(parsed) ? parsed[0] : parsed)?.error;
      if (inner?.message) return `${e.status ?? inner.code ?? ""} ${inner.message}`.trim();
    } catch {
      /* fall through */
    }
  }
  return String(e?.message ?? err);
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });
}

/** Asks one engine one question, retrying transient failures. Never throws. */
export async function executeTask(
  task: Task,
  engine: Engine,
  study: Study,
  opts: { simulated: boolean; signal?: AbortSignal },
): Promise<RunRecord> {
  const started = Date.now();
  const base = {
    key: task.key,
    engine: task.engine,
    simulated: opts.simulated,
    promptId: task.prompt.id,
    promptType: task.prompt.type,
    prompt: task.prompt.text,
    run: task.run,
  };
  for (let attempt = 1; ; attempt++) {
    try {
      const answer = await engine.ask(task.prompt.text, study.market);
      return { ...base, at: new Date().toISOString(), ms: Date.now() - started, ok: true, answer };
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && isTransient(err) && !opts.signal?.aborted) {
        await sleep(2000 * 2 ** (attempt - 1) + Math.random() * 1000, opts.signal);
        continue;
      }
      return { ...base, at: new Date().toISOString(), ms: Date.now() - started, ok: false, error: describeError(err).slice(0, 500) };
    }
  }
}

/** Runs tasks with a fixed number of workers. */
export async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>, signal?: AbortSignal) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), queue.length) }, async () => {
      while (queue.length && !signal?.aborted) await fn(queue.shift()!);
    }),
  );
}
