"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { api } from "./api";

export default function DeleteStudyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Borrar ${name}`}
      title="Borrar estudio"
      disabled={busy}
      onClick={async () => {
        if (!confirm(`¿Borrar "${name}" y todas sus mediciones? No se puede deshacer.`)) return;
        setBusy(true);
        try {
          await api(`/api/panel/studies/${id}`, { method: "DELETE" });
          router.refresh();
        } catch (err) {
          alert((err as Error).message);
          setBusy(false);
        }
      }}
      className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-red-400 transition-colors"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}
