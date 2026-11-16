// admin-list-product-reviews: paginated/filtered listing for moderation.

import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin.ts";
import { admin } from "../_shared/supabase.ts";

const BUCKET = "product-review-media";
const LEGACY_BUCKET = "review-photos";
const SIGNED_TTL = 60 * 60;

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
      input = Object.fromEntries(new URL(req.url).searchParams.entries());
    } else {
      input = await req.json().catch(() => ({}));
    }
    const status = String(input.status ?? "all").toLowerCase();
    const search = String(input.search ?? "").trim();
    let limit = Number(input.limit ?? 50);
    if (!Number.isFinite(limit)) limit = 50;
    limit = Math.min(Math.max(1, Math.floor(limit)), 200);
    let offset = Number(input.offset ?? 0);
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    const db = admin();

    let q = db
      .from("product_reviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (["pending", "approved", "rejected"].includes(status)) q = q.eq("status", status);
    if (search) {
      const s = search.replace(/[%,]/g, " ");
      q = q.or(
        [
          `customer_name.ilike.%${s}%`,
          `customer_email.ilike.%${s}%`,
          `product_title.ilike.%${s}%`,
          `product_handle.ilike.%${s}%`,
          `shopify_product_id.ilike.%${s}%`,
          `body.ilike.%${s}%`,
          `comment.ilike.%${s}%`,
        ].join(","),
      );
    }

    const { data, error, count } = await q;
    if (error) {
      console.error("[admin-list-product-reviews] query error:", error.message);
      return json(req, { success: false, error: "query_failed", detail: error.message }, 500);
    }
    const reviews = (data ?? []) as Array<Record<string, unknown>>;

    // Counts summary
    const counts = { pending: 0, approved: 0, rejected: 0, total: 0 };
    const countRes = await db.from("product_reviews").select("status");
    if (!countRes.error && countRes.data) {
      for (const r of countRes.data as Array<{ status: string }>) {
        counts.total++;
        if (r.status === "pending") counts.pending++;
        else if (r.status === "approved") counts.approved++;
        else if (r.status === "rejected") counts.rejected++;
      }
    }

    // Media + signed URLs
    const ids = reviews.map((r) => r.id as string).filter(Boolean);
    const mediaByReview = new Map<string, Array<{ id: string | null; mediaType: string; url: string; mimeType: string | null }>>();
    if (ids.length > 0) {
      const { data: media } = await db
        .from("product_review_media")
        .select("id, review_id, media_type, storage_bucket, storage_path, mime_type, sort_order")
        .in("review_id", ids)
        .order("sort_order", { ascending: true });
      const byBucket = new Map<string, string[]>();
      for (const m of (media ?? []) as any[]) {
        const bucket = m.storage_bucket || BUCKET;
        const arr = byBucket.get(bucket) ?? [];
        arr.push(m.storage_path);
        byBucket.set(bucket, arr);
      }
      const signedMap = new Map<string, string>();
      for (const [bucket, paths] of byBucket.entries()) {
        const { data: signed } = await db.storage.from(bucket).createSignedUrls(paths, SIGNED_TTL);
        signed?.forEach((s, i) => s?.signedUrl && signedMap.set(`${bucket}::${paths[i]}`, s.signedUrl));
      }
      for (const m of (media ?? []) as any[]) {
        const bucket = m.storage_bucket || BUCKET;
        const url = signedMap.get(`${bucket}::${m.storage_path}`);
        if (!url) continue;
        const arr = mediaByReview.get(m.review_id) ?? [];
        arr.push({ id: m.id, mediaType: m.media_type, url, mimeType: m.mime_type });
        mediaByReview.set(m.review_id, arr);
      }
      // Legacy photos fallback
      if (mediaByReview.size === 0) {
        const legacy = await db
          .from("product_review_photos")
          .select("id, review_id, storage_path, photo_url")
          .in("review_id", ids);
        if (legacy.data) {
          const paths = (legacy.data as any[]).map((r) => r.storage_path).filter(Boolean);
          const { data: signed } = await db.storage.from(LEGACY_BUCKET).createSignedUrls(paths, SIGNED_TTL);
          const map = new Map<string, string>();
          signed?.forEach((s, i) => s?.signedUrl && map.set(paths[i], s.signedUrl));
          for (const r of legacy.data as any[]) {
            const url = map.get(r.storage_path) ?? r.photo_url;
            if (!url) continue;
            const arr = mediaByReview.get(r.review_id) ?? [];
            arr.push({ id: r.id, mediaType: "image", url, mimeType: null });
            mediaByReview.set(r.review_id, arr);
          }
        }
      }
    }

    const out = reviews.map((r) => ({
      id: r.id as string,
      shopifyOrderId: (r.shopify_order_id as string | null) ?? null,
      shopifyOrderName: (r.shopify_order_name as string | null) ?? null,
      shopifyProductId: (r.shopify_product_id as string | null) ?? null,
      shopifyVariantId: (r.shopify_variant_id as string | null) ?? null,
      productHandle: (r.product_handle as string | null) ?? null,
      productTitle: (r.product_title as string | null) ?? null,
      customerName: (r.customer_name as string | null) ?? null,
      customerEmail: (r.customer_email as string | null) ?? null,
      rating: Number(r.rating) || 0,
      title: (r.title as string | null) ?? null,
      body: (r.body as string | null) ?? (r.comment as string | null) ?? "",
      verifiedPurchase: Boolean(r.verified_purchase),
      status: (r.status as string) ?? "pending",
      moderationReason: (r.moderation_reason as string | null) ?? null,
      moderatedBy: (r.moderated_by as string | null) ?? null,
      moderatedAt: (r.moderated_at as string | null) ?? null,
      createdAt: r.created_at as string,
      media: mediaByReview.get(r.id as string) ?? [],
    }));

    return json(req, {
      success: true,
      reviews: out,
      pagination: { limit, offset, total: count ?? null },
      counts,
    });
  } catch (e) {
    console.error("[admin-list-product-reviews] error:", (e as Error)?.message);
    return json(req, { success: false, error: "internal_error" }, 500);
  }
});
