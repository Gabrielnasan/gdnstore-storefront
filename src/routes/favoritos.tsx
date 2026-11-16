import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlistStore";
import { formatBRL } from "@/lib/shopify";
import { parsePrice } from "@/lib/commerce";
import { pageHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/favoritos")({
  component: Wishlist,
  head: () =>
    pageHead(
      "/favoritos",
      "Favoritos · GDN Store",
      "Sua lista de produtos favoritos na GDN Store: salve smartphones, computadores e acessórios para comprar depois.",
    ),
});

function Wishlist() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);

  return (
    <div className="min-h-[calc(100vh-200px)] bg-surface-muted py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Heart className="w-7 h-7 text-highlight fill-highlight" /> Favoritos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length === 0 ? "Você ainda não salvou nenhum produto." : `${items.length} ${items.length === 1 ? "produto salvo" : "produtos salvos"}`}
            </p>
          </div>
          {items.length > 0 && (
            <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive transition flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Limpar lista
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-20 text-center">
            <Heart className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">Comece a salvar os produtos que você ama clicando no coração.</p>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-ink text-ink-foreground font-semibold hover:bg-highlight hover:text-highlight-foreground transition">
              <ShoppingBag className="w-4 h-4" /> Explorar a loja
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {items.map((it) => (
                <motion.li
                  key={it.handle}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-ink hover:shadow-elegant transition"
                >
                  <Link to="/product/$handle" params={{ handle: it.handle }} className="block">
                    <div className="aspect-square bg-surface-muted relative overflow-hidden">
                      {it.image ? (
                        <img src={it.image} alt={it.title} className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500" />
                      ) : null}
                      <button
                        onClick={(e) => { e.preventDefault(); remove(it.handle); }}
                        aria-label="Remover dos favoritos"
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-highlight text-ink flex items-center justify-center hover:scale-110 transition"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <div className="p-4">
                      {it.vendor && <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{it.vendor}</span>}
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem] mt-1">{it.title}</h3>
                      <div className="mt-3">
                        {parsePrice(it.price.amount) !== null ? (
                          <span className="text-lg font-bold text-ink">{formatBRL(parsePrice(it.price.amount)!, it.price.currencyCode)}</span>
                        ) : (
                          <span className="text-base font-semibold text-muted-foreground">Indisponível</span>
                        )}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:text-highlight transition">
                        Ver produto <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
