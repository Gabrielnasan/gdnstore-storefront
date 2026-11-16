// get-reviewable-products: returns line items from PAID orders the customer can review.

import { json, preflight } from "../_shared/cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";
import { getShopifyAccessToken } from "../_shared/customerToken.ts";
import { ShopifyUnauthorizedError } from "../_shared/shopify.ts";
import { fetchCustomerOrdersForReview, isPaidOrder } from "../_shared/shopifyReviewOrders.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) return json(req, { success: false, error: "not_authenticated", needs_login: true }, 401);
    const session = await findActiveSessionByToken(token);
    if (!session) return json(req, { success: false, error: "invalid_session", needs_login: true }, 401);

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

    // Build candidate items from paid orders.
    type Item = {
      shopifyOrderId: string;
      shopifyOrderName: string;
      processedAt: string | null;
      shopifyProductId: string;
      shopifyVariantId: string | null;
      productTitle: string;
      variantTitle: string | null;
      imageUrl: string | null;
    };
    const items: Item[] = [];
    for (const o of orders) {
      if (!isPaidOrder(o.financialStatus)) continue;
      for (const li of o.lineItems) {
        if (!li.productId) continue;
        items.push({
          shopifyOrderId: o.id,
          shopifyOrderName: o.name,
          processedAt: o.processedAt,
          shopifyProductId: li.productId,
          shopifyVariantId: li.variantId,
          productTitle: li.title,
          variantTitle: li.variantTitle,
          imageUrl: li.imageUrl,
        });
      }
    }

    // Filter out already-reviewed (customer_profile_id + shopify_order_id + shopify_product_id).
    if (items.length > 0) {
      const db = admin();
      const productIds = Array.from(new Set(items.map((i) => i.shopifyProductId)));
      const orderIds = Array.from(new Set(items.map((i) => i.shopifyOrderId)));
      const { data: existing, error } = await db
        .from("product_reviews")
        .select("shopify_order_id, shopify_product_id")
        .eq("customer_profile_id", session.customer_profile_id)
        .in("shopify_product_id", productIds)
        .in("shopify_order_id", orderIds);
      if (!error && existing) {
        const taken = new Set(
          (existing as Array<{ shopify_order_id: string; shopify_product_id: string }>).map(
            (r) => `${r.shopify_order_id}::${r.shopify_product_id}`,
          ),
        );
        for (let i = items.length - 1; i >= 0; i--) {
          const key = `${items[i].shopifyOrderId}::${items[i].shopifyProductId}`;
          if (taken.has(key)) items.splice(i, 1);
        }
      }
    }

    return json(req, { success: true, items });
  } catch (e) {
    console.error("[get-reviewable-products] error:", (e as Error)?.message);
    return json(req, { success: false, error: "fetch_failed" }, 500);
  }
});
