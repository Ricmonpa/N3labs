"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`inline-flex items-center rounded-lg border border-white/10 overflow-hidden text-xs font-semibold ${className}`}>
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1.5 uppercase transition-colors ${
            lang === l ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Nav() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="/">
          <Image src="/n3-logo.png" alt="N3 Thinktech IA Laboratory" width={160} height={63} priority />
        </a>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8">
          {t.nav.links.map((l) => (
            <a
              key={l.href}
              href={`/${l.href}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/prompter"
            className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            {t.prompter.navLabel}
          </a>
        </nav>

        {/* CTA + lang */}
        <div className="hidden md:flex items-center gap-4">
          <LangToggle />
          <a
            href="/#contacto"
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all duration-200 shadow-lg shadow-red-900/30"
          >
            {t.nav.cta}
          </a>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-3">
          <LangToggle />
          <button
            className="text-slate-400 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {t.nav.links.map((l) => (
                <a
                  key={l.href}
                  href={`/${l.href}`}
                  onClick={() => setOpen(false)}
                  className="text-slate-300 font-medium text-base"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="/prompter"
                onClick={() => setOpen(false)}
                className="text-red-400 font-semibold text-base flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                {t.prompter.navLabel}
              </a>
              <a
                href="/#contacto"
                onClick={() => setOpen(false)}
                className="mt-2 text-sm font-semibold px-5 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white text-center"
              >
                {t.nav.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
