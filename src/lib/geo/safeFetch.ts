import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Server-side fetch for URLs typed by anyone on the internet.
// Guards against SSRF: only public http(s) hosts on standard ports,
// every redirect hop re-validated, hard limits on time and size.

export class FetchBlockedError extends Error {}
export class HostNotFoundError extends Error {}

export type SafeResponse = {
  status: number;
  finalUrl: string;
  headers: Headers;
  body: string;
  ms: number;
  truncated: boolean;
};

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 3 * 1024 * 1024;

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateV4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("ff")
  );
}

/** Throws unless the URL points at a public host. */
export async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchBlockedError("protocol");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new FetchBlockedError("port");
  }
  if (url.username || url.password) throw new FetchBlockedError("credentials");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new FetchBlockedError("private");
    return;
  }
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new FetchBlockedError("host");
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new HostNotFoundError(host);
  }
  if (addresses.length === 0) throw new HostNotFoundError(host);
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new FetchBlockedError("private");
  }
}

async function readCapped(res: Response): Promise<{ body: string; truncated: boolean }> {
  if (!res.body) return { body: "", truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  return { body: new TextDecoder("utf-8", { fatal: false }).decode(buf), truncated };
}

export async function safeFetch(input: string, userAgent: string): Promise<SafeResponse> {
  const started = Date.now();
  let current = new URL(input);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);

    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "es,en;q=0.8",
      },
      cache: "no-store",
    });

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      current = new URL(location, current);
      continue;
    }

    const { body, truncated } = await readCapped(res);
    return {
      status: res.status,
      finalUrl: current.toString(),
      headers: res.headers,
      body,
      ms: Date.now() - started,
      truncated,
    };
  }
  throw new FetchBlockedError("redirects");
}
