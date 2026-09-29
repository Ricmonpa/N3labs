import "server-only";
import { AuditError, runAudit, type AuditReport } from "@/lib/geo/audit";
import type { Study } from "@/lib/geo-visibility/types.ts";
import { setRunAudit } from "./store";

/**
 * "¿Te pueden leer?" dentro del estudio: la revisión técnica del sitio se toma al arrancar cada
 * medición y se guarda con ella, para compararla mes a mes igual que las menciones.
 * No usa IA: solo descarga páginas del sitio.
 */

/** The audit, or why it couldn't run (so the report says so instead of showing nothing). */
export type StoredAudit = AuditReport | { error: string; at: string };

export function isAudit(a: StoredAudit | null | undefined): a is AuditReport {
  return !!a && "categories" in a;
}

export function auditLang(study: Study): "es" | "en" {
  return study.market.language?.toLowerCase().startsWith("en") ? "en" : "es";
}

/** The site to check for a study: its first domain. */
export function siteOf(study: Study) {
  return study.brand.domains[0] ? `https://${study.brand.domains[0]}` : null;
}

export async function auditSite(url: string, lang: "es" | "en"): Promise<StoredAudit> {
  try {
    return await runAudit(url, lang);
  } catch (err) {
    if (!(err instanceof AuditError)) console.error("readability audit failed", err);
    const code = err instanceof AuditError ? (err.status ? `${err.code}:${err.status}` : err.code) : "unreachable";
    return { error: code, at: new Date().toISOString() };
  }
}

export async function auditRun(runId: string, url: string, lang: "es" | "en") {
  await setRunAudit(runId, await auditSite(url, lang));
}
