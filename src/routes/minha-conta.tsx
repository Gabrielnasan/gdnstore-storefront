import { Outlet, createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/minha-conta")({
  head: () =>
    privateHead(
      "Painel do cliente · GDN Store",
      "Área do cliente da GDN Store: acompanhe pedidos, gerencie seus dados pessoais, endereços, avaliações e perguntas.",
    ),
  component: MinhaContaLayout,
});

function MinhaContaLayout() {
  return <Outlet />;
}
