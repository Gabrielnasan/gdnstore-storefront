// get-customer-orders: returns the authenticated customer's Shopify orders.
// Validates local session, decrypts Shopify Customer Account access token,
// fetches via Customer Account GraphQL API, refreshes the token if needed.

import { json, preflight } from "../_shared/cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";
import { decryptString, encryptString } from "../_shared/crypto.ts";
import {
  fetchCustomerOrders,
  refreshCustomerAccountToken,
  ShopifyUnauthorizedError,
} from "../_shared/shopify.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) return json(req, { success: false, error: "not_authenticated", needs_login: true }, 401);

    const session = await findActiveSessionByToken(token);
    if (!session) return json(req, { success: false, error: "invalid_session", needs_login: true }, 401);

    const db = admin();
    const { data: tokenRow, error: tokenErr } = await db
      .from("customer_shopify_tokens")
      .select("access_token_encrypted, refresh_token_encrypted, access_token_expires_at, scope")
      .eq("customer_profile_id", session.customer_profile_id)
      .maybeSingle();
    if (tokenErr) throw tokenErr;
    if (!tokenRow) return json(req, { success: false, error: "no_shopify_token", needs_login: true }, 401);

    let accessToken = await decryptString(tokenRow.access_token_encrypted as string);
    const refreshTokenEnc = tokenRow.refresh_token_encrypted as string | null;
    const expiresAt = tokenRow.access_token_expires_at
      ? new Date(tokenRow.access_token_expires_at as string).getTime()
      : null;

    // Proactively refresh if expired (or expires in <60s).
    const needsRefresh = expiresAt !== null && expiresAt - Date.now() < 60_000;
    if (needsRefresh && refreshTokenEnc) {
      try {
        accessToken = await refreshAndStore(db, session.customer_profile_id, refreshTokenEnc);
      } catch (e) {
        if (e instanceof ShopifyUnauthorizedError) {
          return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
        }
        throw e;
      }
    }

    try {
      const orders = await fetchCustomerOrders(accessToken);
      return json(req, { success: true, orders });
    } catch (e) {
      if (!(e instanceof ShopifyUnauthorizedError)) throw e;
      // Reactive refresh attempt.
      if (!refreshTokenEnc) {
        return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
      }
      try {
        accessToken = await refreshAndStore(db, session.customer_profile_id, refreshTokenEnc);
      } catch {
        return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
      }
      try {
        const orders = await fetchCustomerOrders(accessToken);
        return json(req, { success: true, orders });
      } catch (e2) {
        if (e2 instanceof ShopifyUnauthorizedError) {
          return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
        }
        throw e2;
      }
    }
  } catch (e) {
    console.error("[get-customer-orders] error:", (e as Error)?.message);
    return json(req, { success: false, error: "fetch_failed" }, 500);
  }
});

async function refreshAndStore(
  db: ReturnType<typeof admin>,
  customerProfileId: string,
  refreshTokenEnc: string,
): Promise<string> {
  const refreshToken = await decryptString(refreshTokenEnc);
  const refreshed = await refreshCustomerAccountToken(refreshToken);
  const accessExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null;
  const update: Record<string, unknown> = {
    access_token_encrypted: await encryptString(refreshed.access_token),
    access_token_expires_at: accessExpiresAt,
    scope: refreshed.scope ?? null,
    updated_at: new Date().toISOString(),
  };
  if (refreshed.refresh_token) {
    update.refresh_token_encrypted = await encryptString(refreshed.refresh_token);
  }
  const { error } = await db
    .from("customer_shopify_tokens")
    .update(update)
    .eq("customer_profile_id", customerProfileId);
  if (error) throw error;
  return refreshed.access_token;
}
