"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      {/* Ambient orbs — rojo del logo */}
      <div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none animate-pulse-glow"
        style={{ background: "rgba(220, 38, 38, 0.08)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none animate-pulse-glow"
        style={{ background: "rgba(100, 116, 139, 0.07)", animationDelay: "1.5s" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-16">
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-medium tracking-wide mb-8"
        >
          <Sparkles size={12} className="text-red-500" />
          Laboratorio de Inteligencia Artificial
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1.04] tracking-tight mb-6"
        >
          <span className="text-white">Transformamos </span>
          <span className="gradient-text">decisiones complejas</span>
          <br />
          <span className="text-white">en inteligencia </span>
          <span className="text-zinc-500">que escala.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-light"
        >
          Diseñamos e implementamos sistemas de IA de nivel enterprise —
          agentes autónomos, software inteligente y estrategia de transformación
          para organizaciones que exigen resultados medibles.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a
            href="#contacto"
            className="group flex items-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold text-sm shadow-xl shadow-red-950/50 hover:from-red-600 hover:to-red-500 transition-all duration-300"
          >
            Hablar con un experto
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#soluciones"
            className="flex items-center gap-2 px-7 py-4 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all duration-200 bg-white/[0.03]"
          >
            Ver soluciones entregadas
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-20 grid grid-cols-3 gap-4 max-w-xl mx-auto"
        >
          {[
            { value: "2000+", label: "Proyectos IA" },
            { value: "98%", label: "Satisfacción" },
            { value: "12×", label: "ROI promedio" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#06060c] to-transparent pointer-events-none" />
    </section>
  );
}
