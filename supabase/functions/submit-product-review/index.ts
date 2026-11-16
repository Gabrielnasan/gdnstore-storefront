// submit-product-review: authenticated, server-verified review submission.

import { json, preflight } from "../_shared/cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";
import { getShopifyAccessToken } from "../_shared/customerToken.ts";
import { ShopifyUnauthorizedError } from "../_shared/shopify.ts";
import { fetchCustomerOrdersForReview } from "../_shared/shopifyReviewOrders.ts";
import { parseReviewInput, verifyPurchase } from "../_shared/reviewRules.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { success: false, error: "method_not_allowed" }, 405);

  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) return json(req, { success: false, error: "not_authenticated", needs_login: true }, 401);
    const session = await findActiveSessionByToken(token);
    if (!session) return json(req, { success: false, error: "invalid_session", needs_login: true }, 401);

    const body = await req.json().catch(() => ({}));
    const parsed = parseReviewInput(body, session.customer_profile_id);
    if (!parsed.ok) return json(req, { success: false, error: parsed.error }, 400);
    const {
      shopifyOrderId,
      shopifyOrderName,
      shopifyProductId,
      shopifyVariantId,
      productHandle,
      productTitle,
      rating,
      title: titleRaw,
      body: bodyTextRaw,
      media,
    } = parsed.input;

    // Verify purchase via Shopify Customer Account API
    let accessToken: string;
    try {
      accessToken = await getShopifyAccessToken(session.customer_profile_id);
    } catch (e) {
      if (e instanceof ShopifyUnauthorizedError) {
        return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
      }
      throw e;
    }

    let orders;
    try {
      orders = await fetchCustomerOrdersForReview(accessToken, 25);
    } catch (e) {
      if (e instanceof ShopifyUnauthorizedError) {
        return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
      }
      throw e;
    }

    // O produto fica verificado mesmo que a variante informada seja diferente da comprada.
    const purchase = verifyPurchase(orders, shopifyOrderId, shopifyProductId);
    if (!purchase.ok) return json(req, { success: false, error: "not_verified", message: purchase.message }, 403);
    const { order, line: matchingLine } = purchase;

    const db = admin();

    // Load profile for customer name/email
    const { data: profile } = await db
      .from("customer_profiles")
      .select("id, email, first_name, last_name, display_name")
      .eq("id", session.customer_profile_id)
      .single();
    const customerName =
      profile?.display_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.email ||
      "Cliente";

    // Duplicate guard
    const { data: dup } = await db
      .from("product_reviews")
      .select("id")
      .eq("customer_profile_id", session.customer_profile_id)
      .eq("shopify_order_id", shopifyOrderId)
      .eq("shopify_product_id", shopifyProductId)
      .maybeSingle();
    if (dup) {
      return json(req, { success: false, error: "already_reviewed", message: "Você já avaliou este produto neste pedido." }, 409);
    }

    const now = new Date().toISOString();
    const full: Record<string, unknown> = {
      customer_profile_id: session.customer_profile_id,
      shopify_order_id: shopifyOrderId,
      shopify_order_name: shopifyOrderName || order.name,
      shopify_product_id: shopifyProductId,
      shopify_variant_id: shopifyVariantId || matchingLine.variantId,
      product_handle: productHandle,
      product_title: productTitle || matchingLine.title,
      customer_name: customerName,
      customer_email: profile?.email ?? null,
      rating,
      title: titleRaw || null,
      body: bodyTextRaw,
      // Legacy column compatibility — older schemas may still use `comment` NOT NULL.
      comment: bodyTextRaw,
      verified_purchase: true,
      status: "pending",
      created_at: now,
      updated_at: now,
    };

    let inserted: Record<string, unknown> | null = null;
    {
      const attempt = await db.from("product_reviews").insert(full).select("*").maybeSingle();
      if (attempt.error) {
        const minimal: Record<string, unknown> = {
          shopify_product_id: shopifyProductId,
          customer_name: customerName,
          customer_email: profile?.email ?? null,
          rating,
          title: titleRaw || null,
          comment: bodyTextRaw,
          status: "pending",
          verified_purchase: true,
        };
        const retry = await db.from("product_reviews").insert(minimal).select("*").maybeSingle();
        if (retry.error) {
          console.error("[submit-product-review] insert error:", attempt.error.message, "| retry:", retry.error.message);
          return json(req, { success: false, error: "insert_failed", detail: attempt.error.message }, 500);
        }
        inserted = retry.data as Record<string, unknown>;
      } else {
        inserted = attempt.data as Record<string, unknown>;
      }
    }

    const reviewId = inserted?.id as string | undefined;

    // Insert media rows (best-effort)
    if (reviewId && media.length > 0) {
      const rows = media.map((m, i) => ({
        review_id: reviewId,
        media_type: String(m.media_type),
        storage_bucket: "product-review-media",
        storage_path: String(m.storage_path),
        mime_type: String(m.mime_type ?? ""),
        file_name: String(m.file_name ?? "").slice(0, 255),
        file_size: Number(m.file_size ?? 0) || null,
        sort_order: typeof m.sort_order === "number" ? m.sort_order : i,
      }));
      const ins = await db.from("product_review_media").insert(rows);
      if (ins.error) {
        // Fallback to legacy product_review_photos for images only.
        const photoRows = rows
          .filter((r) => r.media_type === "image")
          .map((r) => ({ review_id: r.review_id, storage_path: r.storage_path, photo_url: null }));
        if (photoRows.length > 0) {
          await db.from("product_review_photos").insert(photoRows);
        }
        console.warn("[submit-product-review] media insert fallback:", ins.error.message);
      }
    }

    return json(req, {
      success: true,
      message: "Avaliação enviada com sucesso. Ela será analisada antes de aparecer no produto.",
      review_id: reviewId ?? null,
    });
  } catch (e) {
    console.error("[submit-product-review] error:", (e as Error)?.message);
    return json(req, { success: false, error: "internal_error" }, 500);
  }
});
