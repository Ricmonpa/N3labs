import "server-only";
import { after } from "next/server";
import { internalStepToken } from "./auth";
import { leaseRun, workRun } from "./store";

/**
 * Starts the next batch of a run in the background, unless another worker holds it.
 * When the batch ends the server calls the step route again, so the run keeps going
 * with no page open. Safe to call as often as you like: only one worker gets the lease.
 */
export async function kickRun(runId: string, origin: string) {
  const leased = await leaseRun(runId);
  if (!leased) return false;
  after(async () => {
    if (!(await workRun(leased))) return;
    await fetch(`${origin}/api/panel/runs/${runId}/step`, {
      method: "POST",
      headers: { "x-panel-step": internalStepToken(runId) },
      signal: AbortSignal.timeout(15_000),
    }).catch((err) => console.warn(`geo run ${runId}: could not chain next batch`, err));
  });
  return true;
}
