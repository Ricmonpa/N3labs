"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import AskAI from "@/components/AskAI";
import { ArrowUpRight } from "lucide-react";
import { SOCIAL } from "@/lib/site";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <>
    <AskAI />
    <footer className="border-t border-white/[0.05] py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Image src="/n3-logo.png" alt="N3 Thinktech IA Laboratory" width={130} height={51} />

        <p className="text-zinc-700 text-xs text-center">
          © {new Date().getFullYear()} N3 Thinktech IA Laboratory. {t.footer.rights}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {t.footer.links.map((l) => (
            <a
              key={l.href}
              href={`/${l.href}`}
              className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors"
            >
              {l.label}
            </a>
          ))}
          <span className="hidden md:block w-px h-3 bg-white/10" aria-hidden="true" />
          {SOCIAL.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener me"
              aria-label={`N3 Labs ${t.footer.on} ${s.name}`}
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs transition-colors"
            >
              {s.name}
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
    </>
  );
}
