"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getAttribution, describeSource } from "./Attribution";

const STORAGE_KEY = "n3-prompter-access";

// Google Apps Script web app that appends each lead to our Sheet.
// Public by design (it only accepts writes); override via env var if it changes.
const ENDPOINT =
  process.env.NEXT_PUBLIC_LEADS_ENDPOINT ??
  "https://script.google.com/macros/s/AKfycbz1dH6uvmicCZs2Im7VIttBfcFsE773xVrX4DWT16yYoXik6Ue3jrdlmxyOPB7odh7m/exec";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadGate({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLanguage();
  const g = t.prompter.gate;

  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY)) setUnlocked(true);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError(g.invalidName);
    if (!emailRe.test(email.trim())) return setError(g.invalidEmail);

    setSubmitting(true);
    const attr = getAttribution();
    const lead = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      lang,
      source: "prompter",
      ts: new Date().toISOString(),
      // Where this visitor originally came from
      origin: describeSource(attr),
      utmSource: attr.utmSource ?? "",
      utmMedium: attr.utmMedium ?? "",
      utmCampaign: attr.utmCampaign ?? "",
      referrer: attr.referrer ?? "",
      landing: attr.landing ?? "",
    };

    // Send to Google Sheet (Apps Script). no-cors → fire-and-forget.
    if (ENDPOINT) {
      try {
        await fetch(ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(lead),
        });
      } catch {
        /* don't block the user if capture fails */
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
    } catch {
      /* ignore */
    }
    setSubmitting(false);
    setUnlocked(true);
  };

  // Avoid a flash of the gate for already-registered users during hydration
  if (!mounted) {
    return <div className="min-h-screen bg-[#06060c]" />;
  }

  if (unlocked) return <>{children}</>;

  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-28 pb-16 relative grid-bg">
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(220, 38, 38, 0.08)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md glass rounded-2xl border border-white/[0.08] p-8"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-medium mb-5">
          <Sparkles size={11} className="text-red-500" />
          {g.badge}
        </span>

        <h1 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
          <Lock size={18} className="text-red-500" />
          {g.title}
        </h1>
        <p className="text-zinc-400 text-sm font-light mb-6">{g.subtitle}</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">{g.nameLabel}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={g.namePlaceholder}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">{g.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={g.emailPlaceholder}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-950/40 hover:from-red-600 hover:to-red-500 transition-all disabled:opacity-60"
          >
            {submitting ? g.submitting : g.submit}
            {!submitting && <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />}
          </button>

          <p className="text-zinc-600 text-[11px] leading-relaxed text-center pt-1">{g.privacy}</p>
        </form>
      </motion.div>
    </section>
  );
}
