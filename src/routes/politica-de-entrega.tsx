import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { InfoPage, InfoCard, InfoSection } from "@/components/InfoPage";

export const Route = createFileRoute("/politica-de-entrega")({
  head: () => pageHead("/politica-de-entrega", "Política de Entrega · GDN Store", "Saiba como funcionam os envios e prazos de entrega da GDN Store."),
  component: Entrega,
});

function Entrega() {
  return (
    <InfoPage
      title="Política de Entrega"
      subtitle="Saiba como funciona o processo de envio e acompanhamento dos pedidos realizados na GDN Store."
    >
      <InfoCard className="space-y-8">
        <InfoSection title="Envio dos pedidos">
          <p>
            Após a confirmação do pagamento, nossa equipe inicia a separação e conferência dos produtos para garantir que tudo seja enviado corretamente. Os pedidos são preparados e postados em até 7 dias úteis, podendo ocorrer antes desse prazo dependendo da disponibilidade operacional.
          </p>
          <p>
            Todos os envios são realizados com código de rastreamento para que você possa acompanhar cada etapa da entrega.
          </p>
        </InfoSection>

        <InfoSection title="Prazos de entrega">
          <p>
            O prazo de entrega varia de acordo com o endereço informado e a modalidade de envio selecionada no checkout. A previsão estimada é apresentada antes da finalização da compra e passa a contar após a postagem do pedido.
          </p>
        </InfoSection>

        <InfoSection title="Rastreamento">
          <p>
            Assim que o pedido for enviado, o código de rastreamento será disponibilizado para acompanhamento da entrega. Caso tenha qualquer dúvida sobre o status do seu pedido, nossa equipe está disponível para ajudar através do WhatsApp.
          </p>
        </InfoSection>

        <InfoSection title="Frete">
          <p>
            O valor do frete é calculado automaticamente no checkout com base no CEP informado, nas dimensões do produto e na modalidade de envio escolhida.
          </p>
        </InfoSection>

        <InfoSection title="Possíveis atrasos">
          <p>
            Embora trabalhemos para que todas as entregas ocorram dentro do prazo previsto, fatores externos como períodos de alta demanda, feriados, condições climáticas, greves ou ocorrências operacionais das transportadoras podem ocasionar atrasos.
          </p>
          <p>
            Nessas situações, nossa equipe acompanha o andamento do pedido e permanece disponível para prestar suporte e fornecer atualizações sempre que necessário.
          </p>
        </InfoSection>

        <InfoSection title="Compromisso da GDN Store">
          <p>
            Nosso objetivo é oferecer uma experiência de compra segura e transparente. Desde a confirmação do pedido até a entrega, buscamos manter você informado sobre cada etapa do processo para que sua compra aconteça com tranquilidade e confiança.
          </p>
        </InfoSection>
      </InfoCard>
    </InfoPage>
  );
}
