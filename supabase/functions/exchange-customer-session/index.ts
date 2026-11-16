// exchange-customer-session: storefront posts { exchange_code } and gets back the session token.

import { json, preflight } from "../_shared/cors.ts";
import { decryptString, sha256Hex } from "../_shared/crypto.ts";
import { admin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const exchangeCode = typeof body?.exchange_code === "string" ? body.exchange_code.trim() : "";
    if (!exchangeCode) return json(req, { error: "missing_exchange_code" }, 400);

    const hash = await sha256Hex(exchangeCode);
    const db = admin();

    const { data: row, error } = await db
      .from("customer_session_exchanges")
      .select("id, session_token_encrypted, customer_profile_id, return_to, expires_at, used_at")
      .eq("exchange_code_hash", hash)
      .maybeSingle();
    if (error) throw error;
    if (!row) return json(req, { error: "invalid_exchange_code" }, 400);
    if (row.used_at) return json(req, { error: "exchange_code_used" }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) return json(req, { error: "exchange_code_expired" }, 400);

    await db
      .from("customer_session_exchanges")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

    const sessionToken = await decryptString(row.session_token_encrypted as string);

    const { data: profile, error: profileErr } = await db
      .from("customer_profiles")
      .select("id, shopify_customer_id, email, first_name, last_name, display_name, phone")
      .eq("id", row.customer_profile_id)
      .single();
    if (profileErr) throw profileErr;

    return json(req, {
      session_token: sessionToken,
      return_to: row.return_to ?? "/minha-conta",
      customer: {
        id: profile.id,
        shopify_customer_id: profile.shopify_customer_id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        phone: profile.phone,
      },
    });
  } catch (e) {
    console.error("[exchange-customer-session] error:", e);
    return json(req, { error: "exchange_failed" }, 500);
  }
});
