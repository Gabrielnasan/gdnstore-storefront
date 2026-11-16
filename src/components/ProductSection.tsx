import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "./ProductCard";
import type { ShopifyProduct } from "@/lib/shopify";

interface Props {
  title: string;
  subtitle?: ReactNode;
  highlight?: ReactNode;
  eyebrow?: string;
  products: ShopifyProduct[];
}

export function ProductSection({ title, subtitle, highlight, eyebrow, products }: Props) {
  if (!products.length) return null;
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8"
      >
        <div>
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-highlight-foreground bg-highlight inline-block px-2.5 py-1 rounded-md mb-3">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl md:text-4xl font-bold text-balance">{title}</h2>
          {subtitle && <div className="text-muted-foreground mt-2">{subtitle}</div>}
          {highlight && <div className="text-muted-foreground mt-2">{highlight}</div>}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {products.map((p, i) => (
          <ProductCard key={p.node.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
