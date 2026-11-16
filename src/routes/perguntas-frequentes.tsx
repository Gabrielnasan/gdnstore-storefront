import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoCard } from "@/components/InfoPage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { INSTALLMENT_FULL } from "@/lib/commerce";

const BASE_URL = "https://gdnstore.com.br";
const PATH = "/perguntas-frequentes";

const faqs = [
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos os principais cartões de crédito (Visa, Mastercard, Elo, American Express), boleto bancário e PIX.",
  },
  {
    q: "A GDN Store aceita PIX?",
    a: "Sim. O pagamento via PIX é aprovado rapidamente e libera seu pedido para preparação assim que confirmado.",
  },
  {
    q: "É possível parcelar a compra?",
    a: INSTALLMENT_FULL,
  },
  {
    q: "Como funciona o frete?",
    a: "O valor e o prazo do frete são calculados no checkout com base no seu CEP.",
  },
  {
    q: "Como acompanho meu pedido?",
    a: "Após a postagem, você receberá o código de rastreio. Também é possível solicitar atualizações pelo nosso atendimento via WhatsApp.",
  },
  {
    q: "Como solicito troca ou devolução?",
    a: "Entre em contato com nosso atendimento pelo WhatsApp (00) 00000-0000 informando o número do pedido e o motivo da solicitação.",
  },
  {
    q: "Os produtos possuem garantia?",
    a: "Sim. Os produtos podem possuir garantia conforme fabricante, fornecedor ou política da loja. Confira as condições específicas com nosso atendimento.",
  },
  {
    q: "Como entro em contato com o atendimento?",
    a: "Você pode falar conosco pelo WhatsApp ou telefone (00) 00000-0000. Em breve também disponibilizaremos um e-mail institucional.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export const Route = createFileRoute("/perguntas-frequentes")({
  head: () => ({
    meta: [
      { title: "Perguntas Frequentes · GDN Store" },
      { name: "description", content: "Dúvidas sobre compras, pagamentos, entregas e atendimento na GDN Store." },
      { property: "og:title", content: "Perguntas Frequentes · GDN Store" },
      { property: "og:description", content: "Dúvidas sobre compras, pagamentos, entregas e atendimento na GDN Store." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}${PATH}` },
      { name: "twitter:title", content: "Perguntas Frequentes · GDN Store" },
      { name: "twitter:description", content: "Dúvidas sobre compras, pagamentos, entregas e atendimento na GDN Store." },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}${PATH}` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd) }],
  }),
  component: FAQ,
});
function FAQ() {
  return (
    <InfoPage
      title="Perguntas Frequentes"
      subtitle="Tire suas principais dúvidas sobre compras, pagamentos, entregas e atendimento."
    >
      <InfoCard>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold text-foreground hover:text-highlight">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/80 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </InfoCard>
    </InfoPage>
  );
}
