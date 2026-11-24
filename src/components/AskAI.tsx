"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * "Ask AI about us": opens each assistant with the N3 Labs question already written.
 * ChatGPT, Claude, Perplexity and Copilot accept the question in the URL.
 * Gemini has no public URL parameter, so the question is copied to the clipboard
 * and Gemini opens ready for the visitor to paste it.
 */

type Bot = { name: string; domain: string; url: (q: string) => string; paste?: boolean };

const BOTS: Bot[] = [
  { name: "ChatGPT", domain: "chatgpt.com", url: (q) => `https://chatgpt.com/?q=${q}` },
  { name: "Claude", domain: "claude.ai", url: (q) => `https://claude.ai/new?q=${q}` },
  { name: "Perplexity", domain: "perplexity.ai", url: (q) => `https://www.perplexity.ai/search?q=${q}` },
  { name: "Gemini", domain: "gemini.google.com", url: () => "https://gemini.google.com/app", paste: true },
  { name: "Copilot", domain: "copilot.microsoft.com", url: (q) => `https://copilot.microsoft.com/?q=${q}` },
];

export default function AskAI() {
  const { t } = useLanguage();
  const a = t.askAi;
  const [toast, setToast] = useState<string | null>(null);
  const q = encodeURIComponent(a.prompt);

  const copy = (bot: Bot) => {
    try {
      void navigator.clipboard?.writeText(a.prompt);
    } catch {
      /* clipboard unavailable: the question is still in the URL for every bot except Gemini */
    }
    if (bot.paste) {
      setToast(a.pasted);
      window.setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <section aria-labelledby="ask-ai-title" className="px-6 pt-16 pb-6">
      <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center gap-8">
        <div className="md:flex-1 min-w-0">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-red-500 block mb-3">{a.label}</span>
          <h2 id="ask-ai-title" className="text-2xl md:text-3xl font-light text-white leading-tight mb-3">
            {a.title}
          </h2>
          <p className="text-zinc-400 text-sm font-light">
            {a.lead} <span className="text-zinc-200">“{a.prompt}”</span>
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 md:gap-4" role="list">
          {BOTS.map((bot) => (
            <li key={bot.name}>
              <a
                href={bot.url(q)}
                target="_blank"
                rel="noopener"
                onClick={() => copy(bot)}
                aria-label={`${a.ask} ${bot.name}`}
                className="group flex flex-col items-center gap-2 w-[64px] focus-visible:outline-none"
              >
                <span className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-white shadow-sm transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-red-500">
                  {/* Initial shows underneath until the service's own icon loads (or if it can't load) */}
                  <span aria-hidden="true" className="absolute text-lg font-semibold text-zinc-800">{bot.name[0]}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${bot.domain}&sz=64`}
                    alt=""
                    width={30}
                    height={30}
                    loading="lazy"
                    className="relative bg-white"
                    onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                  />
                </span>
                <span className="text-[11px] text-zinc-400 group-hover:text-white transition-colors">{bot.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p role="status" aria-live="polite" className={`max-w-5xl mx-auto mt-3 text-center text-xs text-emerald-400 transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}>
        {toast ?? ""}
      </p>
    </section>
  );
}
