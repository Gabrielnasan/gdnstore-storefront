import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { InfoPage, InfoCard } from "@/components/InfoPage";

const PHONE_DISPLAY = "(00) 00000-0000";
const PHONE_DIGITS = "5500000000000";

export const Route = createFileRoute("/rastreamento")({
  head: () => pageHead("/rastreamento", "Rastreamento do Pedido · GDN Store", "Acompanhe o status do seu pedido na GDN Store."),
  component: Rastreamento,
});

function Rastreamento() {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <InfoPage
      title="Rastreamento do Pedido"
      subtitle="Acompanhe o status do seu pedido de forma simples."
    >
      <InfoCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-4"
        >
          <label className="block text-sm font-semibold text-foreground">
            Digite o código do pedido ou rastreio
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: GDN123456 ou BR123456789"
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-ink-foreground px-6 py-3 text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
            >
              <Search className="w-4 h-4" /> Rastrear pedido
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-lg bg-surface-muted/70 border border-border/60 p-5 text-sm text-foreground/80 leading-relaxed">
          {submitted
            ? "Em breve você poderá acompanhar seu pedido diretamente por aqui. Enquanto isso, entre em contato com nosso atendimento."
            : "Em breve você poderá acompanhar seu pedido diretamente por aqui. Enquanto isso, entre em contato com nosso atendimento."}
        </div>

        <a
          href={`https://wa.me/${PHONE_DIGITS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-highlight text-highlight-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          <MessageCircle className="w-4 h-4" /> Falar com atendimento — {PHONE_DISPLAY}
        </a>
      </InfoCard>
    </InfoPage>
  );
}
