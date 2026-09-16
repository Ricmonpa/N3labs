import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/panel/LogoutButton";
import { getSession } from "@/lib/panel/auth";

export const metadata: Metadata = {
  title: "Panel GEO · N3",
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-[#06060c] print:bg-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#06060c]/90 backdrop-blur print:hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/panel" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline text-xs font-semibold tracking-[0.18em] uppercase text-red-500">Panel GEO</span>
          </Link>
          {session && (
            <div className="ml-auto flex items-center gap-4">
              <span className="hidden sm:inline text-xs text-zinc-500">{session.email}</span>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 print:p-0 print:max-w-none">{children}</main>
    </div>
  );
}
