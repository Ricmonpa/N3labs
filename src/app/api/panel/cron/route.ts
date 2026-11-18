import { after } from "next/server";
import { createRun, dueStudies, enginesWithKeys, stalledRuns, studyKeys } from "@/lib/panel/store";
import { auditLang, auditRun, siteOf } from "@/lib/panel/readability";
import { kickRun } from "@/lib/panel/worker";
import { fail, ok } from "@/lib/panel/http";

export const maxDuration = 300;

/** Mediciones automáticas que puede arrancar un solo día, para que un error no dispare el gasto. */
const MAX_PER_DAY = Number(process.env.GEO_TRACKING_MAX_PER_DAY ?? 10);

/**
 * Lo llama el cron de Vercel una vez al día (vercel.json). Reanuda mediciones que se quedaron
 * a medias y arranca las de los estudios con seguimiento automático que ya toca medir.
 * Vercel manda CRON_SECRET en el encabezado; sin esa variable, la ruta no hace nada.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return fail(401, "unauthorized");
  const origin = new URL(request.url).origin;

  const resumed: string[] = [];
  for (const id of await stalledRuns()) if (await kickRun(id, origin)) resumed.push(id);

  const started: { study: string; run: string }[] = [];
  const skipped: { study: string; reason: string }[] = [];
  for (const study of (await dueStudies()).slice(0, MAX_PER_DAY)) {
    const engines = enginesWithKeys(study.tracking!.engines, await studyKeys(study.id));
    if (!engines.length) {
      skipped.push({ study: study.data.name, reason: "sin llaves" });
      continue;
    }
    const runId = await createRun(study, { engines, runs: study.tracking!.runs, simulated: false }, "seguimiento automático");
    const site = siteOf(study.data);
    if (site) after(() => auditRun(runId, site, auditLang(study.data)));
    await kickRun(runId, origin);
    started.push({ study: study.data.name, run: runId });
  }
  return ok({ resumed, started, skipped });
}
