import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { ARTICLES, formatDate } from "@/lib/news";
import { pageMetadata } from "@/lib/site";
import NewsShell from "./shell";

export const metadata = pageMetadata({
  title: "Noticias · N3 Thinktech IA Laboratory",
  description: "Reportes y rankings del laboratorio: qué marcas pueden leer y recomendar las inteligencias artificiales.",
  path: "/noticias",
});

export default function NewsIndex() {
  const articles = [...ARTICLES].sort((a, b) => b.published.localeCompare(a.published));
  return (
    <NewsShell>
      <section className="relative px-6 pt-32 pb-24 grid-bg">
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium mb-5">
            <Newspaper size={12} className="text-red-500" />
            Noticias
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black text-white leading-tight">Lo que medimos en el laboratorio</h1>
          <p className="mt-4 text-zinc-400 text-base font-light leading-relaxed max-w-2xl">
            Reportes y rankings de N3 sobre cómo las inteligencias artificiales leen y recomiendan a las marcas. Cada cifra trae su método y se puede auditar.
          </p>

          <div className="mt-10 space-y-4">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/noticias/${a.slug}`}
                className="group block glass rounded-2xl p-6 sm:p-8 border border-white/[0.06] hover:border-red-500/40 transition-colors"
              >
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-red-400">{a.kicker}</p>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white text-balance">{a.title}</h2>
                <p className="mt-2 text-zinc-400 text-sm leading-relaxed">{a.dek}</p>
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>{a.author}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={a.published}>{formatDate(a.published)}</time>
                  <span className="ml-auto inline-flex items-center gap-1 text-red-400 group-hover:text-red-300">
                    Leer <ArrowRight size={13} />
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </NewsShell>
  );
}
