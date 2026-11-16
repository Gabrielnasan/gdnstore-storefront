import { describe, it, expect } from "vitest";
import {
  isPaidOrder,
  parseReviewInput,
  verifyPurchase,
  MAX_BODY_LENGTH,
  MAX_TITLE_LENGTH,
} from "../supabase/functions/_shared/reviewRules";

const CUSTOMER = "cust-1";

const validBody = (over: Record<string, unknown> = {}) => ({
  shopify_order_id: "gid://shopify/Order/1",
  shopify_product_id: "gid://shopify/Product/10",
  rating: 5,
  body: "Produto chegou bem embalado e funciona.",
  ...over,
});

const errorOf = (body: unknown) => {
  const r = parseReviewInput(body, CUSTOMER);
  return r.ok ? null : r.error;
};

describe("parseReviewInput", () => {
  it("aceita um payload mínimo válido e normaliza os campos", () => {
    const r = parseReviewInput(
      validBody({ title: "  Ótimo  ", shopify_variant_id: " v1 " }),
      CUSTOMER,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.input.title).toBe("Ótimo");
    expect(r.input.shopifyVariantId).toBe("v1");
    expect(r.input.media).toEqual([]);
  });

  it("exige pedido e produto", () => {
    expect(errorOf(validBody({ shopify_order_id: "" }))).toBe("missing_identifiers");
    expect(errorOf(validBody({ shopify_product_id: "   " }))).toBe("missing_identifiers");
    expect(errorOf(null)).toBe("missing_identifiers");
  });

  it("só aceita nota inteira de 1 a 5", () => {
    for (const rating of [0, 6, 4.5, "abc", undefined, -1]) {
      expect(errorOf(validBody({ rating }))).toBe("invalid_rating");
    }
    for (const rating of [1, 3, 5, "4"]) {
      expect(errorOf(validBody({ rating }))).toBeNull();
    }
  });

  it("limita o tamanho do texto e do título", () => {
    expect(errorOf(validBody({ body: "curto" }))).toBe("body_too_short");
    expect(errorOf(validBody({ body: "a".repeat(MAX_BODY_LENGTH + 1) }))).toBe("body_too_long");
    expect(errorOf(validBody({ body: "a".repeat(MAX_BODY_LENGTH) }))).toBeNull();
    expect(errorOf(validBody({ title: "t".repeat(MAX_TITLE_LENGTH + 1) }))).toBe("title_too_long");
  });

  const image = (over: Record<string, unknown> = {}) => ({
    media_type: "image",
    mime_type: "image/jpeg",
    storage_path: `reviews/${CUSTOMER}/foto.jpg`,
    ...over,
  });
  const video = (over: Record<string, unknown> = {}) => ({
    media_type: "video",
    mime_type: "video/mp4",
    storage_path: `reviews/${CUSTOMER}/video.mp4`,
    ...over,
  });

  it("limita a quantidade de mídia: 5 imagens e 1 vídeo", () => {
    expect(errorOf(validBody({ media: [...Array(5).fill(image()), video()] }))).toBeNull();
    expect(errorOf(validBody({ media: Array(6).fill(image()) }))).toBe("too_many_images");
    expect(errorOf(validBody({ media: [video(), video()] }))).toBe("too_many_videos");
  });

  it("rejeita tipos de arquivo fora da lista permitida", () => {
    expect(errorOf(validBody({ media: [image({ mime_type: "image/gif" })] }))).toBe(
      "bad_image_mime",
    );
    expect(errorOf(validBody({ media: [video({ mime_type: "video/x-msvideo" })] }))).toBe(
      "bad_video_mime",
    );
    expect(errorOf(validBody({ media: [image({ mime_type: "IMAGE/PNG" })] }))).toBeNull();
  });

  it("rejeita mídia fora da pasta do próprio cliente", () => {
    expect(
      errorOf(validBody({ media: [image({ storage_path: "reviews/outro-cliente/foto.jpg" })] })),
    ).toBe("invalid_storage_path");
    expect(
      errorOf(validBody({ media: [image({ storage_path: `../reviews/${CUSTOMER}/foto.jpg` })] })),
    ).toBe("invalid_storage_path");
    expect(errorOf(validBody({ media: [image({ storage_path: undefined })] }))).toBe(
      "invalid_storage_path",
    );
  });
});

describe("isPaidOrder", () => {
  it("considera pago apenas PAID e PARTIALLY_REFUNDED", () => {
    expect(isPaidOrder("PAID")).toBe(true);
    expect(isPaidOrder("paid")).toBe(true);
    expect(isPaidOrder("PARTIALLY_REFUNDED")).toBe(true);
    for (const s of ["PENDING", "AUTHORIZED", "REFUNDED", "VOIDED", "", null]) {
      expect(isPaidOrder(s)).toBe(false);
    }
  });
});

describe("verifyPurchase", () => {
  const order = (over: Record<string, unknown> = {}) => ({
    id: "order-1",
    name: "#1001",
    financialStatus: "PAID" as string | null,
    lineItems: [
      { productId: "prod-10", variantId: "var-1", title: "MacBook Air" },
      { productId: "prod-20", variantId: "var-2", title: "AirPods" },
    ],
    ...over,
  });

  it("aprova quando o pedido está pago e contém o produto", () => {
    const r = verifyPurchase([order()], "order-1", "prod-20");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.name).toBe("#1001");
    expect(r.line.title).toBe("AirPods");
  });

  it("recusa pedido que não é do cliente", () => {
    const r = verifyPurchase([order()], "order-de-outro-cliente", "prod-10");
    expect(r).toEqual({ ok: false, message: "Pedido não encontrado." });
    expect(verifyPurchase([], "order-1", "prod-10").ok).toBe(false);
  });

  it("recusa pedido não pago ou totalmente reembolsado", () => {
    for (const financialStatus of ["PENDING", "REFUNDED", null]) {
      const r = verifyPurchase([order({ financialStatus })], "order-1", "prod-10");
      expect(r).toEqual({ ok: false, message: "Pedido não está pago." });
    }
  });

  it("recusa produto que não está no pedido", () => {
    const r = verifyPurchase([order()], "order-1", "prod-99");
    expect(r).toEqual({ ok: false, message: "Produto não encontrado no pedido." });
  });
});
