"use client";

import { useMemo, useRef, useState } from "react";
import type { Rate } from "@/lib/geo-visibility/report.ts";
import { ENGINE_LABEL } from "@/lib/geo-visibility/report.ts";
import type { EngineId } from "@/lib/geo-visibility/types.ts";
import type { TrendPoint } from "@/lib/panel/store";
import { pct, range } from "./report-ui";

// Marca + hasta 2 competidores: los tres colores pasan la revisión de daltonismo en todos los pares
// (con etiqueta directa al final de cada línea). Más series se vuelven ilegibles.
const BRAND_COLOR = "#e66767";
const SLOTS = ["#3987e5", "#199e70"];

const W = 760;
const H = 280;
const PAD = { top: 16, right: 120, bottom: 30, left: 40 };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

type Series = { name: string; color: string; brand: boolean; values: (Rate | null)[] };

/** Visibilidad de la marca medición tras medición, con su rango probable y hasta dos competidores. */
export default function TrendChart({ points, brand }: { points: TrendPoint[]; brand: string }) {
  const engines = useMemo(() => [...new Set(points.flatMap((p) => p.engines))] as EngineId[], [points]);
  const [engine, setEngine] = useState<EngineId | "all">("all");
  const latest = points[points.length - 1];
  const competitors = latest ? latest.brands.slice(1).map((b) => b.name) : [];
  const [picked, setPicked] = useState<{ name: string; slot: number }[]>(() =>
    latest
      ? [...latest.brands.slice(1)]
          .sort((a, b) => b.rate.rate - a.rate.rate)
          .slice(0, 2)
          .map((b, i) => ({ name: b.name, slot: i }))
      : [],
  );
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const valueOf = (p: TrendPoint, name: string | null): Rate | null => {
    const b = name === null ? null : p.brands.find((x) => x.name === name);
    if (engine === "all") return name === null ? p.mention : (b?.rate ?? null);
    const r = name === null ? p.byEngine[engine] : b?.perEngine[engine];
    return r?.n ? r : null;
  };

  const series: Series[] = [
    { name: brand, color: BRAND_COLOR, brand: true, values: points.map((p) => valueOf(p, null)) },
    ...picked.map((c) => ({ name: c.name, color: SLOTS[c.slot], brand: false, values: points.map((p) => valueOf(p, c.name)) })),
  ];

  const t0 = points.length ? new Date(points[0].at).getTime() : 0;
  const t1 = points.length ? new Date(points[points.length - 1].at).getTime() : 1;
  const x = (i: number) => {
    const span = t1 - t0;
    const f = span > 0 ? (new Date(points[i].at).getTime() - t0) / span : points.length > 1 ? i / (points.length - 1) : 0.5;
    return PAD.left + f * (W - PAD.left - PAD.right);
  };
  const y = (v: number) => PAD.top + (1 - v) * (H - PAD.top - PAD.bottom);

  /** Tramos de puntos seguidos con dato; una medición sin ese motor corta la línea. */
  const segments = (values: (Rate | null)[]) => {
    const out: number[][] = [];
    let cur: number[] = [];
    values.forEach((v, i) => {
      if (v) cur.push(i);
      else if (cur.length) {
        out.push(cur);
        cur = [];
      }
    });
    if (cur.length) out.push(cur);
    return out;
  };

  function toggle(name: string) {
    setPicked((p) => {
      if (p.some((c) => c.name === name)) return p.filter((c) => c.name !== name);
      if (p.length >= SLOTS.length) return p;
      const used = new Set(p.map((c) => c.slot));
      return [...p, { name, slot: SLOTS.findIndex((_, i) => !used.has(i)) }];
    });
  }

  function onMove(ev: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || !points.length) return;
    const box = svg.getBoundingClientRect();
    const px = ((ev.clientX - box.left) / box.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  }

  if (points.length === 0) return null;

  const labels = series
    .map((s) => {
      const last = s.values.map((v, i) => (v ? i : -1)).filter((i) => i >= 0).pop();
      return last === undefined ? null : { s, i: last, y: y(s.values[last]!.rate) };
    })
    .filter((l): l is { s: Series; i: number; y: number } => !!l)
    .sort((a, b) => a.y - b.y);
  // Separa las etiquetas que caerían encimadas.
  for (let k = 1; k < labels.length; k++) labels[k].y = Math.max(labels[k].y, labels[k - 1].y + 15);

  const h = hover !== null ? points[hover] : null;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-7">
      <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-500 mb-1.5">Tendencia</p>
      <h2 className="text-lg sm:text-xl font-bold text-white">Visibilidad medición tras medición</h2>
      <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed max-w-3xl">
        Respuestas que mencionan a {brand} en preguntas que no la nombran. La banda es el rango probable: si la banda de una medición se cruza con la de otra, el cambio puede ser ruido.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["all", ...engines] as const).map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={engine === e}
            onClick={() => setEngine(e)}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${engine === e ? "border-red-500/60 bg-red-500/15 text-white" : "border-white/10 text-zinc-400 hover:text-white"}`}
          >
            {e === "all" ? "Todas las IAs" : ENGINE_LABEL[e]}
          </button>
        ))}
        {competitors.length > 0 && <span className="mx-1 h-4 w-px bg-white/10" />}
        {competitors.map((name) => {
          const on = picked.find((c) => c.name === name);
          const full = !on && picked.length >= SLOTS.length;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={!!on}
              disabled={full}
              onClick={() => toggle(name)}
              title={full ? "Máximo dos competidores a la vez" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors disabled:opacity-40 ${on ? "border-white/30 text-white" : "border-white/10 text-zinc-500 hover:text-white"}`}
            >
              {on && <span className="inline-block h-2 w-2 rounded-full" style={{ background: SLOTS[on.slot] }} />}
              {name}
            </button>
          );
        })}
      </div>

      {points.length < 2 ? (
        <p className="mt-5 text-sm text-zinc-400">
          Hay una sola medición ({fmtDate(points[0].at)}: {pct(points[0].mention.rate)}, rango {range(points[0].mention)}). La línea aparece desde la segunda; con el seguimiento automático se llena sola.
        </p>
      ) : (
        <div className="relative mt-5">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Visibilidad de ${brand} en ${points.length} mediciones`}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
                <text x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-zinc-500 text-[11px]">
                  {Math.round(v * 100)}%
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              points.length <= 8 || i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? (
                <text key={p.id} x={x(i)} y={H - 8} textAnchor="middle" className="fill-zinc-500 text-[11px]">
                  {fmtDate(p.at)}
                </text>
              ) : null,
            )}

            {segments(series[0].values).map((seg) => (
              <polygon
                key={`band-${seg[0]}`}
                fill={BRAND_COLOR}
                fillOpacity={0.14}
                points={[
                  ...seg.map((i) => `${x(i)},${y(series[0].values[i]!.high)}`),
                  ...[...seg].reverse().map((i) => `${x(i)},${y(series[0].values[i]!.low)}`),
                ].join(" ")}
              />
            ))}

            {[...series].reverse().map((s) =>
              segments(s.values).map((seg) => (
                <g key={`${s.name}-${seg[0]}`}>
                  <polyline
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={seg.map((i) => `${x(i)},${y(s.values[i]!.rate)}`).join(" ")}
                  />
                  {seg.map((i) => (
                    <circle key={i} cx={x(i)} cy={y(s.values[i]!.rate)} r={s.brand ? 4.5 : 3.5} fill={s.color} stroke="#0b0b11" strokeWidth={2} />
                  ))}
                </g>
              )),
            )}

            {labels.map((l) => (
              <text key={l.s.name} x={W - PAD.right + 10} y={l.y} dominantBaseline="middle" className={`text-[12px] ${l.s.brand ? "fill-white font-semibold" : "fill-zinc-300"}`}>
                {l.s.name.length > 14 ? `${l.s.name.slice(0, 13)}…` : l.s.name} {pct(l.s.values[l.i]!.rate)}
              </text>
            ))}

            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />}
            <rect
              x={PAD.left}
              y={0}
              width={W - PAD.left - PAD.right}
              height={H}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>

          {h && hover !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 w-60 rounded-xl border border-white/10 bg-[#0b0b11]/95 p-3 text-xs shadow-xl"
              style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 7.5rem), calc(100% - 15rem))` }}
            >
              <p className="font-semibold text-white">{new Date(h.at).toLocaleDateString("es-MX", { dateStyle: "long" })}</p>
              <p className="text-zinc-500">
                {h.engines.map((e) => ENGINE_LABEL[e]).join(", ")} · {h.answers} respuestas
              </p>
              <ul className="mt-2 space-y-1">
                {series.map((s) => {
                  const v = s.values[hover];
                  return (
                    <li key={s.name} className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="flex-1 truncate text-zinc-300">{s.name}</span>
                      <span className="tabular-nums text-white">{v ? pct(v.rate) : "—"}</span>
                      <span className="tabular-nums text-zinc-500 w-16 text-right">{v ? range(v) : ""}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <details className="mt-4 group">
        <summary className="cursor-pointer list-none text-xs text-zinc-500 hover:text-white">Ver como tabla</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="py-1.5 pr-3 font-medium">Fecha</th>
                <th className="py-1.5 pr-3 font-medium">IAs</th>
                {series.map((s) => (
                  <th key={s.name} className="py-1.5 pr-3 font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.id} className="border-t border-white/[0.06]">
                  <td className="py-1.5 pr-3 text-zinc-300 whitespace-nowrap">{fmtDate(p.at)}</td>
                  <td className="py-1.5 pr-3 text-zinc-500 text-xs">{p.engines.map((e) => ENGINE_LABEL[e]).join(", ")}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-1.5 pr-3 tabular-nums text-zinc-200 whitespace-nowrap">
                      {s.values[i] ? `${pct(s.values[i]!.rate)} (${range(s.values[i]!)})` : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
