import { describe, expect, it } from "vitest";
import { getFamilyKey, parseProductTitle } from "./productFamily";

const p = (title: string, vendor = "Apple", productType = "Smartphone") => ({
  title,
  handle: title.toLowerCase().replace(/\s+/g, "-"),
  vendor,
  productType,
});

describe("parseProductTitle", () => {
  it("separa cor e armazenamento", () => {
    const r = parseProductTitle("Apple iPhone 17 Pro 256GB Laranja-cósmico", "Apple");
    expect(r.attributes.storage).toBe("256GB");
    expect(r.attributes.color).toBe("Laranja-Cósmico");
    expect(r.modelTokens).toEqual(["iphone", "17", "pro"]);
  });

  it("detecta cor de duas palavras", () => {
    const r = parseProductTitle("Apple iPhone 16 Pro Titânio Natural 512GB", "Apple");
    expect(r.attributes.color).toBe("Titânio Natural");
    expect(r.attributes.storage).toBe("512GB");
  });

  it("diferencia RAM de armazenamento", () => {
    const r = parseProductTitle("Apple MacBook Air M4 16GB 512GB", "Apple");
    expect(r.attributes.ram).toBe("16GB");
    expect(r.attributes.storage).toBe("512GB");
    expect(r.modelTokens).toEqual(["macbook", "air", "m4"]);
  });

  it("respeita marcador explícito de RAM", () => {
    const r = parseProductTitle("Notebook Dell 16GB RAM 1TB", "Dell");
    expect(r.attributes.ram).toBe("16GB");
    expect(r.attributes.storage).toBe("1TB");
  });

  it("não trata palavra de modelo como cor", () => {
    const r = parseProductTitle("Apple iPhone 17 Pro Max 256GB", "Apple");
    expect(r.attributes.color).toBeUndefined();
    expect(r.modelTokens).toEqual(["iphone", "17", "pro", "max"]);
  });
});

describe("getFamilyKey", () => {
  it("mantém iPhone 17 / Pro / Pro Max em famílias diferentes", () => {
    const a = getFamilyKey(p("Apple iPhone 17 256GB Preto"));
    const b = getFamilyKey(p("Apple iPhone 17 Pro 256GB Preto"));
    const c = getFamilyKey(p("Apple iPhone 17 Pro Max 256GB Preto"));
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it("agrupa cores/armazenamentos do mesmo modelo", () => {
    const a = getFamilyKey(p("Apple iPhone 16 128GB Preto"));
    const b = getFamilyKey(p("Apple iPhone 16 256GB Ultramarino"));
    expect(a).toBe(b);
  });

  it("separa MacBook Air M4 de MacBook Pro M4 e de M5", () => {
    const air = getFamilyKey(p("Apple MacBook Air M4 16GB 512GB", "Apple", "Notebook"));
    const pro = getFamilyKey(p("Apple MacBook Pro M4 16GB 512GB", "Apple", "Notebook"));
    const m5 = getFamilyKey(p("Apple MacBook Air M5 16GB 512GB", "Apple", "Notebook"));
    expect(new Set([air, pro, m5]).size).toBe(3);
  });

  it("agrupa MacBook Air M4 com RAM/armazenamento diferentes", () => {
    const a = getFamilyKey(p("Apple MacBook Air M4 16GB 256GB", "Apple", "Notebook"));
    const b = getFamilyKey(p("Apple MacBook Air M4 24GB 512GB", "Apple", "Notebook"));
    expect(a).toBe(b);
  });

  it("não agrupa AirPods 4 com AirPods 4 com Cancelamento Ativo de Ruído", () => {
    const a = getFamilyKey(p("Apple AirPods 4", "Apple", "Fone"));
    const b = getFamilyKey(p("Apple AirPods 4 com Cancelamento Ativo de Ruído", "Apple", "Fone"));
    expect(a).not.toBe(b);
  });

  it("não agrupa iPad Pro M4 com iPad Pro M5", () => {
    const a = getFamilyKey(p("Apple iPad Pro M4 11 256GB", "Apple", "Tablet"));
    const b = getFamilyKey(p("Apple iPad Pro M5 11 256GB", "Apple", "Tablet"));
    expect(a).not.toBe(b);
  });

  it("não agrupa vendors diferentes", () => {
    const a = getFamilyKey(p("Galaxy S26 256GB Preto", "Samsung"));
    const b = getFamilyKey(p("Galaxy S26 256GB Preto", "Xiaomi"));
    expect(a).not.toBe(b);
  });
});

/* ------------------------------------------------------------------ *
 * Validade comercial / matriz de configurações
 * ------------------------------------------------------------------ */

import {
  buildProductFamily,
  isCommerciallyValidMember,
  parseCommercialPrice,
  resolveMember,
  resolveStatus,
  toMember,
} from "./productFamily";
import type { ShopifyProductNode } from "./shopify";

function node(
  title: string,
  opts: { price?: string | null; available?: boolean; handle?: string } = {},
): ShopifyProductNode {
  const handle = opts.handle ?? title.toLowerCase().replace(/\s+/g, "-");
  const price = opts.price === undefined ? "5999.00" : opts.price;
  return {
    id: `gid://shopify/Product/${handle}`,
    title,
    description: "",
    handle,
    vendor: "Apple",
    productType: "Smartphone",
    tags: [],
    priceRange: { minVariantPrice: { amount: price ?? "0", currencyCode: "BRL" } },
    images: { edges: [] },
    options: [],
    variants: {
      edges: [
        {
          node: {
            id: `gid://shopify/ProductVariant/${handle}`,
            title: "Default Title",
            sku: `SKU-${handle}`,
            price: price === null ? (null as any) : { amount: price, currencyCode: "BRL" },
            availableForSale: opts.available ?? true,
            selectedOptions: [],
          },
        },
      ],
    },
  } as ShopifyProductNode;
}

const azul256 = node("Apple iPhone 16 Azul 256GB");
const azul128 = node("Apple iPhone 16 Azul 128GB");
const branco128 = node("Apple iPhone 16 Branco 128GB");

describe("parseCommercialPrice", () => {
  it("rejeita valores inválidos", () => {
    expect(parseCommercialPrice(null)).toBeNull();
    expect(parseCommercialPrice(undefined)).toBeNull();
    expect(parseCommercialPrice({ amount: "" })).toBeNull();
    expect(parseCommercialPrice({ amount: "0" })).toBeNull();
    expect(parseCommercialPrice({ amount: "0.00" })).toBeNull();
    expect(parseCommercialPrice({ amount: 0 })).toBeNull();
    expect(parseCommercialPrice({ amount: "abc" })).toBeNull();
    expect(parseCommercialPrice({ amount: NaN })).toBeNull();
    expect(parseCommercialPrice({ amount: -10 })).toBeNull();
    expect(parseCommercialPrice({ amount: Infinity })).toBeNull();
  });

  it("aceita preço maior que zero", () => {
    expect(parseCommercialPrice({ amount: "5999.90" })).toBe(5999.9);
  });
});

describe("status de membro", () => {
  it("1. combinação válida e disponível → AVAILABLE", () => {
    const family = buildProductFamily(azul256, [azul128, branco128])!;
    expect(resolveStatus(family, { color: "Azul", storage: "256GB" })).toBe("AVAILABLE");
  });

  it("2. combinação válida sem estoque → SOLD_OUT", () => {
    const esgotado = node("Apple iPhone 16 Azul 256GB", { available: false });
    const family = buildProductFamily(esgotado, [azul128, branco128])!;
    expect(resolveStatus(family, { color: "Azul", storage: "256GB" })).toBe("SOLD_OUT");
  });

  it("3. combinação inexistente → MISSING", () => {
    const family = buildProductFamily(azul256, [azul128, branco128])!;
    expect(resolveStatus(family, { color: "Branco", storage: "256GB" })).toBe("MISSING");
  });

  it("4/5/6/7. produto com preço zero/undefined/null/NaN → INVALID", () => {
    for (const bad of ["0.00", null, "abc", ""]) {
      const zerado = node("Apple iPhone 16 Branco 256GB", { price: bad as any });
      const family = buildProductFamily(azul256, [azul128, branco128, zerado])!;
      expect(resolveStatus(family, { color: "Branco", storage: "256GB" })).not.toBe("AVAILABLE");
      expect(toMember(zerado).status).toBe("INVALID");
      expect(isCommerciallyValidMember(toMember(zerado))).toBe(false);
    }
  });

  it("8. novo membro válido entra dinamicamente nas dimensões", () => {
    const novo = node("Apple iPhone 16 Azul 512GB");
    const family = buildProductFamily(azul256, [azul128, branco128, novo])!;
    const storage = family.dimensions.find((d) => d.key === "storage")!;
    expect(storage.values).toContain("512GB");
  });

  it("9. placeholder com preço zero não cria dimensão comercial", () => {
    const placeholder = node("Apple iPhone 16 Azul 512GB", { price: "0.00" });
    const family = buildProductFamily(azul256, [azul128, branco128, placeholder])!;
    const storage = family.dimensions.find((d) => d.key === "storage")!;
    expect(storage.values).not.toContain("512GB");
  });

  it("10. dimensão parcialmente disponível", () => {
    const azul512 = node("Apple iPhone 16 Azul 512GB");
    const family = buildProductFamily(azul256, [azul128, branco128, azul512])!;
    expect(resolveStatus(family, { color: "Azul", storage: "512GB" })).toBe("AVAILABLE");
    expect(resolveStatus(family, { color: "Branco", storage: "512GB" })).toBe("MISSING");
  });

  it("acesso direto a produto com preço zero mantém a família navegável", () => {
    const zerado = node("Apple iPhone 16 Branco 256GB", { price: "0.00" });
    const family = buildProductFamily(zerado, [azul256, azul128, branco128])!;
    expect(family.current.status).toBe("INVALID");
    expect(family.current.price).toBeNull();
    expect(resolveStatus(family, { color: "Azul", storage: "256GB" })).toBe("AVAILABLE");
  });

  it("resolveMember nunca faz fallback aproximado", () => {
    const family = buildProductFamily(azul256, [azul128, branco128])!;
    expect(resolveMember(family, { color: "Verde", storage: "1TB" })).toBeNull();
  });

  it("12. navegação entre membros troca todos os dados comerciais", () => {
    const family = buildProductFamily(azul128, [azul256, branco128])!;
    const a = resolveMember(family, { color: "Azul", storage: "128GB" })!;
    const b = resolveMember(family, { color: "Azul", storage: "256GB" })!;
    expect(a.productId).not.toBe(b.productId);
    expect(a.variantId).not.toBe(b.variantId);
    expect(a.sku).not.toBe(b.sku);
    expect(a.handle).not.toBe(b.handle);
  });
});
