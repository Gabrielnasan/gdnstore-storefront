import { Outlet, createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/admin")({
  head: () =>
    privateHead(
      "Painel administrativo · GDN Store",
      "Área interna da GDN Store para moderação de avaliações, perguntas de produtos e configurações da loja.",
    ),
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
