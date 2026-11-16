import { supabase } from "@/integrations/supabase/client";

export interface ReviewPhoto {
  id: string;
  storage_path: string;
  photo_url: string;
  signedUrl?: string;
}

export interface Review {
  id: string;
  shopify_product_id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  photos?: ReviewPhoto[];
}

export interface Question {
  id: string;
  shopify_product_id: string;
  customer_name: string | null;
  customer_email: string | null;
  question: string;
  answer: string | null;
  status: string;
  created_at: string;
  answered_at: string | null;
}

const BUCKET = "review-photos";

async function signPhotos(photos: ReviewPhoto[]): Promise<ReviewPhoto[]> {
  if (!photos.length) return [];
  const paths = photos.map((p) => p.storage_path);
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  return photos.map((p, i) => ({ ...p, signedUrl: data?.[i]?.signedUrl ?? p.photo_url }));
}

export async function fetchApprovedReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, shopify_product_id, customer_name, rating, title, comment, status, verified_purchase, helpful_count, created_at, updated_at, photos:product_review_photos(id, storage_path, photo_url)")
    .eq("shopify_product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const reviews = (data ?? []) as unknown as Review[];
  for (const r of reviews) {
    if (r.photos?.length) r.photos = await signPhotos(r.photos);
  }
  return reviews;
}

export async function fetchVisibleQuestions(productId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("product_questions")
    .select("id, shopify_product_id, customer_name, question, answer, status, created_at, answered_at")
    .eq("shopify_product_id", productId)
    .or("status.eq.approved,answer.not.is.null")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Question[];
}

export interface SubmitReviewInput {
  productId: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
  files?: File[];
}

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function verifyPurchase(productId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("verify-shopify-purchase", {
    body: { shopify_product_id: productId },
  });
  if (error) throw new Error(error.message);
  return !!(data as { verified?: boolean })?.verified;
}

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Você precisa estar logado para avaliar.");

  // Upload photos first to user's folder
  const photos: { storage_path: string }[] = [];
  if (input.files?.length) {
    for (const file of input.files.slice(0, 4)) {
      if (!ALLOWED_MIME.includes(file.type)) continue;
      if (file.size > MAX_BYTES) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) continue;
      photos.push({ storage_path: path });
    }
  }

  const { data, error } = await supabase.functions.invoke("submit-product-review", {
    body: {
      shopify_product_id: input.productId,
      customer_name: input.name,
      rating: input.rating,
      title: input.title || null,
      comment: input.comment,
      photos,
    },
  });
  if (error) {
    // Try to extract structured error from edge function response
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const body = await ctx.json();
        if (body?.error === "not_verified") {
          throw new Error(body.message || "Apenas clientes que compraram este produto podem avaliá-lo.");
        }
        if (body?.error) throw new Error(body.error);
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }
    throw new Error(error.message);
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { message?: string; error: string }).message || (data as { error: string }).error);
  }
}

export async function submitQuestion(input: {
  productId: string;
  name?: string;
  question: string;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Você precisa estar logado para perguntar.");

  const { data, error } = await supabase.functions.invoke("submit-product-question", {
    body: {
      shopify_product_id: input.productId,
      customer_name: input.name || null,
      question: input.question,
    },
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
}

export interface ReviewSummary {
  avg: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function summarize(reviews: Review[]): ReviewSummary {
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const k = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[k]++;
    sum += r.rating;
  }
  return {
    total: reviews.length,
    avg: reviews.length ? sum / reviews.length : 0,
    distribution,
  };
}
