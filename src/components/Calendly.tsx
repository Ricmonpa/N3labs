"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const partners = [
  {
    id: "ricardo",
    name: "Ricardo Moncada",
    role: "Co-fundador",
    url: "https://calendly.com/rmmoncada5/new-meeting",
  },
  {
    id: "engel",
    name: "Engel Fonseca",
    role: "Co-fundador",
    url: "https://calendly.com/engelfonseca/25min",
  },
];

// Theme the embed to match the site (hex without the #)
const themeParams =
  "?hide_gdpr_banner=1&background_color=0d0d14&text_color=f1f5f9&primary_color=dc2626";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

export default function Calendly() {
  const [active, setActive] = useState(partners[0]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the Calendly script once
  useEffect(() => {
    if (window.Calendly) {
      setLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="assets.calendly.com/assets/external/widget.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.onload = () => setLoaded(true);
    document.body.appendChild(s);
  }, []);

  // (Re)initialize the inline widget when script is ready or partner changes
  useEffect(() => {
    if (!loaded || !containerRef.current || !window.Calendly) return;
    containerRef.current.innerHTML = "";
    window.Calendly.initInlineWidget({
      url: active.url + themeParams,
      parentElement: containerRef.current,
    });
  }, [loaded, active]);

  return (
    <div className="mt-12">
      {/* Partner selector */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4 mb-8"
      >
        <p className="text-sm text-zinc-500 font-medium">Elige con quién quieres reunirte:</p>
        <div className="inline-flex p-1 rounded-xl glass border border-white/[0.08] gap-1">
          {partners.map((p) => {
            const isActive = p.id === active.id;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-950/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {p.name}
                <span className={`block text-[10px] font-normal ${isActive ? "text-red-100" : "text-zinc-600"}`}>
                  {p.role}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Embedded calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl overflow-hidden glass border border-white/[0.08]"
      >
        <div ref={containerRef} style={{ minWidth: "320px", height: "700px" }}>
          {!loaded && (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              Cargando calendario…
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
