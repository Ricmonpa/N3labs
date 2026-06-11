"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Calendar, MessageSquare } from "lucide-react";
import Calendly from "./Calendly";

const options = [
  {
    icon: Calendar,
    title: "Agendar llamada de diagnóstico",
    desc: "30 minutos. Sin compromiso. Evaluamos si tu caso tiene potencial con IA.",
    cta: "Reservar espacio",
    primary: true,
  },
  {
    icon: Mail,
    title: "Enviarnos un brief",
    desc: "Cuéntanos tu problema de negocio y te respondemos con una propuesta inicial en 48h.",
    cta: "Enviar brief",
    primary: false,
  },
  {
    icon: MessageSquare,
    title: "Consulta rápida por WhatsApp",
    desc: "Para preguntas puntuales o explorar si tu caso encaja con lo que hacemos.",
    cta: "Escribir ahora",
    primary: false,
  },
];

export default function Contact() {
  return (
    <section id="contacto" className="py-28 px-6 relative overflow-hidden">
      {/* Ambient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: "rgba(220, 38, 38, 0.05)" }}
      />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 mb-4 block">
            Contacto
          </span>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-black text-white leading-tight mb-4">
            El siguiente paso
            <br />
            <span className="gradient-text">es una conversación.</span>
          </h2>
          <p className="text-zinc-400 text-lg font-light max-w-md mx-auto">
            No necesitas tener todo claro. Nosotros ayudamos a definir el problema
            antes de proponer la solución.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`glass rounded-2xl p-6 flex flex-col gap-4 border transition-all duration-300 ${
                  o.primary
                    ? "border-red-500/25 bg-red-500/[0.04] hover:border-red-500/40"
                    : "border-white/[0.06] hover:border-white/12"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${o.primary ? "bg-red-500/15" : "bg-white/5"}`}>
                  <Icon size={18} className={o.primary ? "text-red-400" : "text-zinc-500"} />
                </div>

                <div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{o.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">{o.desc}</p>
                </div>

                <a
                  href="#"
                  className={`mt-auto flex items-center gap-2 text-sm font-semibold transition-all duration-200 group ${
                    o.primary
                      ? "text-red-400 hover:text-red-300"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {o.cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </motion.div>
            );
          })}
        </div>

        {/* Embedded scheduler — final step of the funnel */}
        <Calendly />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-zinc-700 text-xs mt-10 font-medium"
        >
          Trabajamos con empresas de toda Latinoamérica y España &bull; Proyectos desde $15,000 USD &bull; Confidencialidad garantizada
        </motion.p>
      </div>
    </section>
  );
}
