"use client";

import { motion } from "framer-motion";
import { Search, Compass, Wrench, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Diagnóstico",
    desc: "Entendemos tu negocio en profundidad: procesos, datos disponibles, restricciones técnicas y oportunidades donde la IA genera mayor retorno.",
    duration: "1–2 semanas",
  },
  {
    number: "02",
    icon: Compass,
    title: "Diseño de solución",
    desc: "Definimos la arquitectura, el stack tecnológico y los KPIs de éxito. Sin promesas vacías: solo lo que es técnicamente viable y económicamente justificado.",
    duration: "1 semana",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Construcción",
    desc: "Desarrollo iterativo con entregas parciales. El cliente ve avances reales cada semana, no solo al final. Código de producción desde el día uno.",
    duration: "4–12 semanas",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Despliegue & Evolución",
    desc: "Lanzamiento, monitoreo y optimización continua. Los sistemas de IA mejoran con el tiempo — nos aseguramos de que el tuyo lo haga.",
    duration: "Continuo",
  },
];

export default function Process() {
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
            Proceso
          </span>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white leading-tight mb-4">
            Cómo trabajamos
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto font-light">
            Un proceso estructurado que reduce riesgo y maximiza la probabilidad de éxito del proyecto.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-red-600/30 via-slate-500/20 to-red-600/30" />

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 w-16 h-16 rounded-2xl glass border border-white/10 flex items-center justify-center mb-5 glow-red">
                  <Icon size={22} className="text-red-500" />
                  <span className="absolute -top-2 -right-2 text-[9px] font-black text-red-400 bg-[#06060c] px-1.5 py-0.5 rounded-full border border-red-500/30">
                    {s.number}
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
