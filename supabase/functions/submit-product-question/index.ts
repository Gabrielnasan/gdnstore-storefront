// submit-product-question: authenticated customer submits a question (status=pending).

import { json, preflight } from "../_shared/cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { success: false, error: "method_not_allowed" }, 405);

  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      return json(req, { success: false, error: "not_authenticated", needs_login: true }, 401);
    }

    const session = await findActiveSessionByToken(token);
    if (!session) {
      return json(req, { success: false, error: "invalid_session", needs_login: true }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const productId: string | undefined = body?.shopify_product_id;
    const productHandle: string | null = body?.product_handle ?? null;
    const rawQuestion: string = typeof body?.question === "string" ? body.question : "";

    if (!productId || typeof productId !== "string") {
      return json(req, { success: false, error: "missing_product_id" }, 400);
    }

    // Normalize whitespace and validate.
    const question = rawQuestion.replace(/\s+/g, " ").trim();
    if (question.length < 5) {
      return json(req, { success: false, error: "question_too_short" }, 400);
    }
    if (question.length > 1000) {
      return json(req, { success: false, error: "question_too_long" }, 400);
    }

    const db = admin();
    const { data: profile, error: profErr } = await db
      .from("customer_profiles")
      .select("id, email, first_name, last_name, display_name")
      .eq("id", session.customer_profile_id)
      .single();
    if (profErr) throw profErr;

    const customerName =
      profile.display_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email ||
      "Cliente";

    const insertRow: Record<string, unknown> = {
      shopify_product_id: productId,
      question,
      status: "pending",
      customer_name: customerName,
      customer_email: profile.email ?? null,
    };

    // Optional columns (only included if present in schema; the DB will ignore extra keys via PostgREST error,
    // so we attempt the insert and fall back without these fields on failure).
    const optional: Record<string, unknown> = {};
    if (productHandle) optional.product_handle = productHandle;
    optional.customer_profile_id = session.customer_profile_id;

    let { error: insErr } = await db
      .from("product_questions")
      .insert({ ...insertRow, ...optional });

    if (insErr) {
      // Retry without optional columns if schema lacks them.
      const msg = (insErr.message || "").toLowerCase();
      if (msg.includes("column") || msg.includes("schema")) {
        const retry = await db.from("product_questions").insert(insertRow);
        if (retry.error) throw retry.error;
      } else {
        throw insErr;
      }
    }

    return json(req, {
      success: true,
      message:
        "Pergunta enviada com sucesso. Ela será analisada antes de aparecer no produto.",
    });
  } catch (e) {
    console.error("[submit-product-question] error:", (e as Error)?.message);
    return json(req, { success: false, error: "submit_failed" }, 500);
  }
});
