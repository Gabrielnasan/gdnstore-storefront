// shopify-auth-callback: handles redirect back from Shopify, exchanges code, mints local session,
// hands the storefront a short-lived exchange_code via the redirect URL.

import { requireEnv } from "../_shared/env.ts";
import {
  decryptString,
  encryptString,
  randomToken,
  sha256Hex,
} from "../_shared/crypto.ts";
import { admin } from "../_shared/supabase.ts";
import { fetchCurrentCustomer } from "../_shared/shopify.ts";

const SESSION_TTL_DAYS = 30;
const EXCHANGE_TTL_MS = 2 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  const frontend = requireEnv("FRONTEND_BASE_URL").replace(/\/+$/, "");

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return errorRedirect(frontend, "missing_params");

    const stateHash = await sha256Hex(state);
    const db = admin();

    const { data: stateRow, error: stateErr } = await db
      .from("shopify_oauth_states")
      .select("id, code_verifier_encrypted, return_to, expires_at, used_at")
      .eq("state_hash", stateHash)
      .maybeSingle();
    if (stateErr) throw stateErr;
    if (!stateRow) return errorRedirect(frontend, "invalid_state");
    if (stateRow.used_at) return errorRedirect(frontend, "state_used");
    if (new Date(stateRow.expires_at).getTime() < Date.now()) return errorRedirect(frontend, "state_expired");

    // Mark state used immediately (best-effort one-time).
    await db.from("shopify_oauth_states").update({ used_at: new Date().toISOString() }).eq("id", stateRow.id);

    const verifier = await decryptString(stateRow.code_verifier_encrypted as string);

    // Exchange authorization code for tokens (public client, no client_secret).
    const tokenEndpoint = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_ENDPOINT");
    const clientId = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID");
    const redirectUri = requireEnv("SHOPIFY_CALLBACK_URL");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: verifier,
    });

    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept": "application/json",
      },
      body: body.toString(),
    });
    if (!tokenRes.ok) {
      console.error("[shopify-auth-callback] token exchange failed", tokenRes.status, await tokenRes.text());
      return errorRedirect(frontend, "token_exchange_failed");
    }
    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
      token_type?: string;
      scope?: string;
    };

    const accessToken = tokenJson.access_token;
    if (!accessToken) return errorRedirect(frontend, "no_access_token");

    // Fetch customer profile from Customer Account API.
    const customer = await fetchCurrentCustomer(accessToken);
    const email = customer.emailAddress?.emailAddress ?? null;
    const phone = customer.phoneNumber?.phoneNumber ?? null;

    // Upsert customer_profiles by shopify_customer_id.
    const { data: profile, error: profileErr } = await db
      .from("customer_profiles")
      .upsert(
        {
          shopify_customer_id: customer.id,
          email,
          first_name: customer.firstName ?? null,
          last_name: customer.lastName ?? null,
          display_name: customer.displayName ?? null,
          phone,
          last_login_at: new Date().toISOString(),
        },
        { onConflict: "shopify_customer_id" },
      )
      .select("id")
      .single();
    if (profileErr) throw profileErr;

    // Store encrypted Shopify tokens.
    const accessExpiresAt = tokenJson.expires_in
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

    const tokenPayload: Record<string, unknown> = {
      customer_profile_id: profile.id,
      access_token_encrypted: await encryptString(accessToken),
      refresh_token_encrypted: tokenJson.refresh_token ? await encryptString(tokenJson.refresh_token) : null,
      access_token_expires_at: accessExpiresAt,
      scope: tokenJson.scope ?? null,
      id_token_encrypted: tokenJson.id_token ? await encryptString(tokenJson.id_token) : null,
    };

    const { error: tokenStoreErr } = await db.from("customer_shopify_tokens").upsert(
      tokenPayload,
      { onConflict: "customer_profile_id" },
    );
    if (tokenStoreErr) {
      if (isMissingColumnError(tokenStoreErr, "id_token_encrypted")) {
        delete tokenPayload.id_token_encrypted;
        const { error: fallbackErr } = await db.from("customer_shopify_tokens").upsert(
          tokenPayload,
          { onConflict: "customer_profile_id" },
        );
        if (fallbackErr) throw fallbackErr;
      } else {
        throw tokenStoreErr;
      }
    }

    // Create local storefront session.
    const sessionToken = randomToken(48);
    const sessionTokenHash = await sha256Hex(sessionToken);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000).toISOString();

    const { error: sessionErr } = await db.from("customer_sessions").insert({
      customer_profile_id: profile.id,
      session_token_hash: sessionTokenHash,
      expires_at: sessionExpiresAt,
    });
    if (sessionErr) throw sessionErr;

    // Short-lived exchange code, stores encrypted session token to hand back to the storefront.
    const exchangeCode = randomToken(32);
    const exchangeCodeHash = await sha256Hex(exchangeCode);
    const { error: exchangeErr } = await db.from("customer_session_exchanges").insert({
      exchange_code_hash: exchangeCodeHash,
      session_token_encrypted: await encryptString(sessionToken),
      customer_profile_id: profile.id,
      return_to: (stateRow.return_to as string | null) ?? "/minha-conta",
      expires_at: new Date(Date.now() + EXCHANGE_TTL_MS).toISOString(),
    });
    if (exchangeErr) throw exchangeErr;

    const redirect = new URL("/auth/callback", frontend);
    redirect.searchParams.set("exchange_code", exchangeCode);
    redirect.searchParams.set("return_to", (stateRow.return_to as string | null) ?? "/minha-conta");
    return Response.redirect(redirect.toString(), 302);
  } catch (e) {
    console.error("[shopify-auth-callback] error:", e);
    return errorRedirect(frontend, "callback_failed");
  }
});

function errorRedirect(frontend: string, reason: string): Response {
  const url = new URL("/auth/callback", frontend);
  url.searchParams.set("error", reason);
  return Response.redirect(url.toString(), 302);
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = `${e.code ?? ""} ${e.message ?? ""} ${e.details ?? ""} ${e.hint ?? ""}`.toLowerCase();
  return (
    text.includes(column.toLowerCase()) &&
    (text.includes("schema cache") || text.includes("column") || text.includes("could not find") || e.code === "42703" || e.code === "PGRST204")
  );
}
