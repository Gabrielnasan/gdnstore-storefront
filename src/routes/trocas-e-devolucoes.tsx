import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { InfoPage, InfoCard, InfoSection } from "@/components/InfoPage";

export const Route = createFileRoute("/trocas-e-devolucoes")({
  head: () => pageHead("/trocas-e-devolucoes", "Política de Trocas e Devoluções · GDN Store", "Saiba como solicitar troca ou devolução de produtos comprados na GDN Store."),
  component: Trocas,
});

function Trocas() {
  return (
    <InfoPage
      title="Política de Trocas e Devoluções"
      subtitle="Na GDN Store, cada compra é tratada com responsabilidade, transparência e atenção aos detalhes. Trabalhamos com produtos de tecnologia selecionados e entendemos que, ao adquirir itens de alto valor, o cliente precisa contar com um atendimento claro, seguro e organizado também no pós-venda."
    >
      <InfoCard className="space-y-8">
        <InfoSection title="Direito de arrependimento">
          <p>
            Para compras realizadas pela internet, o cliente pode solicitar a devolução do produto em até 7 dias corridos após o recebimento, conforme o direito de arrependimento previsto para compras realizadas fora do estabelecimento comercial.
          </p>
          <p>
            Nesse caso, o cliente não precisa justificar o motivo da desistência, mas deve entrar em contato com a GDN Store dentro do prazo de 7 dias para receber as orientações de devolução.
          </p>
          <p>
            A solicitação deve ser feita pelo nosso canal oficial de atendimento:
          </p>
          <p>
            <strong>WhatsApp:</strong> (00) 00000-0000
          </p>
        </InfoSection>

        <InfoSection title="Condições para devolução por arrependimento">
          <p>
            Para devoluções por arrependimento, o produto deverá ser enviado preferencialmente em sua embalagem original, acompanhado de todos os acessórios, manuais, cabos, etiquetas, itens recebidos, nota fiscal ou comprovante de compra.
          </p>
          <p>
            A abertura da embalagem para conferência do produto não impede automaticamente a devolução. No entanto, o item deve estar em bom estado de conservação, completo e sem sinais de uso incompatíveis com a simples verificação do produto.
          </p>
          <p>
            A devolução poderá passar por análise caso sejam identificados:
          </p>
          <ul className="list-disc list-inside space-y-1 text-foreground/85">
            <li>ausência de acessórios ou itens recebidos;</li>
            <li>danos físicos no produto;</li>
            <li>marcas de queda, impacto ou pressão;</li>
            <li>contato com líquidos, umidade ou oxidação;</li>
            <li>violação indevida de lacres;</li>
            <li>alteração de componentes;</li>
            <li>uso incompatível com a solicitação de arrependimento;</li>
            <li>produto diferente do enviado originalmente.</li>
          </ul>
          <p>
            Essa análise tem como objetivo verificar as condições do produto devolvido e garantir segurança tanto para o cliente quanto para a loja.
          </p>
        </InfoSection>

        <InfoSection title="Troca por defeito ou vício do produto">
          <p>
            Caso o produto apresente defeito de fabricação, falha de funcionamento ou vício que impeça seu uso normal, o cliente deverá entrar em contato com a GDN Store para abertura de atendimento.
          </p>
          <p>
            Produtos eletrônicos são considerados bens duráveis. Por isso, o consumidor possui prazo de até 90 dias para reclamar de vícios aparentes ou de fácil constatação. Em caso de vício oculto, o prazo começa a contar a partir do momento em que o problema se torna evidente.
          </p>
          <p>
            Após o contato inicial, a GDN Store orientará o procedimento adequado, que poderá envolver análise técnica, acionamento de garantia do fabricante, suporte do fornecedor parceiro, reparo, substituição, troca por produto equivalente, abatimento proporcional ou reembolso, conforme o caso e a legislação aplicável.
          </p>
        </InfoSection>

        <InfoSection title="Como solicitar troca ou devolução">
          <p>
            Para iniciar uma solicitação, entre em contato pelo WhatsApp oficial da GDN Store:
          </p>
          <p>
            <strong>WhatsApp:</strong> (00) 00000-0000
          </p>
          <p>Informe os seguintes dados:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/85">
            <li>número do pedido;</li>
            <li>nome completo do comprador;</li>
            <li>produto adquirido;</li>
            <li>motivo da solicitação;</li>
            <li>descrição detalhada do problema, se houver;</li>
            <li>fotos ou vídeos do produto, quando necessário;</li>
            <li>foto da embalagem recebida, quando houver avaria;</li>
            <li>nota fiscal ou comprovante de compra.</li>
          </ul>
          <p>
            Após o envio das informações, nossa equipe analisará a solicitação e informará os próximos passos, incluindo forma de envio, endereço de devolução, prazo de análise e acompanhamento do atendimento.
          </p>
        </InfoSection>

        <InfoSection title="Produto recebido com avaria, item errado ou incompleto">
          <p>
            Caso o produto seja entregue com embalagem violada, sinais de avaria no transporte, item diferente do pedido ou ausência de acessórios, o cliente deve entrar em contato com a GDN Store assim que identificar o problema.
          </p>
          <p>
            Sempre que possível, recomendamos registrar fotos ou vídeos da embalagem, etiqueta de transporte, produto e acessórios no momento da abertura.
          </p>
          <p>
            Esse cuidado ajuda nossa equipe a analisar a ocorrência com mais rapidez e segurança.
          </p>
          <p>
            Quando confirmada a divergência, a GDN Store poderá oferecer, conforme o caso:
          </p>
          <ul className="list-disc list-inside space-y-1 text-foreground/85">
            <li>troca do produto;</li>
            <li>envio de item ou acessório faltante;</li>
            <li>reparo;</li>
            <li>substituição por produto equivalente;</li>
            <li>reembolso parcial;</li>
            <li>reembolso integral.</li>
          </ul>
        </InfoSection>

        <InfoSection title="Análise do produto">
          <p>
            Toda solicitação de troca, devolução ou reembolso poderá passar por análise para verificar as condições do produto, acessórios, embalagem, número de série, funcionamento e motivo da solicitação.
          </p>
          <p>
            O recebimento do produto pela GDN Store ou por parceiro autorizado não significa aprovação automática da troca, devolução ou reembolso.
          </p>
          <p>
            Quando constatado defeito coberto pela garantia ou pela legislação aplicável, a GDN Store seguirá com a solução cabível.
          </p>
          <p>
            Quando forem identificados danos causados por mau uso, queda, impacto, contato com líquidos, oxidação, violação de lacres, tentativa de reparo por terceiros, alteração de software, uso de acessórios incompatíveis ou outras situações não cobertas, a solicitação poderá não ser aprovada.
          </p>
          <p>
            Cada caso será analisado individualmente, com transparência e comunicação ao cliente.
          </p>
        </InfoSection>

        <InfoSection title="Prazo para solução em caso de defeito">
          <p>
            Quando o produto apresentar defeito coberto pela garantia ou pela legislação aplicável, a GDN Store conduzirá o atendimento de acordo com os prazos legais e operacionais necessários para análise e solução.
          </p>
          <p>
            A solução poderá envolver reparo, substituição, troca por item equivalente, abatimento proporcional ou reembolso, conforme o caso.
          </p>
          <p>
            Nosso objetivo é resolver cada solicitação de forma clara, segura e organizada, mantendo o cliente informado durante o processo.
          </p>
        </InfoSection>

        <InfoSection title="Reembolso">
          <p>
            Quando a devolução for aprovada, o reembolso será realizado de acordo com a forma de pagamento utilizada no pedido e com os prazos operacionais dos intermediadores de pagamento, bancos, cartões ou plataformas responsáveis.
          </p>
          <p>
            Para pagamentos via Pix, o reembolso poderá ser realizado na chave ou conta informada pelo cliente, após a aprovação da devolução.
          </p>
          <p>
            Para pagamentos via cartão de crédito, o estorno poderá aparecer na fatura atual ou em faturas seguintes, conforme as regras da administradora do cartão.
          </p>
          <p>
            Em caso de pagamento por intermediadores, o prazo e a forma de estorno poderão seguir as regras da plataforma utilizada no checkout.
          </p>
        </InfoSection>

        <InfoSection title="Troca por outro produto ou crédito na loja">
          <p>
            Quando aplicável, o cliente poderá optar por trocar o produto por outro item disponível na GDN Store ou receber crédito para utilizar em uma nova compra.
          </p>
          <p>
            Caso o novo produto tenha valor superior, o cliente poderá pagar a diferença.
          </p>
          <p>
            Caso o novo produto tenha valor inferior, a diferença poderá ser tratada por reembolso parcial ou crédito na loja, conforme combinado com o atendimento.
          </p>
        </InfoSection>

        <InfoSection title="Custos de envio">
          <p>
            Nas solicitações realizadas dentro do direito de arrependimento ou em casos de defeito, avaria, item incorreto ou divergência confirmada, a GDN Store orientará o cliente sobre a forma adequada de envio/devolução.
          </p>
          <p>
            O cliente deve aguardar as instruções oficiais antes de enviar o produto, para que o processo seja registrado corretamente e acompanhado pela equipe.
          </p>
          <p>
            Envios realizados sem autorização prévia, para endereço incorreto ou fora do procedimento informado pela GDN Store poderão dificultar ou atrasar a análise da solicitação.
          </p>
        </InfoSection>

        <InfoSection title="Situações que podem impedir a troca ou devolução">
          <p>
            A troca ou devolução poderá não ser aprovada quando for identificado:
          </p>
          <ul className="list-disc list-inside space-y-1 text-foreground/85">
            <li>dano causado por queda, impacto ou acidente;</li>
            <li>contato com água, líquidos, umidade ou oxidação;</li>
            <li>mau uso ou uso fora das orientações do fabricante;</li>
            <li>instalação inadequada;</li>
            <li>ausência de acessórios essenciais;</li>
            <li>violação de lacres ou abertura indevida;</li>
            <li>tentativa de reparo por terceiros;</li>
            <li>alteração de software, desbloqueios ou modificações não autorizadas;</li>
            <li>uso de carregadores, cabos ou acessórios incompatíveis;</li>
            <li>produto diferente do enviado originalmente;</li>
            <li>danos estéticos causados após o recebimento;</li>
            <li>sinais de uso incompatíveis com devolução por arrependimento.</li>
          </ul>
          <p>
            Essas situações serão avaliadas caso a caso, sempre considerando as informações fornecidas pelo cliente, as condições do produto e a legislação aplicável.
          </p>
        </InfoSection>

        <InfoSection title="Produtos lacrados, importados ou sob encomenda">
          <p>
            Produtos lacrados, importados, de alto valor ou adquiridos sob encomenda também seguem as regras desta Política e da legislação brasileira aplicável.
          </p>
          <p>
            No caso de devolução por arrependimento, o produto deverá retornar completo, com todos os itens recebidos e em condições adequadas para análise.
          </p>
          <p>
            Quando houver produtos com condições específicas de garantia, origem, disponibilidade, prazo de entrega ou suporte, essas informações poderão ser apresentadas na página do produto, no pedido, na nota fiscal ou em comunicação oficial da GDN Store.
          </p>
        </InfoSection>

        <InfoSection title="Atendimento GDN Store">
          <p>
            A GDN Store está disponível para orientação orientar o cliente em todas as etapas de troca, devolução, garantia ou reembolso.
          </p>
          <ul className="space-y-1 text-foreground/85">
            <li><strong>WhatsApp:</strong> (00) 00000-0000</li>
            <li><strong>Instagram:</strong> @gdnsolucoes</li>
            <li><strong>Endereço:</strong> Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil</li>
            <li><strong>CNPJ:</strong> 00.000.000/0001-00</li>
          </ul>
          <p>
            Nosso compromisso é oferecer um atendimento transparente, responsável e compatível com a confiança necessária para compras de tecnologia de alto valor.
          </p>
        </InfoSection>
      </InfoCard>
    </InfoPage>
  );
}
