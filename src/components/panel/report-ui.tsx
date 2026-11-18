import type { Rate } from "@/lib/geo-visibility/report.ts";
import type { SourceType } from "@/lib/geo-visibility/insights.ts";
import type { EngineId } from "@/lib/geo-visibility/types.ts";

/** Piezas que comparten el informe y sus secciones interactivas. */

export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const range = (r: Rate) => (r.n ? `${pct(r.low)}–${pct(r.high)}` : "—");
export const num = (x: number, digits = 1) => x.toLocaleString("es-MX", { maximumFractionDigits: digits });

// Paleta categórica validada sobre la superficie oscura del panel (orden fijo: no reordenar).
export const ENGINE_COLOR: Record<EngineId, string> = {
  openai: "#3987e5",
  anthropic: "#d95926",
  perplexity: "#199e70",
  gemini: "#c98500",
};

export const SOURCE_META: Record<SourceType, { label: string; color: string }> = {
  brand: { label: "Tu sitio", color: "#e66767" },
  competitor: { label: "Competidores", color: "#3987e5" },
  media: { label: "Medios y noticias", color: "#d95926" },
  blog: { label: "Blogs y guías", color: "#199e70" },
  store: { label: "Tiendas", color: "#c98500" },
  social: { label: "Redes y video", color: "#d55181" },
  reference: { label: "Referencia y reseñas", color: "#9085e9" },
  other: { label: "Empresas y otros sitios", color: "#6b6b66" },
};

export function Section({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-7 break-inside-avoid print:border-zinc-300 print:bg-white">
      {eyebrow && <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500 mb-1.5">{eyebrow}</p>}
      <h2 className="text-lg sm:text-xl font-bold text-white print:text-black">{title}</h2>
      {intro && <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed max-w-3xl print:text-zinc-600">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Cifra grande con su explicación; `foot` lleva la muestra o la comparación. */
export function Stat({ label, value, foot, hint }: { label: string; value: string; foot?: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 print:border-zinc-300 print:bg-white" title={hint}>
      <p className="text-xs font-semibold text-zinc-400 print:text-zinc-600">{label}</p>
      <p className="mt-1 text-3xl sm:text-4xl font-black text-white tabular-nums print:text-black">{value}</p>
      {foot && <div className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{foot}</div>}
    </div>
  );
}

/** Barra horizontal simple: etiqueta, barra y valor. */
export function Bar({ label, value, max, display, color = "#94a3b8", note }: { label: React.ReactNode; value: number; max: number; display: string; color?: string; note?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 py-1 group" title={note}>
      <span className="text-sm text-zinc-300 truncate print:text-zinc-800">{label}</span>
      <div className="relative h-3.5 rounded bg-white/[0.05] print:bg-zinc-100">
        <div
          className="absolute inset-y-0 left-0 rounded group-hover:brightness-125 transition"
          style={{ width: `max(${max ? (value / max) * 100 : 0}%, ${value ? "3px" : "0px"})`, background: color }}
        />
      </div>
      <span className="text-sm text-zinc-200 tabular-nums text-right print:text-zinc-800">{display}</span>
    </div>
  );
}

export function Swatch({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />;
}

export function Chip({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "red" | "amber" }) {
  const tones = {
    zinc: "border-white/10 text-zinc-400",
    red: "border-red-500/40 text-red-300",
    amber: "border-amber-500/40 text-amber-300",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}
