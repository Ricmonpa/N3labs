import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";

/** Un link de Scan GEO para un prospecto: /scan-geo?i=<token>, de un solo uso por defecto. */
export type Invite = {
  token: string;
  label: string;
  max_uses: number;
  uses: number;
  used_by: string | null;
  used_at: string | null;
  created_by: string;
  created_at: string;
};

export const INVITE_TOKEN = /^[A-Za-z0-9_-]{16,}$/;

export async function createInvite(label: string, email: string, maxUses = 1): Promise<Invite> {
  const sql = await db();
  const token = randomBytes(12).toString("base64url");
  const rows = (await sql`
    INSERT INTO geo_invites (token, label, max_uses, created_by)
    VALUES (${token}, ${label.trim().slice(0, 120) || "Sin nombre"}, ${Math.max(1, Math.min(50, maxUses))}, ${email})
    RETURNING *`) as Invite[];
  return rows[0];
}

export async function listInvites(limit = 30): Promise<Invite[]> {
  const sql = await db();
  return (await sql`SELECT * FROM geo_invites ORDER BY created_at DESC LIMIT ${limit}`) as Invite[];
}

export async function getInvite(token: string): Promise<Invite | null> {
  if (!INVITE_TOKEN.test(token)) return null;
  const sql = await db();
  const rows = (await sql`SELECT * FROM geo_invites WHERE token = ${token}`) as Invite[];
  return rows[0] ?? null;
}

export function inviteUsable(invite: Invite | null): invite is Invite {
  return !!invite && invite.uses < invite.max_uses;
}

/** Marca el link como usado. Devuelve false si ya se había agotado. */
export async function useInvite(token: string, email: string) {
  if (!INVITE_TOKEN.test(token)) return false;
  const sql = await db();
  const rows = (await sql`
    UPDATE geo_invites SET uses = uses + 1, used_by = COALESCE(used_by, ${email}), used_at = now()
    WHERE token = ${token} AND uses < max_uses
    RETURNING token`) as { token: string }[];
  return rows.length > 0;
}

export async function deleteInvite(token: string) {
  if (!INVITE_TOKEN.test(token)) return;
  const sql = await db();
  await sql`DELETE FROM geo_invites WHERE token = ${token}`;
}
