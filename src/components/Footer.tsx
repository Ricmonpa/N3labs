"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/[0.05] py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Image src="/n3-logo.png" alt="N3 Thinktech IA Laboratory" width={130} height={51} />

        <p className="text-zinc-700 text-xs text-center">
          © {new Date().getFullYear()} N3 Thinktech IA Laboratory. {t.footer.rights}
        </p>

        <div className="flex items-center gap-6">
          {t.footer.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
