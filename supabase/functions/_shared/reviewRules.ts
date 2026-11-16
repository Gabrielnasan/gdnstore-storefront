// Regras puras do módulo de avaliações: validação do payload e verificação de compra.
// Sem dependência de Deno, rede ou banco, para poderem ser testadas isoladamente.

export const MAX_IMAGES = 5;
export const MAX_VIDEOS = 1;
export const ALLOWED_IMAGE = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
export const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const MIN_BODY_LENGTH = 10;
export const MAX_BODY_LENGTH = 3000;
export const MAX_TITLE_LENGTH = 120;

export type ReviewInput = {
  shopifyOrderId: string;
  shopifyOrderName: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  productHandle: string | null;
  productTitle: string;
  rating: number;
  title: string;
  body: string;
  media: Array<Record<string, unknown>>;
};

export type ReviewInputResult = { ok: true; input: ReviewInput } | { ok: false; error: string };

/** Normaliza e valida o corpo da requisição de envio de avaliação. */
export function parseReviewInput(body: any, customerProfileId: string): ReviewInputResult {
  const input: ReviewInput = {
    shopifyOrderId: String(body?.shopify_order_id ?? "").trim(),
    shopifyOrderName: String(body?.shopify_order_name ?? "").trim(),
    shopifyProductId: String(body?.shopify_product_id ?? "").trim(),
    shopifyVariantId: body?.shopify_variant_id ? String(body.shopify_variant_id).trim() : null,
    productHandle: body?.product_handle ? String(body.product_handle).trim().slice(0, 200) : null,
    productTitle: String(body?.product_title ?? "")
      .trim()
      .slice(0, 300),
    rating: Number(body?.rating),
    title: typeof body?.title === "string" ? body.title.trim() : "",
    body: typeof body?.body === "string" ? body.body.trim() : "",
    media: Array.isArray(body?.media) ? (body.media as Array<Record<string, unknown>>) : [],
  };

  if (!input.shopifyOrderId || !input.shopifyProductId)
    return { ok: false, error: "missing_identifiers" };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "invalid_rating" };
  }
  if (input.body.length < MIN_BODY_LENGTH) return { ok: false, error: "body_too_short" };
  if (input.body.length > MAX_BODY_LENGTH) return { ok: false, error: "body_too_long" };
  if (input.title.length > MAX_TITLE_LENGTH) return { ok: false, error: "title_too_long" };

  const images = input.media.filter((m) => m?.media_type === "image");
  const videos = input.media.filter((m) => m?.media_type === "video");
  if (images.length > MAX_IMAGES) return { ok: false, error: "too_many_images" };
  if (videos.length > MAX_VIDEOS) return { ok: false, error: "too_many_videos" };
  for (const m of input.media) {
    const mt = String(m?.mime_type ?? "").toLowerCase();
    const t = String(m?.media_type ?? "");
    if (t === "image" && !ALLOWED_IMAGE.has(mt)) return { ok: false, error: "bad_image_mime" };
    if (t === "video" && !ALLOWED_VIDEO.has(mt)) return { ok: false, error: "bad_video_mime" };
    // A mídia precisa estar na pasta do próprio cliente no bucket privado.
    const sp = String(m?.storage_path ?? "");
    if (!sp.startsWith(`reviews/${customerProfileId}/`))
      return { ok: false, error: "invalid_storage_path" };
  }

  return { ok: true, input };
}

export function isPaidOrder(financialStatus: string | null): boolean {
  if (!financialStatus) return false;
  const s = financialStatus.toUpperCase();
  return s === "PAID" || s === "PARTIALLY_REFUNDED";
}

export type PurchaseOrder = {
  id: string;
  financialStatus: string | null;
  lineItems: Array<{ productId: string | null; variantId: string | null }>;
};

export type PurchaseCheck<O extends PurchaseOrder> =
  | { ok: true; order: O; line: O["lineItems"][number] }
  | { ok: false; message: string };

/** Só pode avaliar quem tem um pedido pago que contém o produto. */
export function verifyPurchase<O extends PurchaseOrder>(
  orders: O[],
  shopifyOrderId: string,
  shopifyProductId: string,
): PurchaseCheck<O> {
  const order = orders.find((o) => o.id === shopifyOrderId);
  if (!order) return { ok: false, message: "Pedido não encontrado." };
  if (!isPaidOrder(order.financialStatus)) return { ok: false, message: "Pedido não está pago." };
  const line = order.lineItems.find((li) => li.productId === shopifyProductId);
  if (!line) return { ok: false, message: "Produto não encontrado no pedido." };
  return { ok: true, order, line };
}
