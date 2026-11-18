import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { EngineId } from "@/lib/geo-visibility/types.ts";

/**
 * Llaves de API que pone el cliente (BYOK), para que sus mediciones las pague su cuenta.
 * Se guardan cifradas (AES-256-GCM) y nunca vuelven al navegador: la página solo ve los
 * últimos cuatro caracteres. Las de un scan público se borran al terminar la medición.
 */

export type ApiKeys = Partial<Record<EngineId, string>>;
export type KeyHints = Partial<Record<EngineId, string>>;

function secret() {
  // Cambiar GEO_KEYS_SECRET (o, sin ella, la contraseña del panel) deja ilegibles las llaves guardadas.
  const base = process.env.GEO_KEYS_SECRET || `keys|${process.env.PANEL_PASSWORD ?? ""}|${process.env.DATABASE_URL ?? ""}`;
  return createHash("sha256").update(base).digest();
}

export function sealKeys(keys: ApiKeys): string | null {
  const clean = Object.fromEntries(Object.entries(keys).filter(([, v]) => typeof v === "string" && v));
  if (!Object.keys(clean).length) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(clean), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function openKeys(sealed: string | null | undefined): ApiKeys {
  if (!sealed) return {};
  try {
    const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", secret(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")) as ApiKeys;
  } catch {
    console.warn("geo keys: no se pudieron descifrar (¿cambió el secreto?)");
    return {};
  }
}

/** Lo único que la página puede ver de una llave. */
export function hintsOf(keys: ApiKeys): KeyHints {
  return Object.fromEntries(Object.entries(keys).map(([e, k]) => [e, `…${k!.slice(-4)}`])) as KeyHints;
}

const KEY_SHAPE = /^[A-Za-z0-9_\-.:]{20,300}$/;

export function plausibleKey(key: string) {
  return KEY_SHAPE.test(key);
}

/**
 * Comprueba la llave con una consulta gratuita (la lista de modelos), sin gastar respuestas.
 * Perplexity no tiene una consulta así; ahí solo se revisa la forma.
 */
export async function verifyKey(engine: EngineId, key: string): Promise<boolean> {
  if (!plausibleKey(key)) return false;
  const req: Record<EngineId, [string, Record<string, string>] | null> = {
    openai: ["https://api.openai.com/v1/models", { Authorization: `Bearer ${key}` }],
    anthropic: ["https://api.anthropic.com/v1/models", { "x-api-key": key, "anthropic-version": "2023-06-01" }],
    gemini: ["https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", { "x-goog-api-key": key }],
    perplexity: null,
  };
  const r = req[engine];
  if (!r) return true;
  try {
    const res = await fetch(r[0], { headers: r[1], signal: AbortSignal.timeout(10_000), cache: "no-store" });
    return res.ok;
  } catch {
    // Si el proveedor no responde, no se rechaza la llave: la medición dirá si falla.
    return true;
  }
}
