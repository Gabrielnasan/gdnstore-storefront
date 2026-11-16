// admin-get-current: returns admin status for the current storefront session.

import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { error: "method_not_allowed" }, 405);
  }

  try {
    const res = await requireAdmin(req);
    if (!res.ok) return res.response;
    const { ctx } = res;
    return json(req, {
      authenticated: true,
      admin: true,
      customer: ctx.customer,
      role: ctx.role,
    });
  } catch (e) {
    console.error("[admin-get-current] error:", (e as Error)?.message);
    return json(req, { authenticated: false, admin: false, error: "internal_error" }, 500);
  }
});
