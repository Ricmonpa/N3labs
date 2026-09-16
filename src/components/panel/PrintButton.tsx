"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 hover:border-white/25 text-zinc-200 text-sm px-3.5 py-2 print:hidden"
    >
      <Printer size={14} /> Descargar PDF
    </button>
  );
}
