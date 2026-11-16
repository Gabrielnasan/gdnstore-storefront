// logout-customer: revokes the local storefront session and returns the
// Shopify Customer Account logout URL so the frontend can fully end the
// upstream session as well.

import { json, preflight } from "../_shared/cors.ts";
import { decryptString } from "../_shared/crypto.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";
import { getEnv } from "../_shared/env.ts";

function buildShopifyLogoutUrl(idToken: string | null): string | null {
  const endpoint = getEnv("SHOPIFY_CUSTOMER_ACCOUNT_LOGOUT_ENDPOINT");
  if (!endpoint) return null;
  const returnTo =
    getEnv("FRONTEND_BASE_URL") ?? "https://gdnstore.com.br";
  try {
    const url = new URL(endpoint);
    // Shopify Customer Account logout accepts post_logout_redirect_uri.
    if (idToken && !url.searchParams.has("id_token_hint")) {
      url.searchParams.set("id_token_hint", idToken);
    }
    if (!url.searchParams.has("post_logout_redirect_uri")) {
      url.searchParams.set("post_logout_redirect_uri", returnTo);
    }
    return url.toString();
  } catch {
    return endpoint;
  }
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = `${e.code ?? ""} ${e.message ?? ""} ${e.details ?? ""} ${e.hint ?? ""}`.toLowerCase();
  return (
    text.includes(column.toLowerCase()) &&
    (text.includes("schema cache") || text.includes("column") || text.includes("could not find") || e.code === "42703" || e.code === "PGRST204")
  );
}

async function loadIdToken(customerProfileId: string): Promise<string | null> {
  const { data, error } = await admin()
    .from("customer_shopify_tokens")
    .select("id_token_encrypted")
    .eq("customer_profile_id", customerProfileId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error, "id_token_encrypted")) return null;
    throw error;
  }

  const encrypted = (data as { id_token_encrypted?: string | null } | null)?.id_token_encrypted;
  if (!encrypted) return null;
  try {
    return await decryptString(encrypted);
  } catch (e) {
    console.warn("[logout-customer] stored id token could not be decrypted:", (e as Error)?.message);
    return null;
  }
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      console.log("[logout-customer] no session token on request");
      return json(req, { success: true, shopify_logout_url: buildShopifyLogoutUrl(null) });
    }

    const session = await findActiveSessionByToken(token);
    const idToken = session ? await loadIdToken(session.customer_profile_id) : null;

    if (!session) {
      console.log("[logout-customer] no active local session found");
      return json(req, { success: true, shopify_logout_url: buildShopifyLogoutUrl(null) });
    }

    const { error } = await admin()
      .from("customer_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", session.id)
      .is("revoked_at", null);

    if (error) {
      console.error("[logout-customer] revoke error:", error.message);
    } else {
      console.log("[logout-customer] local session revoked");
    }

    return json(req, { success: true, shopify_logout_url: buildShopifyLogoutUrl(idToken) });
  } catch (e) {
    console.error("[logout-customer] error:", (e as Error)?.message);
    // Still return success + shopify URL so the client can finish logging out.
    return json(req, { success: true, shopify_logout_url: buildShopifyLogoutUrl(null) });
  }
});
