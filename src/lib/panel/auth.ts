import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "n3-panel";
const SESSION_DAYS = 7;

export type Session = { email: string; exp: number };

function allowedEmails(): string[] {
  return (process.env.PANEL_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function authConfigured() {
  return (process.env.PANEL_PASSWORD ?? "").length >= 12 && allowedEmails().length > 0;
}

function secret() {
  // Changing the password (or the optional secret) signs everyone out.
  return process.env.PANEL_SESSION_SECRET || `${process.env.PANEL_PASSWORD}|${process.env.DATABASE_URL ?? ""}`;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(email: string, password: string) {
  if (!authConfigured()) return false;
  const okEmail = allowedEmails().includes(email.trim().toLowerCase());
  const okPassword = safeEqual(password, process.env.PANEL_PASSWORD!);
  return okEmail && okPassword;
}

export async function startSession(email: string) {
  const session: Session = { email: email.trim().toLowerCase(), exp: Date.now() + SESSION_DAYS * 86_400_000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  if (!authConfigured()) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (session.exp < Date.now() || !allowedEmails().includes(session.email)) return null;
    return session;
  } catch {
    return null;
  }
}

/** For API routes: the session, or a 401 response. Also rejects cross-site writes. */
export async function requireApiSession(request: Request): Promise<Session | Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    let originHost: string | null = null;
    try {
      originHost = new URL(request.headers.get("origin") ?? "").host;
    } catch {
      /* missing or opaque origin */
    }
    if (!originHost || originHost !== request.headers.get("host")) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  }
  const session = await getSession();
  return session ?? Response.json({ error: "unauthorized" }, { status: 401 });
}
