import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { InfoPage, InfoCard, InfoSection } from "@/components/InfoPage";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => pageHead("/termos-de-uso", "Termos de Uso · GDN Store", "Conheça as condições gerais para utilização do site e dos serviços oferecidos pela GDN Store, incluindo cadastro, pedidos, pagamentos, entregas, trocas e garantia."),
  component: Termos,
});

function Termos() {
  return (
    <InfoPage
      title="Termos de Uso"
      subtitle="Conheça as condições gerais para utilização do site e dos serviços oferecidos pela GDN Store."
    >
      <InfoCard className="space-y-8">
        <InfoSection title="Bem-vindo à GDN Store">
          <p>
            Estes Termos de Uso regulam o acesso e a utilização do site gdnstore.com.br, incluindo navegação, cadastro, consulta de produtos, realização de pedidos, pagamentos, atendimento, trocas, devoluções, garantia e demais serviços oferecidos pela GDN Store.
          </p>
          <p className="mt-4">
            Ao acessar o site, criar uma conta, adicionar produtos ao carrinho, realizar uma compra ou utilizar qualquer funcionalidade da loja, você declara que leu, compreendeu e concorda com estes Termos de Uso, bem como com nossa Política de Privacidade, Política de Trocas e Devoluções, Política de Garantia e demais condições informadas no site.
          </p>
          <p className="mt-4">
            Caso não concorde com alguma condição, recomendamos que não utilize o site ou finalize pedidos antes de entrar em contato com nossa equipe de atendimento.
          </p>
        </InfoSection>

        <InfoSection title="1. Sobre a GDN Store">
          <p>
            A GDN Store é uma loja de tecnologia com produtos selecionados, condições especiais de pagamento, experiência de compra segura e envio para todo o Brasil.
          </p>
          <p className="mt-4">
            Trabalhamos com categorias como smartphones, computadores, tablets, games, áudio, câmeras, drones, smartwatches e acessórios, buscando oferecer produtos de qualidade, atendimento próximo e suporte antes e depois da compra.
          </p>
          <ul className="list-none pl-0 space-y-1 mt-4">
            <li><strong>GDN Store</strong></li>
            <li><strong>Site:</strong> gdnstore.com.br</li>
            <li><strong>CNPJ:</strong> 00.000.000/0001-00</li>
            <li><strong>Endereço:</strong> Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil</li>
            <li><strong>WhatsApp:</strong> (00) 00000-0000</li>
            <li><strong>Instagram:</strong> @gdnsolucoes</li>
          </ul>
        </InfoSection>

        <InfoSection title="2. Uso do site">
          <p>
            O cliente se compromete a utilizar o site da GDN Store de forma ética, segura e de acordo com a legislação brasileira.
          </p>
          <p className="mt-4">
            <strong>Não é permitido utilizar o site para:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Praticar fraudes, tentativas de golpe ou compras com dados de terceiros sem autorização</li>
            <li>Inserir informações falsas, incompletas ou enganosas</li>
            <li>Tentar acessar áreas restritas, sistemas internos ou dados de outros usuários</li>
            <li>Copiar, reproduzir ou explorar indevidamente textos, imagens, layout ou identidade da loja</li>
            <li>Utilizar robôs, scripts, automações ou qualquer tecnologia que prejudique o funcionamento do site</li>
            <li>Praticar atos que possam comprometer a segurança, disponibilidade ou integridade da loja</li>
          </ul>
          <p className="mt-4">
            A GDN Store poderá bloquear, cancelar ou restringir acessos e pedidos quando identificar uso indevido, suspeita de fraude, inconsistência cadastral, risco operacional ou violação destes Termos.
          </p>
        </InfoSection>

        <InfoSection title="3. Cadastro e informações do cliente">
          <p>
            Para realizar compras ou acessar determinadas funcionalidades, o cliente poderá precisar informar dados como nome, e-mail, telefone, endereço, CPF/CNPJ e informações necessárias para pagamento, emissão fiscal, entrega e atendimento.
          </p>
          <p className="mt-4">
            O cliente é responsável por fornecer informações verdadeiras, completas e atualizadas.
          </p>
          <p className="mt-4">
            A GDN Store não se responsabiliza por atrasos, falhas de entrega, impossibilidade de contato ou problemas decorrentes de dados incorretos fornecidos pelo cliente.
          </p>
          <p className="mt-4">
            O tratamento de dados pessoais será realizado conforme a Política de Privacidade da GDN Store e a Lei Geral de Proteção de Dados Pessoais. A LGPD prevê direitos ao titular dos dados, como acesso, correção, eliminação, informação sobre compartilhamento e revogação de consentimento, quando aplicável.
          </p>
        </InfoSection>

        <InfoSection title="4. Produtos, descrições e disponibilidade">
          <p>
            A GDN Store busca apresentar informações claras sobre os produtos, incluindo nome, marca, especificações, imagens, preço, formas de pagamento, disponibilidade e condições comerciais.
          </p>
          <p className="mt-4">
            Apesar do cuidado na atualização do site, podem ocorrer erros de digitação, divergência de imagem, indisponibilidade de estoque, alteração de preço, descrição incorreta ou falha técnica.
          </p>
          <p className="mt-4">
            As imagens dos produtos são ilustrativas e podem apresentar pequenas diferenças em relação ao item real, especialmente em tonalidade, proporção, acabamento, embalagem, versão, região, acessórios ou características específicas do fabricante.
          </p>
          <p className="mt-4">
            A disponibilidade dos produtos pode variar sem aviso prévio. Produtos marcados como indisponíveis não estão disponíveis para compra naquele momento.
          </p>
        </InfoSection>

        <InfoSection title="5. Preços e condições de pagamento">
          <p>
            Os preços, promoções e condições de pagamento exibidos no site podem variar conforme produto, disponibilidade, campanha, forma de pagamento, parcelamento, gateway de pagamento e condições comerciais vigentes.
          </p>
          <p className="mt-4">
            A GDN Store poderá oferecer pagamento via Pix, cartão de crédito, intermediadores de pagamento ou outros métodos habilitados no checkout.
          </p>
          <p className="mt-4">
            O site informa condições como pagamento facilitado, checkout seguro, pagamentos criptografados e ambiente protegido por SSL.
          </p>
          <p className="mt-4">
            Pedidos realizados com cartão de crédito ou outros meios de pagamento podem passar por análise de segurança, validação cadastral, confirmação de pagamento e verificação antifraude.
          </p>
          <p className="mt-4">
            A compra somente será considerada confirmada após aprovação do pagamento e validação do pedido.
          </p>
          <p className="mt-4">
            Em caso de erro evidente de preço, falha técnica, inconsistência de estoque, divergência relevante ou suspeita de fraude, a GDN Store poderá entrar em contato com o cliente para correção, cancelamento do pedido ou reembolso integral dos valores pagos.
          </p>
        </InfoSection>

        <InfoSection title="6. Pedidos e confirmação da compra">
          <p>
            Após a finalização da compra, o cliente poderá receber informações sobre o pedido por e-mail, WhatsApp, área do cliente ou outros canais disponíveis.
          </p>
          <p className="mt-4">
            A confirmação automática de recebimento do pedido não significa aprovação final da compra. O pedido poderá depender de aprovação de pagamento, validação de dados, disponibilidade do produto, conferência logística e análise de segurança.
          </p>
          <p className="mt-4">
            <strong>A GDN Store poderá cancelar pedidos quando houver:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Pagamento não aprovado</li>
            <li>Dados cadastrais incorretos ou inconsistentes</li>
            <li>Suspeita de fraude ou uso indevido de dados</li>
            <li>Indisponibilidade do produto</li>
            <li>Erro evidente de preço ou descrição</li>
            <li>Impossibilidade de entrega no endereço informado</li>
            <li>Solicitação do próprio cliente</li>
            <li>Descumprimento destes Termos de Uso</li>
          </ul>
          <p className="mt-4">
            Em caso de cancelamento após pagamento aprovado, o reembolso será realizado conforme a forma de pagamento utilizada e os prazos operacionais do banco, cartão, gateway ou intermediador responsável.
          </p>
        </InfoSection>

        <InfoSection title="7. Entrega e frete">
          <p>
            A GDN Store realiza envio para todo o Brasil, conforme disponibilidade logística, endereço informado pelo cliente, modalidade de entrega e condições apresentadas no site.
          </p>
          <p className="mt-4">
            O prazo de entrega pode variar de acordo com o produto, região, transportadora, forma de envio, confirmação do pagamento e eventuais fatores externos.
          </p>
          <p className="mt-4">
            O valor do frete é calculado no checkout, com base no CEP informado, nas dimensões do produto e na modalidade de envio escolhida.
          </p>
          <p className="mt-4">
            O cliente é responsável por informar corretamente o endereço de entrega, incluindo rua, número, complemento, bairro, cidade, estado, CEP e ponto de referência, quando necessário.
          </p>
          <p className="mt-4">
            A GDN Store não se responsabiliza por atrasos ou falhas decorrentes de endereço incorreto, destinatário ausente, restrição de entrega na região, eventos climáticos, greves, força maior, retenções fiscais, bloqueios logísticos ou situações fora do controle razoável da loja.
          </p>
        </InfoSection>

        <InfoSection title="8. Recebimento do produto">
          <p>
            No momento do recebimento, recomendamos que o cliente verifique a embalagem, lacres, integridade externa, dados do destinatário e possíveis sinais de avaria.
          </p>
          <p className="mt-4">
            Caso a embalagem esteja violada, amassada, molhada, danificada ou incompatível com o pedido, o cliente deve registrar fotos ou vídeos e entrar em contato com a GDN Store assim que possível.
          </p>
          <p className="mt-4">
            Quando aplicável, recomenda-se registrar a abertura do pacote em vídeo, especialmente para produtos de alto valor. Esse cuidado ajuda a proteger o cliente e a loja em caso de divergência, ausência de acessórios, avaria no transporte ou item incorreto.
          </p>
        </InfoSection>

        <InfoSection title="9. Trocas, devoluções e direito de arrependimento">
          <p>
            As solicitações de troca ou devolução devem seguir a Política de Trocas e Devoluções da GDN Store.
          </p>
          <p className="mt-4">
            Para compras realizadas pela internet, o consumidor pode exercer o direito de arrependimento no prazo de 7 dias a contar do recebimento do produto, conforme previsto no Código de Defesa do Consumidor para compras fora do estabelecimento comercial.
          </p>
          <p className="mt-4">
            O produto deverá ser devolvido preferencialmente em sua embalagem original, acompanhado de acessórios, manuais, cabos, itens recebidos e nota fiscal ou comprovante de compra, conforme orientações do atendimento.
          </p>
          <p className="mt-4">
            Casos de defeito, vício, avaria, item incorreto ou ausência de acessórios serão analisados conforme a Política de Trocas e Devoluções, Política de Garantia e legislação aplicável.
          </p>
        </InfoSection>

        <InfoSection title="10. Garantia">
          <p>
            Os produtos comercializados pela GDN Store contam com garantia legal conforme a legislação brasileira e, quando aplicável, garantia do fabricante, fornecedor ou garantia comercial informada pela loja.
          </p>
          <p className="mt-4">
            A garantia cobre defeitos de fabricação ou falhas de funcionamento que impeçam o uso normal do produto, respeitadas as condições específicas de cada item.
          </p>
          <p className="mt-4">
            A garantia poderá não ser aplicada quando forem identificados danos decorrentes de mau uso, queda, impacto, contato com líquidos, oxidação, violação de lacres, tentativa de reparo por terceiros, alteração de software, uso de acessórios incompatíveis ou descumprimento das orientações do fabricante.
          </p>
          <p className="mt-4">
            As solicitações devem seguir a Política de Garantia da GDN Store.
          </p>
        </InfoSection>

        <InfoSection title="11. Atendimento ao cliente">
          <p>
            A GDN Store oferece atendimento para dúvidas sobre produtos, pedidos, pagamentos, entrega, garantia, trocas, devoluções e suporte pós-venda.
          </p>
          <p className="mt-4">
            <strong>Canais oficiais:</strong>
          </p>
          <ul className="list-none pl-0 space-y-1 mt-2">
            <li><strong>WhatsApp:</strong> (00) 00000-0000</li>
            <li><strong>Instagram:</strong> @gdnsolucoes</li>
          </ul>
          <p className="mt-4">
            <strong>Horário de atendimento informado no site:</strong>
          </p>
          <ul className="list-none pl-0 space-y-1 mt-2">
            <li>Segunda a sexta-feira: 08:00 às 18:00</li>
            <li>Sábado: 08:00 às 12:00</li>
            <li>Domingo: fechado</li>
          </ul>
          <p className="mt-4">
            Mensagens enviadas fora do horário comercial poderão ser respondidas no próximo período de atendimento.
          </p>
        </InfoSection>

        <InfoSection title="12. Segurança da compra">
          <p>
            A GDN Store utiliza ferramentas e plataformas voltadas à segurança da navegação, do checkout e dos pagamentos.
          </p>
          <p className="mt-4">
            O site informa compra segura, pagamentos criptografados, ambiente SSL protegido, dados do cliente protegidos e Shopify Secure Checkout.
          </p>
          <p className="mt-4">
            Apesar dos cuidados adotados, nenhum sistema digital é totalmente livre de riscos. O cliente também deve adotar medidas de segurança, como conferir o domínio oficial, evitar links suspeitos, não compartilhar códigos de acesso e utilizar apenas os canais oficiais da GDN Store.
          </p>
          <p className="mt-4">
            A GDN Store não solicita senhas, códigos de cartão, tokens bancários ou dados sensíveis fora dos ambientes seguros de pagamento.
          </p>
        </InfoSection>

        <InfoSection title="13. Propriedade intelectual">
          <p>
            Todo o conteúdo disponível no site da GDN Store, incluindo textos, imagens, identidade visual, layout, botões, banners, descrições, organização das páginas, elementos gráficos e estrutura de navegação, pertence à GDN Store ou é utilizado mediante autorização/licença de terceiros.
          </p>
          <p className="mt-4">
            É proibido copiar, reproduzir, modificar, distribuir, vender, explorar comercialmente ou utilizar qualquer conteúdo do site sem autorização prévia e expressa da GDN Store.
          </p>
          <p className="mt-4">
            Marcas, nomes, logotipos e imagens de fabricantes pertencem aos seus respectivos titulares e são utilizados apenas para identificação dos produtos comercializados.
          </p>
        </InfoSection>

        <InfoSection title="14. Links externos e plataformas de terceiros">
          <p>
            O site da GDN Store pode conter links para plataformas externas, como redes sociais, WhatsApp, gateways de pagamento, rastreamento, marketplaces ou sistemas de terceiros.
          </p>
          <p className="mt-4">
            A GDN Store também informa que seus produtos podem ser encontrados em marketplaces do Brasil.
          </p>
          <p className="mt-4">
            Ao acessar ambientes externos, o cliente estará sujeito aos termos de uso, políticas de privacidade e regras próprias dessas plataformas.
          </p>
          <p className="mt-4">
            A GDN Store não se responsabiliza por conteúdo, funcionamento, segurança, políticas ou práticas de terceiros fora do domínio oficial da loja.
          </p>
        </InfoSection>

        <InfoSection title="15. Comunicações da loja">
          <p>
            A GDN Store poderá enviar comunicações relacionadas a pedidos, pagamentos, entregas, suporte, garantia, trocas, devoluções, segurança da conta, ofertas, novidades e campanhas comerciais.
          </p>
          <p className="mt-4">
            Mensagens transacionais sobre compras e atendimento podem ser enviadas mesmo que o cliente não aceite comunicações promocionais.
          </p>
          <p className="mt-4">
            O cliente pode solicitar a interrupção de comunicações promocionais pelos canais oficiais de atendimento ou pelos mecanismos de descadastro disponíveis.
          </p>
        </InfoSection>

        <InfoSection title="16. Conduta do cliente no atendimento">
          <p>
            A GDN Store busca manter atendimento respeitoso, profissional e transparente.
          </p>
          <p className="mt-4">
            O cliente também se compromete a manter comunicação respeitosa com a equipe da loja.
          </p>
          <p className="mt-4">
            A GDN Store poderá encerrar ou limitar atendimentos que envolvam ofensas, ameaças, fraude, má-fé, envio repetitivo de mensagens abusivas ou tentativa de obter vantagem indevida.
          </p>
          <p className="mt-4">
            Essa limitação não impede o cliente de exercer seus direitos legais por canais adequados.
          </p>
        </InfoSection>

        <InfoSection title="17. Limitação de responsabilidade">
          <p>
            A GDN Store não será responsável por danos ou prejuízos decorrentes de:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Uso inadequado do site ou dos produtos</li>
            <li>Informações incorretas fornecidas pelo cliente</li>
            <li>Indisponibilidade temporária do site por manutenção, falha técnica ou instabilidade</li>
            <li>Atrasos causados por terceiros, transportadoras, bancos ou gateways de pagamento</li>
            <li>Eventos de força maior, caso fortuito, greves, desastres naturais ou restrições externas</li>
            <li>Acesso a links, páginas ou plataformas de terceiros</li>
            <li>Uso de produtos em desacordo com orientações do fabricante</li>
          </ul>
          <p className="mt-4">
            Nada nestes Termos de Uso limita ou exclui direitos garantidos ao consumidor pela legislação brasileira.
          </p>
        </InfoSection>

        <InfoSection title="18. Alterações nos Termos de Uso">
          <p>
            A GDN Store poderá atualizar estes Termos de Uso a qualquer momento para refletir mudanças no site, nos serviços, nas formas de pagamento, nas políticas internas, nas ferramentas utilizadas ou na legislação aplicável.
          </p>
          <p className="mt-4">
            A versão mais recente estará sempre disponível nesta página.
          </p>
          <p className="mt-4">
            O uso contínuo do site após a atualização dos Termos representa ciência e concordância com a nova versão.
          </p>
        </InfoSection>

        <InfoSection title="19. Legislação aplicável">
          <p>
            Estes Termos de Uso são regidos pela legislação brasileira, especialmente pelas normas aplicáveis ao comércio eletrônico, relações de consumo, proteção de dados pessoais e uso da internet no Brasil.
          </p>
          <p className="mt-4">
            O Marco Civil da Internet estabelece princípios, garantias, direitos e deveres para o uso da internet no Brasil.
          </p>
          <p className="mt-4">
            Eventuais conflitos deverão ser resolvidos preferencialmente por meio de contato direto com a GDN Store, buscando uma solução amigável, rápida e transparente.
          </p>
          <p className="mt-4">
            Quando não houver solução amigável, serão observadas as regras de competência previstas na legislação brasileira, especialmente as normas de proteção ao consumidor.
          </p>
        </InfoSection>

        <InfoSection title="20. Atendimento GDN Store">
          <p>
            Em caso de dúvidas sobre estes Termos de Uso, compras, pagamentos, entrega, garantia, trocas, devoluções ou segurança da conta, entre em contato com nossa equipe.
          </p>
          <ul className="list-none pl-0 space-y-1 mt-4">
            <li><strong>WhatsApp:</strong> (00) 00000-0000</li>
            <li><strong>Instagram:</strong> @gdnsolucoes</li>
            <li><strong>Endereço:</strong> Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil</li>
            <li><strong>CNPJ:</strong> 00.000.000/0001-00</li>
          </ul>
          <p className="mt-4">
            A GDN Store se compromete a manter uma relação transparente com seus clientes, oferecendo informações claras, atendimento próximo e uma experiência de compra segura.
          </p>
        </InfoSection>
      </InfoCard>
    </InfoPage>
  );
}
