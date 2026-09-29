"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import Readability from "@/components/geo/Readability";
import type { StoredAudit } from "@/lib/panel/readability";

const REASONS: Record<string, string> = {
  invalid_url: "la dirección del sitio no es válida",
  not_found: "el dominio no existe o no resuelve",
  blocked_target: "esa dirección no se puede revisar (solo sitios públicos)",
  unreachable: "el sitio no respondió o tardó demasiado",
  http_error: "el sitio respondió con un error",
};

/** How long after a run starts we keep waiting for its readability check. */
const PENDING_MS = 3 * 60_000;

/** "¿Te pueden leer?" de una medición: la revisión guardada, o por qué no está. */
export default function RunReadability({ audit, lang, startedAt }: { audit: StoredAudit | null; lang: "es" | "en"; startedAt: string }) {
  const router = useRouter();
  const [openedAt] = useState(() => Date.now());
  const pending = !audit && openedAt - new Date(startedAt).getTime() < PENDING_MS;

  // The check runs on the server right after the run starts; refresh until it's saved.
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => router.refresh(), 5000);
    const stop = setTimeout(() => clearInterval(t), PENDING_MS);
    return () => (clearInterval(t), clearTimeout(stop));
  }, [pending, router]);

  if (audit && "categories" in audit) return <Readability report={audit} lang={lang} />;

  if (audit) {
    const [code, status] = audit.error.split(":");
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-amber-300">
          <AlertTriangle size={15} /> No pudimos revisar el sitio
        </p>
        <p className="mt-1 text-zinc-300">
          Motivo: {REASONS[code] ?? REASONS.unreachable}
          {status ? ` (${status})` : ""}. Se vuelve a intentar en la próxima medición.
        </p>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm" aria-live="polite">
        <p className="flex items-center gap-2 font-semibold text-white">
          <Loader2 size={15} className="animate-spin text-red-500" /> Revisando si las IAs pueden leer el sitio…
        </p>
        <p className="mt-1 text-zinc-400">Tarda unos segundos y no usa IA.</p>
      </div>
    );
  }

  return <p className="text-sm text-zinc-500">Esta medición es de antes de que el estudio incluyera la revisión de legibilidad.</p>;
}
