"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MessageSquareHeart, ScanFace, ShoppingBag, Mic, PawPrint, GraduationCap, Target, Globe, ScanLine } from "lucide-react";

const artifacts = [
  {
    icon: MessageSquareHeart,
    category: "Entretenimiento",
    title: "Banner Conversacional \"AdChat\"",
    desc: "Para \"Five Nights at Freddy's 2\" (Universal Pictures), creamos un banner donde los fans \"chateaban\" directamente con los personajes dentro del espacio publicitario.",
    tags: ["AdChat", "Character AI", "Entretenimiento"],
    metric: "+300% tiempo de retención vs display estático",
    color: "red",
  },
  {
    icon: ScanFace,
    category: "Retail",
    title: "Banner Diagnóstico con IA",
    desc: "Banner para Dove que utiliza Google Gemini para escanear la piel del usuario en tiempo real, ofreciendo resultados y recomendaciones de productos.",
    tags: ["Computer Vision", "Gemini", "Retail"],
    metric: "15-30 segundos de interacción",
    color: "steel",
  },
  {
    icon: ShoppingBag,
    category: "eCommerce",
    title: "Asistente de Compras Conversacional",
    desc: "Coach de IA para Liverpool que pregunta sobre metas de ciclismo y terreno, ofreciendo recomendaciones precisas del inventario sobre fondos de video dinámico.",
    tags: ["Asistente de Ventas", "Recomendación", "eCommerce"],
    metric: "+400% tiempo de retención",
    color: "red",
  },
  {
    icon: Mic,
    category: "Retail",
    title: "Experiencia de Voz con IA",
    desc: "Campaña navideña para Sanborns. Los niños dictan sus deseos al banner por voz, la IA lo transcribe y sugiere regalos del catálogo.",
    tags: ["Voice Recognition", "NLP", "Catálogo"],
    metric: "Interacción de alto valor emocional",
    color: "steel",
  },
  {
    icon: PawPrint,
    category: "FMCG",
    title: "Asistente de Salud para Mascotas",
    desc: "Diagnóstico inteligente que analiza raza, peso y actividad del perro para crear planes de alimentación personalizados sugiriendo productos Pedigree.",
    tags: ["Smart Diagnostics", "Profiling", "FMCG"],
    metric: "10x más tiempo de permanencia",
    color: "red",
  },
  {
    icon: GraduationCap,
    category: "EdTech",
    title: "Co-Piloto de Aprendizaje Adaptativo",
    desc: "Asistente para RichmondPro que permite a los estudiantes practicar inglés en tiempo real. Integra modelos múltiples y RAG con el currículo oficial.",
    tags: ["RAG", "Multi-LLM", "EdTech"],
    metric: "Práctica conversacional en tiempo real",
    color: "steel",
  },
  {
    icon: Target,
    category: "Agentic AI",
    title: "Radar Comparador de Precios",
    desc: "Para Avante Llantas: agente autónomo que monitorea precios de competidores en tiempo real, detecta variaciones y genera alertas y recomendaciones de ajuste automáticamente.",
    tags: ["Workflow IA", "Agentic", "Retail"],
    metric: "Monitoreo competitivo en tiempo real",
    color: "red",
  },
  {
    icon: Globe,
    category: "Agentic AI",
    title: "Scraper de Oferta y Demanda",
    desc: "Para Carnovo: agente que rastrea publicaciones de compra-venta de vehículos en Facebook Marketplace, analiza tendencias de mercado y genera reportes de inteligencia comercial.",
    tags: ["Web Scraping", "Facebook", "Automotriz"],
    metric: "Inteligencia de mercado automatizada",
    color: "steel",
  },
  {
    icon: ScanLine,
    category: "Agentic AI",
    title: "Scanner de Salud de Neumáticos",
    desc: "Para Avante Llantas: visión computacional que analiza el desgaste de las llantas, evalúa su estado, estima vida útil restante y programa recordatorios automáticos de cambio.",
    tags: ["Computer Vision", "Agentic", "Automotriz"],
    metric: "Diagnóstico preventivo automatizado",
    color: "red",
  },
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
            Artefactos & Soluciones
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white leading-tight max-w-xl">
              Sistemas que ya
              <br />
              <span className="gradient-text">están en producción</span>
            </h2>
            <p className="text-zinc-400 text-base max-w-sm font-light leading-relaxed">
              Una muestra de soluciones reales entregadas. Cada caso resuelve
              un problema de negocio concreto con resultados medibles.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {artifacts.map((a, i) => {
            const c = colorMap[a.color as keyof typeof colorMap];
            const Icon = a.icon;
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
