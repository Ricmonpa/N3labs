"use client";

import { LogOut } from "lucide-react";
import { api } from "./api";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await api("/api/panel/logout", { body: {} }).catch(() => {});
        window.location.assign("/panel");
      }}
      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
    >
      <LogOut size={14} /> Salir
    </button>
  );
}
