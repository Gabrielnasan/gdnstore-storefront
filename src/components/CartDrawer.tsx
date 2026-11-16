import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, Trash2, ExternalLink, Loader2, ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatBRL } from "@/lib/shopify";

export function CartDrawer() {
  const { items, isOpen, setOpen, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } =
    useCartStore();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "BRL";

  useEffect(() => { if (isOpen) syncCart(); }, [isOpen, syncCart]);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (url) { window.open(url, "_blank"); setOpen(false); }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="font-display text-2xl">Seu carrinho</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Vazio por enquanto" : `${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const img = item.product.node.images.edges[0]?.node;
                return (
                  <li key={item.variantId} className="flex gap-3 pb-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-surface-muted rounded-lg overflow-hidden shrink-0">
                      {img && <img src={img.url} alt={item.product.node.title} className="w-full h-full object-contain p-2" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2">{item.product.node.title}</h4>
                      {item.selectedOptions.length > 0 && item.variantTitle !== "Default Title" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.selectedOptions.map((o) => o.value).join(" · ")}
                        </p>
                      )}
                      <p className="text-sm font-bold mt-1">{formatBRL(parseFloat(item.price.amount), item.price.currencyCode)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <button
                            className="p-1.5 hover:bg-muted"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs w-7 text-center">{item.quantity}</span>
                          <button
                            className="p-1.5 hover:bg-muted"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatBRL(totalPrice, currency)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold">{formatBRL(totalPrice, currency)}</span>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={isLoading || isSyncing}
              className="w-full h-12 bg-ink text-ink-foreground hover:bg-highlight hover:text-highlight-foreground font-semibold"
            >
              {isLoading || isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Finalizar compra <ExternalLink className="w-4 h-4 ml-2" /></>
              )}
            </Button>
            <div className="pt-2 mt-1 border-t space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-highlight" />
                <span>Compra 100% segura</span>
              </div>
              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Seus dados são protegidos por criptografia SSL e checkout seguro do Shopify.
              </p>
              <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> SSL</span>
                <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Shopify Secure</span>
              </div>
              <p className="text-[11px] text-center text-muted-foreground pt-1">
                Loja verificada · Best seller no Mercado Livre, Amazon e Shopee.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
