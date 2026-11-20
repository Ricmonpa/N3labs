"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Lock, Radar } from "lucide-react";
import { emailRe, sendLead } from "@/lib/leads";

const STORAGE_KEY = "n3-geotool-access";
// El formulario del scan toma nombre y correo de aquí para no pedirlos dos veces.
const SCAN_PREFILL_KEY = "n3-geo-access";

const ERRORS: Record<string, string> = {
  invalid_name: "Escribe tu nombre.",
  invalid_email: "Escribe un correo válido.",
  invalid_company: "Escribe el nombre de tu empresa.",
  rate_limited: "Hubo demasiados registros desde esta conexión. Intenta más tarde.",
};

const inputCls =
  "w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 transition-all";

/** Para usar el N3 GeoTool hay que registrarse una vez; el registro llega al panel y a la hoja de leads. */
export default function GeoToolGate({ children, frame = "" }: { children: React.ReactNode; frame?: string }) {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", whatsapp: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY)) setUnlocked(true);
      const prev = JSON.parse(localStorage.getItem(SCAN_PREFILL_KEY) ?? localStorage.getItem("n3-prompter-access") ?? "null");
      if (prev?.name || prev?.email) setForm((f) => ({ ...f, name: prev.name ?? "", email: prev.email ?? "" }));
    } catch {
      /* ignore */
    }
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError(ERRORS.invalid_name);
    if (!emailRe.test(form.email.trim())) return setError(ERRORS.invalid_email);
    if (!form.company.trim()) return setError(ERRORS.invalid_company);

    setSubmitting(true);
    try {
      const res = await fetch("/api/geo/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lang: "es", origin: document.referrer }),
      });
      if (res.status === 422 || res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setSubmitting(false);
        return setError(ERRORS[data.error] ?? ERRORS.invalid_email);
      }
    } catch {
      /* La hoja de leads también lo recibe: si el servidor falla, no se le cierra la puerta al visitante. */
    }
    const lead = await sendLead({ name: form.name, email: form.email, lang: "es", source: "geotool", company: form.company.trim(), whatsapp: form.whatsapp.trim() });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
      localStorage.setItem(SCAN_PREFILL_KEY, JSON.stringify({ name: lead.name, email: lead.email }));
    } catch {
      /* ignore */
    }
    setSubmitting(false);
    setUnlocked(true);
  };

  if (!mounted) return <div className="min-h-[60vh]" />;
  if (unlocked) return <>{children}</>;

  return (
    <div className={frame}>
    <div className="mx-auto max-w-xl">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium">
        <Radar size={12} className="text-red-500" />
        N3 GeoTool
      </span>
      <h1 className="mt-5 text-[clamp(1.8rem,4.5vw,2.6rem)] font-black text-white leading-tight">¿A qué marcas recomiendan las IAs?</h1>
      <p className="mt-3 text-zinc-400 leading-relaxed">
        Mediciones reales de qué marcas recomiendan las IAs en México, informe completo por marca y medición de tu propia marca con tu
        llave de API. Regístrate una vez para entrar.
      </p>

      <form onSubmit={submit} noValidate className="mt-7 glass rounded-2xl border border-white/[0.08] p-6 sm:p-7 space-y-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Lock size={15} className="text-red-500" />
          Registro gratuito
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-400 mb-1.5">Nombre</span>
            <input value={form.name} onChange={set("name")} autoComplete="name" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-400 mb-1.5">Correo de trabajo</span>
            <input type="email" value={form.email} onChange={set("email")} autoComplete="email" autoCapitalize="none" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-400 mb-1.5">Empresa</span>
            <input value={form.company} onChange={set("company")} autoComplete="organization" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-400 mb-1.5">
              WhatsApp <span className="font-normal text-zinc-600">(opcional)</span>
            </span>
            <input type="tel" value={form.whatsapp} onChange={set("whatsapp")} autoComplete="tel" inputMode="tel" className={inputCls} />
          </label>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3.5 transition-colors"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          Entrar al N3 GeoTool
        </button>
        <p className="text-center text-[11px] text-zinc-500">Solo te escribimos sobre tu diagnóstico. Gratis.</p>
      </form>
    </div>
    </div>
  );
}
