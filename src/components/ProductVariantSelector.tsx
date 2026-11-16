import { Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts, type ShopifyProductNode } from "@/lib/shopify";
import {
  buildProductFamily,
  getFamilyKey,
  isCommerciallyValidMember,
  parseProductTitle,
  resolveMember,
  resolveStatus,
  type AttributeKey,
  type ProductFamily,
} from "@/lib/productFamily";


interface Props {
  product: ShopifyProductNode;
}

/**
 * Busca candidatos a membros da família na Storefront API.
 * A query é derivada dinamicamente do modelo + vendor, então novos produtos
 * publicados na Shopify aparecem automaticamente na próxima revalidação —
 * sem lista estática, sem snapshot do catálogo e sem novo deploy.
 */
const familyCandidatesQuery = (vendor: string, modelTokens: string[]) =>
  queryOptions({
    queryKey: ["product-family-candidates", vendor, modelTokens.join(" ")],
    queryFn: async () => {
      const titleTerms = modelTokens
        .filter((w) => w.length > 0)
        .map((w) => `title:${w}`)
        .join(" ");
      const q = [titleTerms, vendor ? `vendor:${JSON.stringify(vendor)}` : ""]
        .filter(Boolean)
        .join(" ");
      const list = await fetchProducts(100, q);
      return list.map((p) => p.node);
    },
    // Cache curto apenas para desempenho: a próxima revalidação consulta a
    // Shopify novamente (preço, estoque e novos produtos).
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    enabled: modelTokens.length > 0,
  });

export function ProductVariantSelector({ product }: Props) {
  const parsed = useMemo(() => parseProductTitle(product.title, product.vendor), [product.title, product.vendor]);
  const familyKey = useMemo(() => getFamilyKey(product), [product]);

  const { data: candidates = [] } = useQuery(
    familyCandidatesQuery(product.vendor || "", parsed.modelTokens),
  );

  const family = useMemo(
    () => buildProductFamily(product, candidates),
    // familyKey participa para invalidar quando muda de produto
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, candidates, familyKey],
  );

  if (!family) return null;

  return (
    <div className="mt-6 space-y-4">
      {family.dimensions.map((dimension) => (
        <DimensionRow key={dimension.key} family={family} dimensionKey={dimension.key} />
      ))}
    </div>
  );
}

function DimensionRow({ family, dimensionKey }: { family: ProductFamily; dimensionKey: AttributeKey }) {
  const dimension = family.dimensions.find((d) => d.key === dimensionKey)!;
  const selected = family.selection[dimensionKey];

  return (
    <div>
      <span className="text-sm font-semibold mb-2 block">
        {dimension.label}: <span className="text-muted-foreground font-normal">{selected}</span>
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={dimension.label}>
        {dimension.values.map((value) => {
          const active = value === selected;
          // Combinação candidata: mantém as demais dimensões e troca só esta.
          const candidateSelection = { ...family.selection, [dimensionKey]: value };
          const member = resolveMember(family, candidateSelection);
          const status = resolveStatus(family, candidateSelection);
          // MISSING e INVALID são igualmente "indisponível" para o cliente.
          const unavailable = status === "MISSING" || status === "INVALID";
          const soldOut = status === "SOLD_OUT";

          const base =
            "px-4 py-2 rounded-lg text-sm font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";
          const cls = active
            ? `${base} bg-ink text-ink-foreground border-ink`
            : unavailable
              ? `${base} bg-card border-border text-muted-foreground/60 opacity-50 cursor-not-allowed line-through`
              : soldOut
                ? `${base} bg-card border-dashed border-border text-muted-foreground hover:border-ink`
                : `${base} bg-card border-border hover:border-ink`;

          const label = soldOut ? `${value} — Esgotado` : unavailable ? `${value} — Indisponível` : value;

          if (active) {
            return (
              <span key={value} className={cls} aria-current="true">
                {label}
              </span>
            );
          }

          // Só geramos link quando existe um membro Shopify real e
          // comercialmente válido (preço > 0 e variante com ID).
          if (unavailable || !member || !isCommerciallyValidMember(member)) {
            return (
              <span
                key={value}
                className={cls}
                aria-disabled="true"
                title="Configuração indisponível"
              >
                {label}
              </span>
            );
          }

          return (
            <Link
              key={value}
              to="/product/$handle"
              params={{ handle: member.handle }}
              preload="intent"
              className={cls}
              aria-label={`${dimension.label}: ${label}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

