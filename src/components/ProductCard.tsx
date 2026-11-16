import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { ShopifyProduct } from "@/lib/shopify";
import { formatBRL, stripVendorFromTitle, whatsappProductInquiryUrl } from "@/lib/shopify";
import { commercialPrice, INSTALLMENT_FULL, parsePrice } from "@/lib/commerce";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { track, toNumericId } from "@/lib/pixel";

interface Props { product: ShopifyProduct; index?: number }

export function ProductCard({ product, index = 0 }: Props) {
  const p = product.node;
  const image = p.images.edges[0]?.node;
  const variant = p.variants.edges[0]?.node;
  const price = commercialPrice(p);
  const hasPrice = price !== null;
  const compareAt = parsePrice(p.compareAtPriceRange?.minVariantPrice?.amount) ?? 0;
  const hasDiscount = Boolean(hasPrice && compareAt && compareAt > price!);
  const discount = hasDiscount ? Math.round(((compareAt - price!) / compareAt) * 100) : 0;

  const variantValid = !!variant?.id && parsePrice(variant.price?.amount) !== null;
  const anyAvailable =
    hasPrice && variantValid && p.variants.edges.some((v) => v.node.availableForSale);

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.has(p.handle));

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || !anyAvailable || parsePrice(variant.price?.amount) === null) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
    const contentId = toNumericId(variant.id);
    const value = parsePrice(variant.price?.amount);
    if (contentId && value !== null) {
      track("AddToCart", {
        content_ids: [contentId],
        content_type: "product",
        content_name: p.title,
        value,
        currency: "BRL",
        contents: [{ id: contentId, quantity: 1 }],
      });
    }
    toast.success("Produto adicionado ao carrinho.");
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish({
      handle: p.handle,
      title: p.title,
      image: image?.url ?? null,
      vendor: p.vendor ?? null,
      price: p.priceRange.minVariantPrice,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
      className="h-full"
    >
      <Link
        to="/product/$handle"
        params={{ handle: p.handle }}
        className="group cursor-pointer block bg-[#f5f5f5] rounded-2xl overflow-hidden border border-border hover:border-ink hover:shadow-elegant transition-all duration-300 h-full flex flex-col"
      >
        <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden flex items-center justify-center">
          {hasDiscount ? (
            <span className="absolute top-3 left-3 z-10 bg-discount text-white text-xs font-bold px-2.5 py-1 rounded-md">
              -{discount}%
            </span>
          ) : null}
          <button
            onClick={handleWish}
            aria-label={isWished ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${isWished ? "bg-highlight text-ink scale-100" : "bg-white/80 text-foreground hover:bg-highlight hover:scale-110"}`}
          >
            <Heart className={`w-4 h-4 transition-all ${isWished ? "fill-current scale-110" : ""}`} />
          </button>
          {image ? (
            <img
              src={image.url}
              alt={image.altText ?? p.title}
              loading="lazy"
              className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
          )}
        </div>


        <div className="p-4 flex flex-col gap-1.5 flex-1">
          {p.vendor ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{p.vendor}</span>
          ) : null}
          <h3 className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem] text-foreground transition-colors group-hover:text-highlight">
            {stripVendorFromTitle(p.title, p.vendor)}
          </h3>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${anyAvailable ? "text-success" : "text-muted-foreground"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${anyAvailable ? "bg-success" : "bg-muted-foreground/60"}`} />
            {anyAvailable ? "Em estoque" : "Indisponível"}
          </span>
          <div className="mt-auto pt-3 flex items-end justify-between gap-2">
            <div className="space-y-0.5 min-w-0 flex-1">
              {hasPrice ? (
                <>
                  {hasDiscount ? (
                    <span className="block text-xs text-muted-foreground line-through">{formatBRL(compareAt)}</span>
                  ) : null}
                  <span className="text-xl font-bold text-ink leading-none">{formatBRL(price!)}</span>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {INSTALLMENT_FULL}
                  </p>
                </>
              ) : (
                <span className="text-base font-semibold text-muted-foreground leading-none">Indisponível</span>
              )}
            </div>

            {anyAvailable ? (
              <button
                onClick={handleAdd}
                disabled={isLoading || !variant?.availableForSale}
                aria-label="Adicionar ao carrinho"
                className="relative shrink-0 w-10 h-10 rounded-full bg-ink text-ink-foreground flex items-center justify-center shadow-md cursor-pointer transition-all duration-300 hover:bg-highlight hover:text-highlight-foreground hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed md:opacity-0 md:group-hover:opacity-100"
              >
                <ShoppingCart className="w-4 h-4" />
                <Plus className="w-2.5 h-2.5 absolute top-1.5 right-1.5" strokeWidth={3} />
              </button>
            ) : (
              <a
                href={whatsappProductInquiryUrl({ title: p.title, handle: p.handle, vendor: p.vendor })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Consultar disponibilidade no WhatsApp"
                title="Consultar disponibilidade no WhatsApp"
                className="shrink-0 w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
