import { admin } from "./supabase.ts";
import { sha256Hex } from "./crypto.ts";

export function getSessionTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const x = req.headers.get("x-gdn-session");
  if (x) return x.trim();
  return null;
}

export type CustomerSessionRow = {
  id: string;
  customer_profile_id: string;
  session_token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

export async function findActiveSessionByToken(token: string): Promise<CustomerSessionRow | null> {
  const hash = await sha256Hex(token);
  const { data, error } = await admin()
    .from("customer_sessions")
    .select("id, customer_profile_id, session_token_hash, expires_at, revoked_at")
    .eq("session_token_hash", hash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return (data as CustomerSessionRow | null) ?? null;
}
