import type { ShopifyProduct } from "@/lib/shopify";
import { filterCommercialProducts, isCommerciallyAvailable, isValidPrice } from "@/lib/commerce";

/** Preço numérico válido para exibição comercial (> 0, finito). */
export const isValidSearchPrice = isValidPrice;

/** Um produto é exibível na pesquisa se for comercialmente válido. */
export function isSearchableProduct(p: ShopifyProduct): boolean {
  return isCommerciallyAvailable(p);
}

/** Filtro compartilhado por todas as entradas de pesquisa do site. */
export const filterSearchableProducts = filterCommercialProducts;
