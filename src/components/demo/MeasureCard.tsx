"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";

/** Entrada principal del N3 GeoTool: el sitio de la marca y a medir en vivo con la llave del cliente. */
export default function MeasureCard() {
  const router = useRouter();
  const [site, setSite] = useState("");
  const [error, setError] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const s = site.trim();
    if (!/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i.test(s)) return setError("Escribe el sitio de la marca, por ejemplo tuempresa.com.");
    router.push(`/scan-geo?modo=llave&sitio=${encodeURIComponent(s)}`);
  };

  return (
    <section className="mt-8 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-transparent p-5 sm:p-7">
      <h2 className="text-xl sm:text-2xl font-black text-white">Mide tu marca</h2>
      <p className="mt-1.5 text-sm text-zinc-400">
        Escribe el sitio de la marca. Revisamos si las IAs pueden leerlo y les hacemos las preguntas que haría tu cliente, en vivo, con
        tu llave de Gemini, ChatGPT, Claude o Perplexity. N3 no cobra nada.
      </p>
      <form onSubmit={go} noValidate className="mt-4 flex flex-col sm:flex-row gap-3">
        <label className="flex flex-1 items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 focus-within:border-red-500/60">
          <Globe size={18} className="text-zinc-500 shrink-0" />
          <input
            value={site}
            onChange={(e) => {
              setSite(e.target.value);
              setError("");
            }}
            placeholder="tuempresa.com"
            aria-label="Sitio de la marca"
            inputMode="url"
            autoCapitalize="none"
            autoComplete="url"
            className="w-full bg-transparent font-mono text-base text-white placeholder:text-zinc-600 outline-none"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-3 transition-colors"
        >
          Medir
          <ArrowRight size={16} />
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
