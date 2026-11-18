"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, X } from "lucide-react";
import type { EngineId } from "@/lib/geo-visibility/types.ts";
import { api, cardClass, inputClass, secondaryButton } from "./api";

export type KeyEngine = { id: EngineId; label: string; serverKey: boolean };

const WHERE: Record<EngineId, string> = {
  openai: "platform.openai.com → API keys",
  anthropic: "console.anthropic.com → API Keys",
  gemini: "aistudio.google.com → Get API key",
  perplexity: "perplexity.ai → Settings → API",
};

/** Llaves de API del cliente: con ellas, sus mediciones las paga su cuenta y no la de N3. */
export default function StudyKeys({ studyId, engines, initial }: { studyId: string; engines: KeyEngine[]; initial: Partial<Record<EngineId, string>> }) {
  const router = useRouter();
  const [hints, setHints] = useState(initial);
  const [editing, setEditing] = useState<EngineId | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(engine: EngineId, key: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ hints: typeof hints }>(`/api/panel/studies/${studyId}/keys`, { method: "PUT", body: { engine, key } });
      setHints(res.hints);
      setEditing(null);
      setValue("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start gap-3">
        <KeyRound size={18} className="mt-0.5 text-red-500 shrink-0" />
        <div>
          <h2 className="text-base font-bold text-white">Llaves del cliente</h2>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
            Si el cliente pone su propia llave, las mediciones de este estudio se cobran en su cuenta y no en la de N3. Se guardan cifradas y aquí solo se ven los últimos 4 caracteres.
          </p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-white/[0.06]">
        {engines.map((e) => (
          <li key={e.id} className="py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="w-28 text-sm font-semibold text-white">{e.label}</span>
              {hints[e.id] ? (
                <span className="text-sm text-emerald-400">
                  Llave del cliente <span className="font-mono text-zinc-400">{hints[e.id]}</span>
                </span>
              ) : e.serverKey ? (
                <span className="text-sm text-zinc-400">Usa la llave de N3</span>
              ) : (
                <span className="text-sm text-zinc-500">Sin llave</span>
              )}
              <span className="ml-auto flex gap-2">
                {hints[e.id] && (
                  <button type="button" disabled={busy} onClick={() => save(e.id, null)} className={secondaryButton}>
                    <X size={14} /> Quitar
                  </button>
                )}
                {editing !== e.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(e.id);
                      setValue("");
                      setError("");
                    }}
                    className={secondaryButton}
                  >
                    {hints[e.id] ? "Cambiar" : "Poner llave"}
                  </button>
                )}
              </span>
            </div>
            {editing === e.id && (
              <form
                className="mt-2 flex flex-wrap gap-2"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (value.trim()) save(e.id, value.trim());
                }}
              >
                <input
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={value}
                  onChange={(ev) => setValue(ev.target.value)}
                  placeholder={`Llave de ${e.label}`}
                  aria-label={`Llave de API de ${e.label}`}
                  className={`${inputClass} flex-1 min-w-[16rem] font-mono`}
                />
                <button type="submit" disabled={busy || !value.trim()} className={secondaryButton}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : null} Comprobar y guardar
                </button>
                <button type="button" onClick={() => setEditing(null)} className="text-sm text-zinc-500 hover:text-white px-2">
                  Cancelar
                </button>
                <p className="w-full text-xs text-zinc-500">Dónde se saca: {WHERE[e.id]}. La comprobamos sin gastar respuestas.</p>
              </form>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
