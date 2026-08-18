"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { linkFisica } from "./FisicaAutolink";

const SHOOT_URL = "https://www.shoot.com.mx/n3";

export default function IAFisica() {
  const { t } = useLanguage();
  const s = t.iafisica;

  return (
    <section id="ia-fisica" className="py-28 px-6 relative overflow-hidden bg-[#09090f]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />
      <div
        className="absolute top-1/2 right-0 w-[500px] h-[400px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: "rgba(100, 116, 139, 0.06)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-4">
              <Activity size={13} />
              {s.label}
            </span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-black text-white leading-tight mb-5">
              {s.title}
            </h2>
            <p className="text-zinc-400 text-lg font-light leading-relaxed mb-4">{linkFisica(s.subtitle)}</p>
            <p className="text-zinc-500 text-base font-light leading-relaxed mb-8">{linkFisica(s.body)}</p>

            <a
              href={SHOOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold text-sm shadow-xl shadow-red-950/40 hover:from-red-600 hover:to-red-500 transition-all duration-300"
            >
              {s.cta}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <p className="text-zinc-600 text-xs mt-4">{s.note}</p>
          </motion.div>

          {/* Right — value points */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass rounded-2xl border border-white/[0.08] p-8 flex flex-col gap-5"
          >
            {s.points.map((point, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Check size={16} className="text-red-400" />
                </div>
                <p className="text-zinc-200 text-base font-medium leading-snug pt-1.5">{point}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Earnings table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <h3 className="text-white font-bold text-xl mb-6 text-center">{s.table.title}</h3>

          <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    {s.table.headers.map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-4 font-semibold text-red-400 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-5 py-3.5 whitespace-nowrap ${
                            ci === 0
                              ? "text-left text-zinc-200 font-medium"
                              : ci === row.length - 1
                                ? "text-center text-red-400 font-semibold"
                                : "text-center text-zinc-400"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-red-500/[0.06] border-t border-red-500/20">
                    {s.table.total.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-5 py-4 font-bold whitespace-nowrap ${
                          ci === 0
                            ? "text-left text-white"
                            : ci === s.table.total.length - 1
                              ? "text-center text-red-300"
                              : "text-center text-zinc-200"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/15 to-transparent" />
    </section>
  );
}
