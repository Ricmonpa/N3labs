"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MessageSquareHeart, ScanFace, ShoppingBag, Mic, PawPrint, GraduationCap, Target, Globe, ScanLine } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Visual meta stays here; text (category/title/desc/tags/metric) comes from translations by index
const meta = [
  { icon: MessageSquareHeart, color: "red" },
  { icon: ScanFace, color: "steel" },
  { icon: ShoppingBag, color: "red" },
  { icon: Mic, color: "steel" },
  { icon: PawPrint, color: "red" },
  { icon: GraduationCap, color: "steel" },
  { icon: Target, color: "red" },
  { icon: Globe, color: "steel" },
  { icon: ScanLine, color: "red" },
];

const colorMap = {
  red: {
    tag: "text-red-400 bg-red-500/10",
    icon: "text-red-500 bg-red-500/10",
    metric: "text-red-400",
    border: "hover:border-red-500/20",
  },
  steel: {
    tag: "text-slate-400 bg-slate-500/10",
    icon: "text-slate-400 bg-slate-500/10",
    metric: "text-slate-300",
    border: "hover:border-slate-500/20",
  },
};

export default function Artifacts() {
  const { t } = useLanguage();
  const s = t.artifacts;
  return (
    <section id="soluciones" className="py-28 px-6 relative bg-[#09090f]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-4 block">
            {s.label}
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white leading-tight max-w-xl">
              {s.titleA}
              <br />
              <span className="gradient-text">{s.titleB}</span>
            </h2>
            <p className="text-zinc-400 text-base max-w-sm font-light leading-relaxed">
              {s.intro}
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {s.items.map((a, i) => {
            const c = colorMap[meta[i].color as keyof typeof colorMap];
            const Icon = meta[i].icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className={`group glass rounded-2xl p-6 flex flex-col gap-4 border border-white/[0.05] ${c.border} hover:bg-white/[0.02] transition-all duration-300 cursor-default`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${c.tag}`}>
                    {a.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-base leading-snug mb-2">{a.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">{a.desc}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {a.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-zinc-500 font-medium">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                  <span className={`text-sm font-bold ${c.metric}`}>{a.metric}</span>
                  <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-zinc-300 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/15 to-transparent" />
    </section>
  );
}
