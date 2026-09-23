"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2, Trash2 } from "lucide-react";
import type { Invite } from "@/lib/panel/invites";
import { api, inputClass, primaryButton } from "./api";

const linkFor = (token: string) =>
  typeof window === "undefined" ? "" : `${window.location.origin}/scan-geo?i=${token}`;

/** Links de un solo uso para mandarle el Scan GEO a un prospecto por WhatsApp. */
export default function InviteLinks({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const invite = await api<Invite>("/api/panel/invites", { body: { label, maxUses: 1 } });
      setLabel("");
      await copy(invite.token);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      setCopied(token);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      /* el navegador no dejó copiar: el link se ve en pantalla */
    }
  }

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">Links para prospectos</h2>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <p className="text-sm text-zinc-400">
          Crea un link de un solo uso y mándalo por WhatsApp. El prospecto pone su sitio y recibe el Scan GEO completo;
          después de usarlo, el link deja de servir.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && label.trim() && !busy && create()}
            placeholder="¿Para quién? Ej. Autycom · Jesús"
            className={`${inputClass} flex-1`}
          />
          <button type="button" onClick={create} disabled={busy || !label.trim()} className={primaryButton}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
            Crear link
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {invites.length > 0 && (
          <ul className="mt-5 divide-y divide-white/[0.06]">
            {invites.map((i) => {
              const used = i.uses >= i.max_uses;
              return (
                <li key={i.token} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{i.label}</p>
                    <p className="text-xs text-zinc-500">
                      {used ? `Usado${i.used_by ? ` por ${i.used_by}` : ""}` : "Sin usar"} ·{" "}
                      {new Date(i.created_at).toLocaleDateString("es-MX", { dateStyle: "medium" })}
                    </p>
                  </div>
                  {!used && (
                    <button
                      type="button"
                      onClick={() => copy(i.token)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-red-500/50 text-zinc-300 text-xs font-semibold px-3 py-1.5 transition-colors"
                    >
                      {copied === i.token ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copied === i.token ? "Copiado" : "Copiar link"}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Borrar link de ${i.label}`}
                    onClick={async () => {
                      if (!confirm(`¿Borrar el link de "${i.label}"?`)) return;
                      await api(`/api/panel/invites/${i.token}`, { method: "DELETE" }).catch(() => {});
                      router.refresh();
                    }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
