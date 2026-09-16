"use client";

const MESSAGES: Record<string, string> = {
  not_configured: "El panel todavía no está configurado en el servidor (base de datos o acceso).",
  unauthorized: "Tu sesión expiró. Vuelve a entrar.",
  forbidden: "Solicitud rechazada.",
  invalid_credentials: "Correo o contraseña incorrectos.",
  rate_limited: "Demasiados intentos. Espera unos minutos.",
  invalid_study: "Revisa el estudio:",
  no_engines: "Elige al menos un motor.",
  invalid_runs: "Las repeticiones deben ser entre 1 y 10.",
  invalid_limit: "El número de preguntas de prueba no es válido.",
  missing_keys: "Faltan llaves de API en el servidor para:",
  too_many_calls: "La corrida excede el límite de llamadas permitido.",
  not_found: "No se encontró.",
  invalid_url: "Escribe un sitio web válido, por ejemplo cliente.com.",
  server_error: "Error del servidor. Intenta de nuevo.",
};

export class ApiError extends Error {
  constructor(
    public code: string,
    public details: Record<string, unknown>,
  ) {
    const extra = Array.isArray(details.problems)
      ? ` ${(details.problems as string[]).join("; ")}.`
      : Array.isArray(details.engines)
        ? ` ${(details.engines as string[]).join(", ")}.`
        : code === "too_many_calls"
          ? ` (${details.calls} de máximo ${details.max}).`
          : "";
    super(`${MESSAGES[code] ?? "Algo salió mal."}${extra}`);
  }
}

export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !url.endsWith("/login")) window.location.assign("/panel");
    throw new ApiError(data.error ?? "server_error", data);
  }
  return data as T;
}

export const inputClass =
  "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60";
export const labelClass = "block text-xs font-semibold text-zinc-400 mb-1.5";
export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2 transition-colors";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 hover:border-white/25 hover:bg-white/[0.04] disabled:opacity-50 text-zinc-200 text-sm px-3.5 py-2 transition-colors";
export const cardClass = "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6";
