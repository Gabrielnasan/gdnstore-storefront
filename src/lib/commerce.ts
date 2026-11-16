import type { ShopifyProduct, ShopifyProductNode, Money } from "@/lib/shopify";

export const INSTALLMENT_FULL = "Parcele em até 12x no cartão de crédito, com juros.";
export const INSTALLMENT_SHORT = "Até 12x no cartão";
export const INSTALLMENT_BADGE = "Até 12x no cartão";

/**
 * Regra global de validade comercial (fonte única).
 * Preço válido = número finito > 0. Qualquer outro valor (0, "0.00", null,
 * undefined, vazio, NaN, negativo) significa INDISPONÍVEL — nunca R$ 0,00.
 */
export function parsePrice(amount: unknown): number | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const n =
    typeof amount === "number"
      ? amount
      : parseFloat(String(amount).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isValidPrice(amount: unknown): boolean {
  return parsePrice(amount) !== null;
}

export function isValidMoney(money?: Money | null): boolean {
  return parsePrice(money?.amount) !== null;
}

/**
 * Menor preço comercialmente válido do produto (entre as variantes com ID).
 * Sem variantes na query, usa o priceRange. Retorna null quando não existe
 * nenhum preço válido — nunca 0 como fallback.
 */
export function commercialPrice(node?: ShopifyProductNode | null): number | null {
  if (!node) return null;
  const variants = node.variants?.edges ?? [];
  const valid = variants
    .filter((v) => !!v?.node?.id)
    .map((v) => parsePrice(v.node.price?.amount))
    .filter((n): n is number => n !== null);
  if (valid.length > 0) return Math.min(...valid);
  if (variants.length > 0) return null;
  return parsePrice(node.priceRange?.minVariantPrice?.amount);
}

/** Produto pode ser apresentado como comercialmente disponível. */
export function isCommerciallyAvailable(product?: ShopifyProduct | ShopifyProductNode | null): boolean {
  if (!product) return false;
  const node = (product as ShopifyProduct).node ?? (product as ShopifyProductNode);
  return commercialPrice(node) !== null;
}

/** Filtro compartilhado por todas as vitrines/listagens do site. */
export function filterCommercialProducts(products: ShopifyProduct[] | undefined | null): ShopifyProduct[] {
  return (products ?? []).filter(
    (p) => !!p?.node && !/example product/i.test(p.node.title ?? "") && isCommerciallyAvailable(p),
  );
}
