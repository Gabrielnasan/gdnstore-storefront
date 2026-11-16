// shopify-auth-start: kicks off the Shopify Customer Account OAuth flow with PKCE S256.
//
// GET /functions/v1/shopify-auth-start?login_hint=&return_to=/minha-conta
// Stores only state_hash + encrypted code_verifier; redirects to Shopify authorize URL.

import { getEnv, requireEnv } from "../_shared/env.ts";
import {
  encryptString,
  generatePkceVerifier,
  pkceChallengeS256,
  randomToken,
  sha256Hex,
} from "../_shared/crypto.ts";
import { admin } from "../_shared/supabase.ts";

const STATE_TTL_MS = 10 * 60 * 1000;

const REQUIRED_ENVS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID",
  "SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT",
  "SHOPIFY_CALLBACK_URL",
  "TOKEN_ENCRYPTION_SECRET",
] as const;

Deno.serve(async (req) => {
  console.log("[shopify-auth-start] function started");

  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  try {
    const url = new URL(req.url);
    console.log("[shopify-auth-start] request URL parsed:", url.pathname, "search:", url.search);

    const envPresence: Record<string, boolean> = {};
    for (const k of REQUIRED_ENVS) envPresence[k] = !!getEnv(k);
    console.log("[shopify-auth-start] env presence:", JSON.stringify(envPresence));

    const missing = REQUIRED_ENVS.filter((k) => !envPresence[k]);
    if (missing.length > 0) {
      console.error("[shopify-auth-start] missing env vars:", missing.join(","));
      return new Response(`Auth start failed: missing env (${missing.join(",")})`, { status: 500 });
    }

    const loginHint = url.searchParams.get("login_hint") ?? null;
    const returnTo = url.searchParams.get("return_to") ?? "/minha-conta";

    const clientId = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID");
    const authEndpoint = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT");
    const redirectUri = requireEnv("SHOPIFY_CALLBACK_URL");

    const state = randomToken(32);
    console.log("[shopify-auth-start] state generated (length):", state.length);

    const verifier = generatePkceVerifier();
    const challenge = await pkceChallengeS256(verifier);
    console.log(
      "[shopify-auth-start] PKCE generated (verifier_len:",
      verifier.length,
      ", challenge_len:",
      challenge.length,
      ")",
    );

    const stateHash = await sha256Hex(state);
    const verifierEncrypted = await encryptString(verifier);
    console.log("[shopify-auth-start] code verifier encrypted (cipher_len:", verifierEncrypted.length, ")");

    const sb = admin();
    console.log("[shopify-auth-start] supabase admin client created");

    console.log("[shopify-auth-start] insert into shopify_oauth_states started");
    const { error: insertError } = await sb.from("shopify_oauth_states").insert({
      state_hash: stateHash,
      code_verifier_encrypted: verifierEncrypted,
      login_hint: loginHint,
      return_to: returnTo,
      expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
    });
    if (insertError) {
      console.error(
        "[shopify-auth-start] insert failed:",
        JSON.stringify({
          code: (insertError as { code?: string }).code,
          message: insertError.message,
          details: (insertError as { details?: string }).details,
          hint: (insertError as { hint?: string }).hint,
        }),
      );
      return new Response("Auth start failed: db insert error", { status: 500 });
    }
    console.log("[shopify-auth-start] insert into shopify_oauth_states succeeded");

    const authorize = new URL(authEndpoint);
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", "openid email customer-account-api:full");
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    authorize.searchParams.set("locale", "pt-BR");
    authorize.searchParams.set("region_country", "BR");
    if (loginHint) authorize.searchParams.set("login_hint", loginHint);

    console.log(
      "[shopify-auth-start] authorization URL constructed (host:",
      authorize.host,
      ", path:",
      authorize.pathname,
      ")",
    );

    console.log("[shopify-auth-start] redirect started");
    return Response.redirect(authorize.toString(), 302);
  } catch (e) {
    const err = e as Error & { code?: string; details?: string; hint?: string };
    console.error(
      "[shopify-auth-start] caught error:",
      JSON.stringify({
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      }),
    );
    return new Response("Auth start failed", { status: 500 });
  }
});
