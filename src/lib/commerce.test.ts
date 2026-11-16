import { describe, it, expect } from "vitest";
import { parsePrice, commercialPrice, isCommerciallyAvailable, filterCommercialProducts } from "./commerce";
import type { ShopifyProduct } from "./shopify";

describe("parsePrice", () => {
  it("rejeita valores inválidos", () => {
    for (const v of [0, "0", 0.0, "0.00", null, undefined, "", NaN, -10, "-1"]) {
      expect(parsePrice(v)).toBeNull();
    }
  });
  it("aceita valores > 0", () => {
    expect(parsePrice("4487.99")).toBeCloseTo(4487.99);
    expect(parsePrice(10)).toBe(10);
  });
});

const product = (variants: Array<{ id?: string; amount: string }>, rangeAmount = "0.00"): ShopifyProduct =>
  ({
    node: {
      id: "gid://p",
      handle: "p",
      title: "P",
      priceRange: { minVariantPrice: { amount: rangeAmount, currencyCode: "BRL" } },
      variants: {
        edges: variants.map((v) => ({
          node: { id: v.id ?? "gid://v", price: { amount: v.amount, currencyCode: "BRL" }, availableForSale: true },
        })),
      },
    },
  }) as unknown as ShopifyProduct;

describe("commercialPrice", () => {
  it("ignora variantes zeradas e usa a menor válida", () => {
    expect(commercialPrice(product([{ amount: "0.00" }, { amount: "99.90" }]).node)).toBe(99.9);
  });
  it("retorna null quando todas as variantes são zeradas", () => {
    expect(commercialPrice(product([{ amount: "0.00" }]).node)).toBeNull();
  });
  it("nunca usa 0 como fallback", () => {
    expect(isCommerciallyAvailable(product([{ amount: "0" }], "0"))).toBe(false);
  });
});

describe("filterCommercialProducts", () => {
  it("remove produtos sem preço válido", () => {
    const list = [product([{ amount: "0.00" }]), product([{ amount: "10.00" }])];
    expect(filterCommercialProducts(list)).toHaveLength(1);
  });
});
