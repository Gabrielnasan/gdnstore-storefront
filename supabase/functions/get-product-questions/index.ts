// get-product-questions: public listing of approved/answered questions for a product.

import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }

  try {
    let productId: string | null = null;
    let productHandle: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      productId =
        url.searchParams.get("shopify_product_id") ??
        url.searchParams.get("product_id");
      productHandle = url.searchParams.get("product_handle");
    } else {
      const body = await req.json().catch(() => ({}));
      productId = body?.shopify_product_id ?? body?.product_id ?? null;
      productHandle = body?.product_handle ?? null;
    }

    if (!productId && !productHandle) {
      return json(req, { success: false, error: "missing_product_identifier" }, 400);
    }

    const db = admin();
    let query = db
      .from("product_questions")
      .select(
        "id, question, answer, status, customer_name, created_at, answered_at",
      )
      .or("status.eq.approved,status.eq.answered")
      .order("created_at", { ascending: false })
      .limit(100);

    if (productId) query = query.eq("shopify_product_id", productId);

    const { data, error } = await query;
    if (error) throw error;

    const questions = (data ?? []).map((q) => ({
      id: q.id as string,
      question: q.question as string,
      answer: (q.answer as string | null) ?? null,
      status: q.status as string,
      customerName: maskName((q.customer_name as string | null) ?? null),
      createdAt: q.created_at as string,
      answeredAt: (q.answered_at as string | null) ?? null,
    }));

    return json(req, { success: true, questions });
  } catch (e) {
    console.error("[get-product-questions] error:", (e as Error)?.message);
    return json(req, { success: false, error: "fetch_failed" }, 500);
  }
});

function maskName(name: string | null): string {
  if (!name) return "Cliente";
  const trimmed = name.trim();
  if (!trimmed) return "Cliente";
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return [first, lastInitial].filter(Boolean).join(" ");
}
