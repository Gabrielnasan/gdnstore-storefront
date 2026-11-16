// get-current-customer: returns the authenticated customer profile for a valid session token.

import { json, preflight } from "../_shared/cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) return json(req, { authenticated: false });

    const session = await findActiveSessionByToken(token);
    if (!session) return json(req, { authenticated: false });

    const { data: profile, error } = await admin()
      .from("customer_profiles")
      .select("id, shopify_customer_id, email, first_name, last_name, display_name, phone")
      .eq("id", session.customer_profile_id)
      .single();
    if (error) throw error;

    return json(req, {
      authenticated: true,
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
    console.error("[get-current-customer] error:", e);
    return json(req, { authenticated: false, error: "lookup_failed" }, 500);
  }
});
