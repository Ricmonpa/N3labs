"use client";

import { useLanguage } from "@/context/LanguageContext";
import { geoServices, waLink } from "@/lib/geoServices";

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function GeoServicesView() {
  const { lang } = useLanguage();
  const g = geoServices[lang];

  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-red-400 mb-3">{g.eyebrow}</p>
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{g.title}</h1>
      <p className="text-zinc-400 max-w-2xl mb-14">{g.lead}</p>

      {/* Tabla de ponderación */}
      <section aria-labelledby="pesos" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 mb-16">
        <h2 id="pesos" className="text-2xl md:text-3xl font-bold text-white mb-2">
          {g.weightsTitle}
        </h2>
        <p className="text-zinc-400 text-sm mb-8">{g.weightsSub}</p>
        <ul className="divide-y divide-white/10">
          {g.weights.map((w) => (
            <li key={w.title} className="py-5 grid grid-cols-[4.5rem_1fr] md:grid-cols-[6rem_1fr] gap-4 md:gap-6 items-start">
              <p className="text-4xl md:text-5xl font-light text-white leading-none">
                {w.pct}
                <span className="text-xl md:text-2xl text-red-400">%</span>
              </p>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white">{w.title}</h3>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden" role="presentation">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${w.pct * 2.5}%` }} />
                </div>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{w.desc}</p>
                {w.tags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {w.tags.map((t) => (
                      <span key={t} className="rounded-full border border-red-500/50 px-3 py-1 text-xs text-red-300">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-end justify-between gap-3 text-xs text-zinc-500">
          <p>
            <span className="block text-base font-semibold text-white">{g.weightsFoot[0]}</span>
            {g.weightsFoot[1]}
          </p>
          <p className="text-left md:text-right">
            {g.weightsModel}
            <br />
            n3labs.potenttial.site
          </p>
        </div>
      </section>

      {/* Servicios */}
      <section aria-labelledby="servicios">
        <h2 id="servicios" className="text-2xl md:text-4xl font-bold text-white mb-2">
          {g.servicesTitle}
        </h2>
        <p className="text-zinc-400 mb-8">{g.servicesLead}</p>
        <ol className="space-y-4">
          {g.services.map((s) => (
            <li key={s.id} className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/[0.07] to-transparent p-5 md:p-6 flex gap-4 md:gap-5">
              <span className="shrink-0 h-9 w-9 rounded-full bg-red-600 text-white font-bold flex items-center justify-center uppercase" aria-hidden="true">
                {s.id}
              </span>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm md:text-[15px] text-zinc-300 leading-relaxed">{s.desc}</p>
                {s.ctas && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {s.ctas.map((c, i) => (
                      <a
                        key={c.href}
                        href={c.href}
                        {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={
                          i === 0
                            ? "rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-500 hover:to-red-400 transition-colors"
                            : "rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/[0.06] transition-colors"
                        }
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA WhatsApp */}
      <section className="mt-14 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/[0.07] p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-white">{g.ctaTitle}</h2>
        <p className="mt-2 text-zinc-300 text-sm md:text-base">{g.ctaSub}</p>
        <a
          href={waLink(g.ctaMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#03230f] hover:bg-[#1ebe5a] transition-colors"
        >
          <WaIcon />
          {g.ctaBtn}
        </a>
      </section>
    </div>
  );
}
