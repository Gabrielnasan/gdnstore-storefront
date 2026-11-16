// get-product-reviews: public listing of approved reviews + summary + signed media URLs.

import { json, preflight } from "../_shared/cors.ts";
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
    let productId: string | null = null;
    let productHandle: string | null = null;
    if (req.method === "GET") {
      const url = new URL(req.url);
      productId = url.searchParams.get("shopify_product_id") ?? url.searchParams.get("product_id");
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
      .from("product_reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(200);
    if (productId) query = query.eq("shopify_product_id", productId);
    else if (productHandle) query = query.eq("product_handle", productHandle);

    const { data: rows, error } = await query;
    if (error) throw error;
    const reviews = (rows ?? []) as Array<Record<string, unknown>>;

    // Summary
    let total = 0;
    let sum = 0;
    const ratingCounts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const r of reviews) {
      const rt = Math.max(1, Math.min(5, Number(r.rating) || 0));
      if (rt >= 1) {
        total++;
        sum += rt;
        ratingCounts[String(rt)] = (ratingCounts[String(rt)] ?? 0) + 1;
      }
    }
    const averageRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    // Load media for these reviews
    const ids = reviews.map((r) => r.id as string).filter(Boolean);
    let mediaByReview = new Map<string, Array<{ mediaType: string; url: string; mimeType: string | null }>>();
    if (ids.length > 0) {
      // Preferred: product_review_media
      const { data: mediaRows } = await db
        .from("product_review_media")
        .select("review_id, media_type, storage_bucket, storage_path, mime_type, sort_order")
        .in("review_id", ids)
        .order("sort_order", { ascending: true });
      if (mediaRows && mediaRows.length > 0) {
        await collectMedia(mediaRows as any, mediaByReview);
      } else {
        // Legacy: product_review_photos
        const legacy = await db
          .from("product_review_photos")
          .select("review_id, storage_path, photo_url")
          .in("review_id", ids);
        if (legacy.data) {
          const byBucket = new Map<string, string[]>();
          for (const r of legacy.data as any[]) {
            if (!r.storage_path) continue;
            const arr = byBucket.get(LEGACY_BUCKET) ?? [];
            arr.push(r.storage_path);
            byBucket.set(LEGACY_BUCKET, arr);
          }
          const signedMap = await signAll(byBucket);
          for (const r of legacy.data as any[]) {
            const url = signedMap.get(`${LEGACY_BUCKET}::${r.storage_path}`) ?? r.photo_url ?? null;
            if (!url) continue;
            const arr = mediaByReview.get(r.review_id) ?? [];
            arr.push({ mediaType: "image", url, mimeType: null });
            mediaByReview.set(r.review_id, arr);
          }
        }
      }
    }

    const out = reviews.map((r) => ({
      id: r.id as string,
      rating: Number(r.rating) || 0,
      title: (r.title as string | null) ?? null,
      body: (r.body as string | null) ?? (r.comment as string | null) ?? "",
      verifiedPurchase: Boolean(r.verified_purchase),
      customerName: maskName((r.customer_name as string | null) ?? null),
      createdAt: r.created_at as string,
      media: mediaByReview.get(r.id as string) ?? [],
    }));

    return json(req, {
      success: true,
      summary: { averageRating, totalReviews: total, ratingCounts },
      reviews: out,
    });
  } catch (e) {
    console.error("[get-product-reviews] error:", (e as Error)?.message);
    return json(req, { success: false, error: "fetch_failed" }, 500);
  }
});

async function collectMedia(
  mediaRows: Array<{ review_id: string; media_type: string; storage_bucket: string; storage_path: string; mime_type: string | null }>,
  mediaByReview: Map<string, Array<{ mediaType: string; url: string; mimeType: string | null }>>,
): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const r of mediaRows) {
    const bucket = r.storage_bucket || BUCKET;
    const arr = byBucket.get(bucket) ?? [];
    arr.push(r.storage_path);
    byBucket.set(bucket, arr);
  }
  const signedMap = await signAll(byBucket);
  for (const r of mediaRows) {
    const bucket = r.storage_bucket || BUCKET;
    const key = `${bucket}::${r.storage_path}`;
    const url = signedMap.get(key);
    if (!url) continue;
    const arr = mediaByReview.get(r.review_id) ?? [];
    arr.push({ mediaType: r.media_type, url, mimeType: r.mime_type });
    mediaByReview.set(r.review_id, arr);
  }
}

async function signAll(byBucket: Map<string, string[]>): Promise<Map<string, string>> {
  const db = admin();
  const out = new Map<string, string>();
  for (const [bucket, paths] of byBucket.entries()) {
    if (paths.length === 0) continue;
    const { data } = await db.storage.from(bucket).createSignedUrls(paths, SIGNED_TTL);
    if (!data) continue;
    data.forEach((d, i) => {
      if (d?.signedUrl) out.set(`${bucket}::${paths[i]}`, d.signedUrl);
    });
  }
  return out;
}

function maskName(name: string | null): string {
  if (!name) return "Cliente";
  const t = name.trim();
  if (!t) return "Cliente";
  const parts = t.split(/\s+/);
  const first = parts[0];
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return [first, lastInitial].filter(Boolean).join(" ");
}
