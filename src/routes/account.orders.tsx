import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/pageMeta";
import { useEffect } from "react";

const SHOPIFY_ORDERS_URL = "https://account.gdnstore.com.br/orders";

export const Route = createFileRoute("/account/orders")({
  component: OrdersRedirect,
  head: () =>
    privateHead(
      "Meus pedidos · GDN Store",
      "Acompanhe os pedidos da sua conta GDN Store: status, notas fiscais e histórico de compras.",
    ),
});

function OrdersRedirect() {
  useEffect(() => {
    window.location.replace(SHOPIFY_ORDERS_URL);
  }, []);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl font-bold mb-2">Redirecionando…</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Estamos te levando para a área de pedidos da GDN Store.
        </p>
        <a
          href={SHOPIFY_ORDERS_URL}
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-ink text-ink-foreground font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
        >
          Ir para meus pedidos
        </a>
      </div>
    </div>
  );
}
