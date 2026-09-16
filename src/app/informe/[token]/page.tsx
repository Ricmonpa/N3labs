import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import ReportView from "@/components/panel/ReportView";
import PrintButton from "@/components/panel/PrintButton";
import { getRunByToken } from "@/lib/panel/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informe de visibilidad en IA · N3",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedReport({ params }: PageProps<"/informe/[token]">) {
  const { token } = await params;
  const run = await getRunByToken(token).catch(() => null);
  if (!run?.report?.responses.ok) notFound();

  return (
    <div className="min-h-screen bg-[#06060c] print:bg-white">
      <header className="border-b border-white/[0.06] print:border-zinc-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <PrintButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <ReportView report={run.report} audience="client" />
        <p className="mt-8 text-center text-xs text-zinc-500 print:hidden">
          Preparado por N3 Thinktech IA Laboratory ·{" "}
          <Link href="/#contacto" className="text-red-400 hover:text-red-300">
            Hablar con el equipo
          </Link>
        </p>
      </main>
    </div>
  );
}
