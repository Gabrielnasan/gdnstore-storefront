import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { fetchProducts } from "@/lib/shopify";
import { findBrand, BRANDS } from "@/lib/brands";
import { ProductCard } from "@/components/ProductCard";
import { isCommerciallyAvailable } from "@/lib/commerce";

export const brandQuery = (handle: string, query: string) =>
  queryOptions({
    queryKey: ["brand", handle],
    queryFn: () => fetchProducts(60, query),
    staleTime: 60_000,
  });

export function BrandView({ handle }: { handle: string }) {
  const brand = findBrand(handle)!;
  const { data: products } = useSuspenseQuery(brandQuery(brand.handle, brand.query));
  const list = products.filter((p) => !/example product/i.test(p.node.title)).filter((p) => isCommerciallyAvailable(p));

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 pt-6">
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-ink">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{brand.label}</span>
        </nav>
      </div>

      <header className="container mx-auto px-4 pt-8 pb-6 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">{brand.label}</h1>
          {brand.description && (
            <p className="text-foreground/90 mt-3 max-w-2xl mx-auto text-base md:text-lg">{brand.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            {list.length} {list.length === 1 ? "produto disponível" : "produtos disponíveis"}
          </p>
        </motion.div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        {list.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-2xl max-w-2xl mx-auto">
            <p className="font-display text-xl font-semibold text-foreground">
              Em breve novos produtos da marca {brand.label} estarão disponíveis.
            </p>
            <p className="text-sm text-muted-foreground mt-2">Enquanto isso, explore as demais marcas e categorias da loja.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {list.map((p, i) => (<ProductCard key={p.node.id} product={p} index={i} />))}
          </div>
        )}

        <div className="mt-14 pt-8 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">Outras marcas</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {BRANDS.filter((b) => b.handle !== brand.handle).map((b) => (
              <Link
                key={b.handle}
                to="/marca/$handle"
                params={{ handle: b.handle }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
