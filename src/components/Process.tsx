"use client";

import { motion } from "framer-motion";
import { Search, Compass, Wrench, Rocket } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const icons = [Search, Compass, Wrench, Rocket];
const numbers = ["01", "02", "03", "04"];

export default function Process() {
  const { t } = useLanguage();
  const p = t.process;
  return (
    <section id="proceso" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-4 block">
            {p.label}
          </span>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white leading-tight mb-4">
            {p.title}
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto font-light">
            {p.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-red-600/30 via-slate-500/20 to-red-600/30" />

          {p.steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={numbers[i]}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 w-16 h-16 rounded-2xl glass border border-white/10 flex items-center justify-center mb-5 glow-red">
                  <Icon size={22} className="text-red-500" />
                  <span className="absolute -top-2 -right-2 text-[9px] font-black text-red-400 bg-[#06060c] px-1.5 py-0.5 rounded-full border border-red-500/30">
                    {numbers[i]}
                  </span>
                </div>

                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-light mb-3">{s.desc}</p>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
                  {s.duration}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
