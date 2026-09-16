import { authConfigured, getSession } from "@/lib/panel/auth";
import { dbConfigured } from "@/lib/panel/db";
import LoginForm from "./LoginForm";

function Setup({ missing }: { missing: string[] }) {
  return (
    <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <h1 className="text-lg font-bold text-white">Falta configurar el panel</h1>
      <p className="mt-2 text-sm text-zinc-300">Agrega estas variables en Vercel (Settings → Environment Variables) y vuelve a desplegar:</p>
      <ul className="mt-3 space-y-1 text-sm font-mono text-amber-200">
        {missing.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Renders the login or setup screen when the visitor can't use the panel yet; otherwise the children.
 * Every panel page goes through this, so data is never rendered without a valid session.
 */
export default async function Gate({ children }: { children: React.ReactNode }) {
  const missing = [
    ...(authConfigured() ? [] : ["PANEL_EMAILS (correos separados por coma)", "PANEL_PASSWORD (mínimo 12 caracteres)"]),
    ...(dbConfigured() ? [] : ["DATABASE_URL (conecta Neon desde Vercel → Storage)"]),
  ];
  if (missing.length) return <Setup missing={missing} />;
  if (!(await getSession())) return <LoginForm />;
  return <>{children}</>;
}
