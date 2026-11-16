import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { InfoPage, InfoCard, InfoSection } from "@/components/InfoPage";

export const Route = createFileRoute("/garantia")({
  head: () => pageHead("/garantia", "Garantia · GDN Store", "Saiba como funciona a garantia dos produtos adquiridos na GDN Store."),
  component: Garantia,
});

function Garantia() {
  return (
    <InfoPage
      title="Garantia GDN Store"
      subtitle="Na GDN Store, cada compra é tratada com responsabilidade, transparência e suporte próximo ao cliente. Trabalhamos com produtos de tecnologia selecionados e buscamos oferecer uma experiência segura antes, durante e depois da entrega."
    >
      <InfoCard className="space-y-8">
        <p className="text-foreground/85 leading-relaxed">
          Todos os produtos comercializados em nossa loja contam com garantia conforme a legislação brasileira, além da garantia do fabricante, fornecedor ou garantia comercial da GDN Store quando expressamente informada na página do produto, na nota fiscal, no pedido ou em comunicação oficial da loja.
        </p>

        <p className="text-foreground/85 leading-relaxed">
          Nosso compromisso é orientar o cliente com clareza e conduzir cada solicitação de garantia de forma organizada, respeitando os prazos e condições aplicáveis.
        </p>

        <InfoSection title="1. Garantia legal">
          <p>
            Produtos eletrônicos são considerados bens duráveis. Por isso, o consumidor possui garantia legal de 90 dias para reclamar de vícios ou defeitos aparentes ou de fácil constatação, conforme as regras do Código de Defesa do Consumidor. Em caso de vício oculto, o prazo começa a ser contado a partir do momento em que o defeito se torna evidente. O CDC também prevê que a garantia contratual, quando oferecida, é complementar à garantia legal.
          </p>
          <p>
            A garantia legal cobre defeitos de fabricação, falhas de funcionamento ou problemas que impeçam o uso normal do produto, desde que não tenham sido causados por mau uso, acidentes, queda, contato com líquidos, violação de lacres, tentativa de reparo por terceiros não autorizados ou uso em desacordo com as orientações do fabricante.
          </p>
        </InfoSection>

        <InfoSection title="2. Garantia do fabricante, fornecedor ou loja">
          <p>
            Além da garantia legal, alguns produtos podem contar com garantia adicional do fabricante, fornecedor ou da própria GDN Store. O prazo e as condições dessa garantia podem variar de acordo com o produto, marca, origem, categoria e modalidade de venda.
          </p>
          <p>
            Quando houver garantia do fabricante, a GDN Store poderá orientar o cliente sobre o procedimento correto para acionamento junto à assistência autorizada, sem deixar de prestar suporte no acompanhamento da solicitação.
          </p>
          <p>
            Quando a garantia for prestada diretamente pela GDN Store ou por fornecedor parceiro, nossa equipe informará os próximos passos para análise, envio, reparo, troca ou outra solução cabível.
          </p>
        </InfoSection>

        <InfoSection title="3. Como acionar a garantia">
          <p>
            Para solicitar atendimento em garantia, entre em contato com a GDN Store pelo WhatsApp: <strong>(00) 00000-0000</strong>
          </p>
          <p>Informe os seguintes dados:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/85">
            <li>número do pedido;</li>
            <li>nome completo do comprador;</li>
            <li>produto adquirido;</li>
            <li>descrição detalhada do problema;</li>
            <li>fotos ou vídeos que demonstrem a falha, quando possível;</li>
            <li>nota fiscal ou comprovante de compra.</li>
          </ul>
          <p>
            Após o contato inicial, nossa equipe analisará as informações e orientará o procedimento adequado. Dependendo do caso, poderá ser necessário o envio do produto para análise técnica.
          </p>
        </InfoSection>

        <InfoSection title="4. Análise técnica">
          <p>
            O acionamento da garantia não significa aprovação automática da troca, reparo ou reembolso. O produto poderá passar por análise técnica para verificar a origem do problema e confirmar se a falha está coberta pela garantia.
          </p>
          <p>
            Quando constatado defeito coberto pela garantia, a GDN Store seguirá com a solução cabível, que poderá incluir reparo, substituição do produto, troca por item equivalente, abatimento proporcional do valor ou reembolso, conforme o caso e a legislação aplicável.
          </p>
          <p>
            O Código de Defesa do Consumidor prevê que, em caso de vício do produto, o fornecedor possui prazo para solucionar o problema; se a solução não ocorrer dentro do prazo legal aplicável, o consumidor poderá escolher entre substituição do produto, restituição do valor pago ou abatimento proporcional do preço.
          </p>
        </InfoSection>

        <InfoSection title="5. Situações que podem não ser cobertas pela garantia">
          <p>A garantia poderá não ser aplicada quando for identificado:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/85">
            <li>dano causado por queda, impacto, pressão excessiva ou acidente;</li>
            <li>contato com água, umidade, oxidação ou líquidos;</li>
            <li>mau uso, instalação inadequada ou uso fora das orientações do fabricante;</li>
            <li>violação de lacres, abertura indevida ou tentativa de reparo por terceiros;</li>
            <li>uso de acessórios, carregadores, cabos ou peças incompatíveis;</li>
            <li>danos estéticos causados após o recebimento, como riscos, amassados ou marcas de uso;</li>
            <li>desgaste natural de componentes, quando não houver defeito de fabricação;</li>
            <li>alteração de software, desbloqueios, modificações ou procedimentos não autorizados.</li>
          </ul>
          <p>
            Cada caso será analisado individualmente, com base nas condições do produto, nas informações fornecidas pelo cliente e nas regras aplicáveis.
          </p>
        </InfoSection>

        <InfoSection title="6. Produto recebido com avaria ou divergência">
          <p>
            Caso o produto chegue com embalagem violada, sinais de avaria no transporte, item divergente do pedido ou ausência de acessórios, recomendamos que o cliente entre em contato com a GDN Store imediatamente após o recebimento.
          </p>
          <p>
            Sempre que possível, registre fotos ou vídeos da embalagem, do produto e dos acessórios no momento da abertura. Isso ajuda nossa equipe a analisar a ocorrência com mais rapidez e segurança.
          </p>
        </InfoSection>

        <InfoSection title="7. Direito de arrependimento">
          <p>
            Para compras realizadas pela internet, o consumidor pode exercer o direito de arrependimento no prazo de 7 dias a contar do recebimento do produto, conforme previsto no Código de Defesa do Consumidor para contratações fora do estabelecimento comercial.
          </p>
          <p>
            Nesses casos, o produto deverá ser devolvido preferencialmente em sua embalagem original, acompanhado de acessórios, manuais e itens recebidos. A solicitação deve ser feita pelo nosso atendimento para que a equipe informe o procedimento correto.
          </p>
          <p>
            Para mais detalhes, consulte também a página <a href="/trocas-e-devolucoes" className="text-highlight hover:underline">Trocas e Devoluções</a>.
          </p>
        </InfoSection>

        <InfoSection title="8. Atendimento e suporte">
          <p>A GDN Store está disponível para orientar o cliente em todas as etapas do processo de garantia.</p>
          <ul className="space-y-1 text-foreground/85">
            <li>WhatsApp: (00) 00000-0000</li>
            <li>Instagram: @gdnsolucoes</li>
            <li>Endereço: Rua Exemplo, 123, Centro, Cidade/UF</li>
            <li>CNPJ: 00.000.000/0001-00</li>
          </ul>
          <p>
            Nosso objetivo é oferecer uma experiência de compra segura, transparente e compatível com produtos de alto valor, mantendo um atendimento próximo e responsável.
          </p>
        </InfoSection>
      </InfoCard>
    </InfoPage>
  );
}
