"use client";

import { motion } from "framer-motion";
import { MousePointerClick, Wrench, Settings, ArrowUpRight } from "lucide-react";

const services = [
  {
    icon: MousePointerClick,
    accent: "red",
    tag: "ADTECH",
    title: "Banners Interactivos",
    desc: "Creatividades con el efecto \"Wow\". Banners HTML5 potenciados por chatbots de IA, navegación de video y experiencias inmersivas para marcas como Universal Pictures, Dove, Liverpool e Intelisis.",
    features: ["Chatbots de IA embebidos", "Navegación de video dinámica", "Experiencias inmersivas", "Incremento radical de Dwell Time"],
  },
  {
    icon: Wrench,
    accent: "steel",
    tag: "ENGAGEMENT",
    title: "Herramientas de Valor de Marca",
    desc: "Utilidades deep-tech que resuelven problemas del usuario mientras construyen lealtad de marca. Desde calculadoras diagnósticas hasta herramientas de traducción.",
    features: ["Calculadoras diagnósticas", "Análisis de visión por IA", "Resolución de problemas del usuario", "Generación de lealtad de marca"],
  },
  {
    icon: Settings,
    accent: "red",
    tag: "INTEGRACIÓN",
    title: "Integración de IA Web",
    desc: "Embebemos inteligencia en sitios corporativos. Transformamos webs pasivas en agentes de ventas activos y centros de soporte dinámico.",
    features: ["Asistentes de ventas inteligentes", "Agentes de soporte al cliente", "Generación de contenido dinámico", "Ecosistemas web conversacionales"],
  },
];

const accentMap = {
  red: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    tagColor: "text-red-400 bg-red-500/10 border-red-500/20",
    borderHover: "hover:border-red-500/25",
    glow: "hover:shadow-red-950/30",
  },
  steel: {
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-400",
    tagColor: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    borderHover: "hover:border-slate-500/25",
    glow: "hover:shadow-slate-950/20",
  },
};

export default function Services() {
  return (
    <section id="servicios" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-4 block">
            Servicios
          </span>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white leading-tight mb-4">
            Lo que construimos
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light">
            Cada proyecto es diseñado a medida. Sin soluciones genéricas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const a = accentMap[s.accent as keyof typeof accentMap];
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`glass glass-hover rounded-2xl p-7 flex flex-col gap-5 group border border-white/[0.06] hover:shadow-2xl ${a.borderHover} ${a.glow} transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl ${a.iconBg} flex items-center justify-center`}>
                    <Icon size={20} className={a.iconColor} />
                  </div>
                  <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border ${a.tagColor}`}>
                    {s.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-bold text-xl mb-2 leading-tight">{s.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">{s.desc}</p>
                </div>

                <ul className="mt-auto space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <div className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <a href="#contacto" className="text-xs font-semibold text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
                    Saber más <ArrowUpRight size={12} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
