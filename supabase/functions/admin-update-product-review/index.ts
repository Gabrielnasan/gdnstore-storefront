// admin-update-product-review: approve / reject / set_pending.

import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin, type AdminContext } from "../_shared/admin.ts";
import { admin } from "../_shared/supabase.ts";

type Action = "approve" | "reject" | "set_pending";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { success: false, error: "method_not_allowed" }, 405);

  try {
    const adminRes = await requireAdmin(req);
    if (!adminRes.ok) return adminRes.response;
    const { ctx } = adminRes;

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const action = String(body?.action ?? "") as Action;
    if (!id) return json(req, { success: false, error: "missing_id" }, 400);
    if (!["approve", "reject", "set_pending"].includes(action)) {
      return json(req, { success: false, error: "invalid_action" }, 400);
    }

    const { full, minimal } = buildPatch(action, body, ctx);
    const db = admin();

    let res = await db.from("product_reviews").update(full).eq("id", id).select("*").maybeSingle();
    if (res.error) {
      res = await db.from("product_reviews").update(minimal).eq("id", id).select("*").maybeSingle();
    }
    if (res.error) {
      console.error("[admin-update-product-review] update error:", res.error.message);
      return json(req, { success: false, error: "update_failed", detail: res.error.message }, 500);
    }
    if (!res.data) return json(req, { success: false, error: "not_found" }, 404);

    return json(req, { success: true, review: res.data });
  } catch (e) {
    console.error("[admin-update-product-review] error:", (e as Error)?.message);
    return json(req, { success: false, error: "internal_error" }, 500);
  }
});

function buildPatch(
  action: Action,
  body: Record<string, unknown>,
  ctx: AdminContext,
): { full: Record<string, unknown>; minimal: Record<string, unknown> } {
  const now = new Date().toISOString();
  const actor = ctx.customer.email || ctx.displayName;
  if (action === "approve") {
    return {
      minimal: { status: "approved" },
      full: { status: "approved", approved_at: now, moderated_at: now, moderated_by: actor, updated_at: now },
    };
  }
  if (action === "reject") {
    const reason = typeof body?.moderation_reason === "string" ? body.moderation_reason.trim() : "";
    return {
      minimal: { status: "rejected" },
      full: {
        status: "rejected",
        rejected_at: now,
        moderation_reason: reason || null,
        moderated_at: now,
        moderated_by: actor,
        updated_at: now,
      },
    };
  }
  return {
    minimal: { status: "pending" },
    full: { status: "pending", moderated_at: null, moderated_by: null, updated_at: now },
  };
}
