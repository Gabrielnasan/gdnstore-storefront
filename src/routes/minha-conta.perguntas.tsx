import { privateHead } from "@/lib/pageMeta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleQuestion } from "lucide-react";

export const Route = createFileRoute("/minha-conta/perguntas")({
  component: MinhasPerguntasPage,
  head: () =>
    privateHead(
      "Minhas perguntas · GDN Store",
      "Acompanhe as perguntas que você enviou nos produtos da GDN Store.",
    ),
});

function MinhasPerguntasPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-5">
      <div className="w-14 h-14 rounded-full bg-highlight mx-auto flex items-center justify-center">
        <MessageCircleQuestion className="w-6 h-6 text-highlight-foreground" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold">Minhas perguntas</h1>
      <p className="text-muted-foreground">
        Aqui você acompanhará as perguntas enviadas nos produtos.
      </p>
      <Link
        to="/minha-conta"
        className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
      >
        Voltar para Minha Conta
      </Link>
    </div>
  );
}
