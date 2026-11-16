// admin-update-product-question: answer / approve / reject / set_pending.

import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin, type AdminContext } from "../_shared/admin.ts";
import { admin } from "../_shared/supabase.ts";

type Action = "answer" | "approve" | "reject" | "set_pending";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const adminRes = await requireAdmin(req);
    if (!adminRes.ok) return adminRes.response;
    const { ctx } = adminRes;

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const action = String(body?.action ?? "") as Action;

    if (!id) return json(req, { success: false, error: "missing_id" }, 400);
    if (!["answer", "approve", "reject", "set_pending"].includes(action)) {
      return json(req, { success: false, error: "invalid_action" }, 400);
    }

    const patch = buildPatch(action, body, ctx);
    if (!patch.ok) return json(req, { success: false, error: patch.error }, 400);

    const updated = await updateWithFallback(id, patch.full, patch.minimal);
    if (!updated.ok) {
      return json(
        req,
        { success: false, error: updated.error ?? "update_failed" },
        updated.status ?? 500,
      );
    }

    return json(req, { success: true, question: updated.row });
  } catch (e) {
    console.error("[admin-update-product-question] error:", (e as Error)?.message);
    return json(req, { success: false, error: "internal_error" }, 500);
  }
});

function buildPatch(
  action: Action,
  body: Record<string, unknown>,
  ctx: AdminContext,
): { ok: true; full: Record<string, unknown>; minimal: Record<string, unknown> } | { ok: false; error: string } {
  const now = new Date().toISOString();
  const actor = ctx.customer.email || ctx.displayName;

  if (action === "answer") {
    const raw = typeof body?.answer === "string" ? body.answer : "";
    const answer = raw.trim();
    if (answer.length < 2) return { ok: false, error: "answer_too_short" };
    if (answer.length > 3000) return { ok: false, error: "answer_too_long" };
    return {
      ok: true,
      minimal: { answer, status: "approved", answered_at: now },
      full: {
        answer,
        status: "approved",
        answered_at: now,
        answered_by: actor,
        moderated_at: now,
        moderated_by: actor,
        updated_at: now,
      },
    };
  }

  if (action === "approve") {
    return {
      ok: true,
      minimal: { status: "approved" },
      full: { status: "approved", moderated_at: now, moderated_by: actor, updated_at: now },
    };
  }

  if (action === "reject") {
    const reason = typeof body?.moderation_reason === "string" ? body.moderation_reason.trim() : "";
    return {
      ok: true,
      minimal: { status: "rejected" },
      full: {
        status: "rejected",
        moderation_reason: reason || null,
        moderated_at: now,
        moderated_by: actor,
        updated_at: now,
      },
    };
  }

  // set_pending
  return {
    ok: true,
    minimal: { status: "pending" },
    full: { status: "pending", updated_at: now },
  };
}

async function updateWithFallback(
  id: string,
  full: Record<string, unknown>,
  minimal: Record<string, unknown>,
): Promise<{ ok: true; row: Record<string, unknown> } | { ok: false; error?: string; status?: number }> {
  const db = admin();

  // First attempt: full payload with optional moderation columns.
  let res = await db.from("product_questions").update(full).eq("id", id).select("*").maybeSingle();
  if (res.error) {
    // Retry with minimal payload (only guaranteed-existing columns).
    res = await db
      .from("product_questions")
      .update(minimal)
      .eq("id", id)
      .select("*")
      .maybeSingle();
  }

  if (res.error) {
    console.error("[admin-update-product-question] update error:", res.error);
    return { ok: false, error: "update_failed" };
  }
  if (!res.data) return { ok: false, status: 404, error: "not_found" };
  return { ok: true, row: res.data as Record<string, unknown> };
}
