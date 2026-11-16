import type { ShopifyProductNode } from "@/lib/shopify";
import { isProductAvailable, stripVendorFromTitle } from "@/lib/shopify";
import { isCommerciallyValidVariant } from "@/lib/productFamily";


const BASE_URL = "https://gdnstore.com.br";

function clamp(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Head metadata (title/description/social/canonical + Product JSON-LD)
 * used by the canonical /product/$handle route.
 */
export function productHead(prefix: "product" | "produto", handle: string, product?: ShopifyProductNode | null) {
  const url = `${BASE_URL}/${prefix}/${handle}`;

  if (!product) {
    return {
      meta: [{ title: "Produto · GDN Store" }, { property: "og:url", content: url }],
      links: [{ rel: "canonical", href: url }],
    };
  }

  const name = stripVendorFromTitle(product.title, product.vendor) || product.title;
  const title = `${name}${product.vendor ? ` ${product.vendor}` : ""} · GDN Store`.replace(/\s+/g, " ");
  const description = clamp(
    product.description?.trim()
      ? product.description
      : `Compre ${name} na GDN Store. Parcelamento no cartão, envio com rastreio e atendimento humano.`,
  );
  const image = product.images?.edges?.[0]?.node?.url;
  // Só publicamos oferta quando o preço é comercialmente válido (> 0).
  const validVariant =
    product.variants?.edges?.map((e) => e.node).find((v) => isCommerciallyValidVariant(v)) ?? null;
  const price = validVariant ? validVariant.price.amount : null;
  const currency = validVariant?.price.currencyCode ?? product.priceRange?.minVariantPrice?.currencyCode ?? "BRL";
  const available = !!validVariant && isProductAvailable(product);
  const sku = validVariant?.sku?.trim();


  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description,
          ...(sku ? { sku } : {}),
          ...(validVariant?.id ? { productID: validVariant.id } : {}),
          ...(product.vendor ? { brand: { "@type": "Brand", name: product.vendor } } : {}),
          ...(image ? { image: [image] } : {}),
          ...(price
            ? {
                offers: {
                  "@type": "Offer",
                  url,
                  price,
                  priceCurrency: currency,
                  availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                },
              }
            : {}),

        }),
      },
    ],
  };
}
