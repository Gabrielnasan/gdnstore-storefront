// Product reviews — public + customer + admin helpers using the local session token.

import { getCustomerSessionToken } from "@/lib/customerSession";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export type ReviewMedia = {
  id?: string | null;
  mediaType: "image" | "video" | string;
  url: string;
  mimeType: string | null;
};

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  customerName: string | null;
  createdAt: string;
  media: ReviewMedia[];
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<"1" | "2" | "3" | "4" | "5", number>;
};

export type GetProductReviewsResult =
  | { success: true; summary: ReviewSummary; reviews: PublicReview[] }
  | { success: false; error: string };

export async function getProductReviews(params: {
  shopifyProductId?: string;
  productHandle?: string;
}): Promise<GetProductReviewsResult> {
  const url = new URL(`${BASE}/get-product-reviews`);
  if (params.shopifyProductId) url.searchParams.set("shopify_product_id", params.shopifyProductId);
  if (params.productHandle) url.searchParams.set("product_handle", params.productHandle);
  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return { success: false, error: body?.error ?? `http_${res.status}` };
    }
    return body as GetProductReviewsResult;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

export type ReviewableItem = {
  shopifyOrderId: string;
  shopifyOrderName: string;
  processedAt: string | null;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  productTitle: string;
  variantTitle: string | null;
  imageUrl: string | null;
  productHandle?: string | null;
};

export type ReviewableResult =
  | { success: true; items: ReviewableItem[] }
  | { success: false; error: string; needs_login?: boolean };

export async function getReviewableProducts(): Promise<ReviewableResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${BASE}/get-reviewable-products`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        needs_login: body?.needs_login === true || res.status === 401,
      };
    }
    return body as ReviewableResult;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

export const REVIEW_LIMITS = {
  maxImages: 5,
  maxVideos: 1,
  maxImageBytes: 5 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
  imageMimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  videoMimes: ["video/mp4", "video/webm", "video/quicktime"],
} as const;

type UploadedMedia = {
  media_type: "image" | "video";
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  file_name: string;
  file_size: number;
  sort_order: number;
};

export async function uploadReviewMedia(file: File, sortOrder: number): Promise<UploadedMedia> {
  const token = getCustomerSessionToken();
  if (!token) throw new Error("not_authenticated");
  const mime = file.type.toLowerCase();
  const isImage = (REVIEW_LIMITS.imageMimes as readonly string[]).includes(mime);
  const isVideo = (REVIEW_LIMITS.videoMimes as readonly string[]).includes(mime);
  if (!isImage && !isVideo) throw new Error("unsupported_media_type");
  const maxBytes = isImage ? REVIEW_LIMITS.maxImageBytes : REVIEW_LIMITS.maxVideoBytes;
  if (file.size > maxBytes) throw new Error("file_too_large");

  const initRes = await fetch(`${BASE}/create-review-media-upload-url`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mime_type: mime, file_name: file.name, file_size: file.size }),
  });
  const initBody = await initRes.json().catch(() => ({}));
  if (!initRes.ok || initBody?.success === false) {
    throw new Error(initBody?.error ?? `signed_url_http_${initRes.status}`);
  }

  const putRes = await fetch(initBody.signed_url, {
    method: "PUT",
    headers: { "content-type": mime },
    body: file,
  });
  if (!putRes.ok) throw new Error(`upload_failed_${putRes.status}`);

  return {
    media_type: isImage ? "image" : "video",
    storage_bucket: initBody.bucket,
    storage_path: initBody.storage_path,
    mime_type: mime,
    file_name: file.name,
    file_size: file.size,
    sort_order: sortOrder,
  };
}

export type SubmitReviewPayload = {
  shopify_order_id: string;
  shopify_order_name: string;
  shopify_product_id: string;
  shopify_variant_id: string | null;
  product_handle?: string | null;
  product_title: string;
  rating: number;
  title?: string | null;
  body: string;
  media: UploadedMedia[];
};

export type SubmitReviewResult =
  | { success: true; message: string; review_id: string | null }
  | { success: false; error: string; message?: string; needs_login?: boolean };

export async function submitProductReview(payload: SubmitReviewPayload): Promise<SubmitReviewResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${BASE}/submit-product-review`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        message: body?.message,
        needs_login: body?.needs_login === true || res.status === 401,
      };
    }
    return body as SubmitReviewResult;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

// ---------- Admin ----------

export type AdminReview = {
  id: string;
  shopifyOrderId: string | null;
  shopifyOrderName: string | null;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  productHandle: string | null;
  productTitle: string | null;
  customerName: string | null;
  customerEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  status: string;
  moderationReason: string | null;
  moderatedBy: string | null;
  moderatedAt: string | null;
  createdAt: string;
  media: ReviewMedia[];
};

export type AdminListReviewsResult =
  | {
      success: true;
      reviews: AdminReview[];
      pagination: { limit: number; offset: number; total: number | null };
      counts: { pending: number; approved: number; rejected: number; total: number };
    }
  | { success: false; error: string; needs_login?: boolean };

export async function adminListProductReviews(filters: {
  status?: "all" | "pending" | "approved" | "rejected";
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminListReviewsResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${BASE}/admin-list-product-reviews`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(filters),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        needs_login: res.status === 401,
      };
    }
    return body as AdminListReviewsResult;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

export type AdminUpdateReviewPayload = {
  id: string;
  action: "approve" | "reject" | "set_pending";
  moderation_reason?: string;
};

export async function adminUpdateProductReview(payload: AdminUpdateReviewPayload): Promise<
  { success: true; review: Record<string, unknown> } | { success: false; error: string; needs_login?: boolean }
> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${BASE}/admin-update-product-review`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        needs_login: res.status === 401,
      };
    }
    return body as { success: true; review: Record<string, unknown> };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}
