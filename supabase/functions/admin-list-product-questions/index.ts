// admin-list-product-questions: paginated/filtered listing for moderation.

import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";
import { admin } from "../_shared/supabase.ts";

const KNOWN_STATUSES = new Set(["pending", "approved", "rejected", "all"]);

type Filters = {
  status: string;
  search: string;
  productHandle: string | null;
  limit: number;
  offset: number;
};

function parseFilters(input: Record<string, unknown>): Filters {
  const status = String(input.status ?? "all").toLowerCase();
  const search = String(input.search ?? "").trim();
  const productHandle =
    typeof input.product_handle === "string" && input.product_handle.trim()
      ? input.product_handle.trim()
      : null;
  let limit = Number(input.limit ?? 50);
  if (!Number.isFinite(limit) || limit <= 0) limit = 50;
  limit = Math.min(Math.max(1, Math.floor(limit)), 200);

  let offset = Number(input.offset ?? 0);
  if (!Number.isFinite(offset) || offset < 0) {
    const page = Number(input.page ?? 0);
    offset = Number.isFinite(page) && page > 0 ? Math.floor(page) * limit : 0;
  }
  offset = Math.max(0, Math.floor(offset));

  return {
    status: KNOWN_STATUSES.has(status) ? status : "all",
    search,
    productHandle,
    limit,
    offset,
  };
}

const BASE_COLUMNS =
  "id, shopify_product_id, customer_name, customer_email, question, answer, status, answered_at, created_at";
const EXTENDED_COLUMNS =
  BASE_COLUMNS +
  ", shopify_product_title, shopify_product_handle, product_handle, answered_by, moderation_reason, moderated_by, moderated_at, updated_at";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }

  try {
    const adminRes = await requireAdmin(req);
    if (!adminRes.ok) return adminRes.response;

    let input: Record<string, unknown> = {};
    if (req.method === "GET") {
      const url = new URL(req.url);
      input = Object.fromEntries(url.searchParams.entries());
    } else {
      input = await req.json().catch(() => ({}));
    }
    const filters = parseFilters(input);

    const db = admin();

    const run = async (columns: string) => {
      let q = db
        .from("product_questions")
        .select(columns, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

      if (filters.status !== "all") q = q.eq("status", filters.status);

      if (filters.productHandle) {
        // Try matching either product_handle or shopify_product_handle when present.
        if (columns.includes("product_handle")) {
          q = q.or(
            `product_handle.eq.${filters.productHandle},shopify_product_handle.eq.${filters.productHandle}`,
          );
        }
      }

      if (filters.search) {
        const s = filters.search.replace(/[%,()]/g, " ").trim();
        if (s) {
          const parts = [
            `question.ilike.%${s}%`,
            `customer_name.ilike.%${s}%`,
            `customer_email.ilike.%${s}%`,
          ];
          if (columns.includes("shopify_product_title"))
            parts.push(`shopify_product_title.ilike.%${s}%`);
          if (columns.includes("shopify_product_handle"))
            parts.push(`shopify_product_handle.ilike.%${s}%`);
          if (columns.includes("product_handle"))
            parts.push(`product_handle.ilike.%${s}%`);
          q = q.or(parts.join(","));
        }
      }

      return await q;
    };

    let result = await run(EXTENDED_COLUMNS);
    if (result.error) {
      // Fall back to known minimal schema when optional columns are missing.
      result = await run(BASE_COLUMNS);
    }
    if (result.error) throw result.error;

    const rows = (result.data ?? []) as Array<Record<string, unknown>>;
    const questions = rows.map((r) => ({
      id: r.id as string,
      shopify_product_id: (r.shopify_product_id as string) ?? null,
      shopify_product_title: (r.shopify_product_title as string | undefined) ?? null,
      shopify_product_handle: (r.shopify_product_handle as string | undefined) ?? null,
      product_handle: (r.product_handle as string | undefined) ?? null,
      customer_name: (r.customer_name as string | null) ?? null,
      customer_email: (r.customer_email as string | null) ?? null,
      question: r.question as string,
      answer: (r.answer as string | null) ?? null,
      status: r.status as string,
      answered_by: (r.answered_by as string | undefined) ?? null,
      answered_at: (r.answered_at as string | null) ?? null,
      moderation_reason: (r.moderation_reason as string | undefined) ?? null,
      moderated_by: (r.moderated_by as string | undefined) ?? null,
      moderated_at: (r.moderated_at as string | undefined) ?? null,
      created_at: r.created_at as string,
      updated_at: (r.updated_at as string | undefined) ?? null,
    }));

    // Counts by status for summary cards (best-effort, ignore failures).
    const counts: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };
    try {
      const { data: all } = await db.from("product_questions").select("status");
      for (const row of (all ?? []) as Array<{ status: string }>) {
        counts.total += 1;
        const s = String(row.status).toLowerCase();
        if (s in counts) counts[s] += 1;
        else if (s === "answered") counts.approved += 1;
      }
    } catch (_e) {
      /* ignore */
    }

    return json(req, {
      success: true,
      questions,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: result.count ?? null,
      },
      counts,
    });
  } catch (e) {
    console.error("[admin-list-product-questions] error:", (e as Error)?.message);
    return json(req, { success: false, error: "list_failed" }, 500);
  }
});
