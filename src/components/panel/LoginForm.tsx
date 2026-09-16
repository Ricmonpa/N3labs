"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { api, inputClass, labelClass, primaryButton } from "./api";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/panel/login", { body: { email, password } });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-lg">
        <Lock size={18} className="text-red-500" /> Panel GEO
      </div>
      <p className="text-sm text-zinc-400">Acceso para el equipo de N3.</p>
      <div>
        <label htmlFor="email" className={labelClass}>Correo</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Contraseña</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </div>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
        {busy && <Loader2 size={16} className="animate-spin" />} Entrar
      </button>
    </form>
  );
}
