import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { InfoPage, InfoCard, InfoSection } from "@/components/InfoPage";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => pageHead("/politica-de-privacidade", "Política de Privacidade · GDN Store", "Entenda como a GDN Store coleta, utiliza, protege e trata seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD)."),
  component: Privacidade,
});

function Privacidade() {
  return (
    <InfoPage
      title="Política de Privacidade"
      subtitle="Na GDN Store, privacidade, segurança e transparência fazem parte da experiência de compra."
    >
      <InfoCard className="space-y-8">
        <InfoSection title="Introdução">
          <p>
            Sabemos que, ao comprar produtos de tecnologia de alto valor, o cliente espera não apenas bons produtos e boas condições, mas também um ambiente seguro para cadastrar seus dados, realizar pagamentos e acompanhar seus pedidos.
          </p>
          <p className="mt-4">
            Esta Política de Privacidade explica como coletamos, usamos, armazenamos, compartilhamos e protegemos os dados pessoais dos clientes e visitantes do site gdnstore.com.br, de acordo com a Lei Geral de Proteção de Dados Pessoais — LGPD, Lei nº 13.709/2018.
          </p>
          <p className="mt-4">
            Ao acessar nosso site, criar uma conta, realizar uma compra, entrar em contato pelo WhatsApp, cadastrar-se em nossa newsletter ou utilizar nossos serviços, você declara estar ciente das práticas descritas nesta Política.
          </p>
        </InfoSection>

        <InfoSection title="1. Quem somos">
          <p>
            A GDN Store é uma loja de tecnologia com produtos selecionados, pagamento facilitado e experiência de compra segura. Atuamos com produtos como smartphones, computadores, games, acessórios e outros itens de tecnologia, oferecendo atendimento, suporte e envio para todo o Brasil.
          </p>
          <ul className="list-none pl-0 space-y-1 mt-4">
            <li><strong>Site:</strong> gdnstore.com.br</li>
            <li><strong>CNPJ:</strong> 00.000.000/0001-00</li>
            <li><strong>Endereço:</strong> Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil</li>
            <li><strong>WhatsApp:</strong> (00) 00000-0000</li>
            <li><strong>Instagram:</strong> @gdnsolucoes</li>
          </ul>
          <p className="mt-4">
            Para assuntos relacionados à privacidade e proteção de dados, o cliente pode entrar em contato pelos canais oficiais de atendimento da GDN Store.
          </p>
        </InfoSection>

        <InfoSection title="2. Quais dados podemos coletar">
          <p>
            Podemos coletar dados pessoais fornecidos diretamente pelo cliente, dados gerados durante a navegação no site e dados necessários para concluir pedidos, pagamentos, entregas e atendimentos.
          </p>
          <p className="mt-4">Entre os dados que podem ser coletados estão:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Nome completo</li>
            <li>CPF ou CNPJ, quando necessário para emissão fiscal ou validação do pedido</li>
            <li>E-mail</li>
            <li>Telefone e WhatsApp</li>
            <li>Endereço de entrega e cobrança</li>
            <li>Dados do pedido e produtos adquiridos</li>
            <li>Informações de pagamento, conforme processadas por plataformas seguras</li>
            <li>Histórico de atendimento</li>
            <li>Mensagens enviadas pelo formulário, WhatsApp ou outros canais</li>
            <li>Dados de navegação, como IP, dispositivo, navegador, páginas acessadas e cookies</li>
            <li>Preferências de comunicação e marketing, quando informadas</li>
          </ul>
          <p className="mt-4">
            A GDN Store não solicita dados pessoais sensíveis, como informações de saúde, religião, opinião política, biometria ou dados semelhantes, salvo em situações excepcionais e estritamente necessárias, conforme permitido pela legislação.
          </p>
        </InfoSection>

        <InfoSection title="3. Como utilizando os dados">
          <p>
            Os dados pessoais são utilizados para permitir o funcionamento adequado da loja, realizar vendas, processar pagamentos, entregar pedidos, oferecer suporte e melhorar a experiência do cliente.
          </p>
          <p className="mt-4">Podemos utilizar os dados para:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Criar e gerenciar cadastro de cliente</li>
            <li>Processar pedidos realizados no site</li>
            <li>Confirmar pagamentos</li>
            <li>Emitir documentos fiscais, quando aplicável</li>
            <li>Organizar envio, entrega e rastreamento</li>
            <li>Entrar em contato sobre pedidos, pagamentos ou suporte</li>
            <li>Responder dúvidas enviadas pelo WhatsApp, formulário ou redes sociais</li>
            <li>Analisar solicitações de garantia, troca ou devolução</li>
            <li>Prevenir fraudes, compras suspeitas e uso indevido da loja</li>
            <li>Melhorar a navegação, layout, conteúdo e desempenho do site</li>
            <li>Enviar comunicações, novidades e ofertas, quando permitido</li>
            <li>Cumprir obrigações legais, fiscais, regulatórias e de segurança</li>
          </ul>
          <p className="mt-4 font-medium">Não vendemos dados pessoais dos clientes.</p>
        </InfoSection>

        <InfoSection title="4. Bases legais para tratamento dos dados">
          <p>
            Tratamos dados pessoais com fundamento nas bases legais previstas na LGPD, conforme a finalidade de cada uso.
          </p>
          <p className="mt-4">As principais bases utilizadas pela GDN Store são:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Execução de contrato:</strong> para processar compras, pagamentos, entregas, garantias, trocas e atendimento ao cliente.</li>
            <li><strong>Cumprimento de obrigação legal ou regulatória:</strong> para emissão de documentos fiscais, registros contábeis, obrigações tributárias e atendimento a autoridades competentes.</li>
            <li><strong>Consentimento:</strong> para envio de comunicações promocionais, newsletter ou outras ações em que a autorização do cliente seja necessária.</li>
            <li><strong>Legítimo interesse:</strong> para melhoria do site, prevenção de fraudes, segurança da loja, análise de desempenho e relacionamento com clientes, sempre respeitando os direitos e expectativas do titular.</li>
            <li><strong>Proteção ao crédito e prevenção de fraude:</strong> quando necessário para validar pedidos, reduzir riscos e proteger a GDN Store e seus clientes.</li>
          </ul>
        </InfoSection>

        <InfoSection title="5. Pagamentos e segurança financeira">
          <p>
            Os pagamentos realizados na GDN Store são processados por plataformas e intermediadores especializados, como Shopify Checkout, Appmax, Mercado Pago ou outros meios habilitados na loja.
          </p>
          <p className="mt-4">
            A GDN Store não armazena dados completos de cartão de crédito. Informações sensíveis de pagamento são tratadas diretamente pelas plataformas responsáveis, em ambiente seguro e criptografado.
          </p>
          <p className="mt-4">
            Podemos receber informações relacionadas ao status do pagamento, como aprovação, recusa, cancelamento, estorno ou identificação da transação, apenas na medida necessária para processar o pedido e prestar atendimento ao cliente.
          </p>
        </InfoSection>

        <InfoSection title="6. Compartilhamento de dados com terceiros">
          <p>
            Para operar a loja, processar compras e entregar produtos, podemos compartilhar dados pessoais com parceiros e prestadores de serviço que atuam em nome da GDN Store ou que são necessários para a conclusão da compra.
          </p>
          <p className="mt-4">Esses parceiros podem incluir:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Plataformas de e-commerce e checkout, como Shopify</li>
            <li>Intermediadores de pagamento, como Appmax, Mercado Pago ou similares</li>
            <li>Empresas de transporte, logística e rastreamento</li>
            <li>Serviços de hospedagem, segurança, armazenamento e tecnologia</li>
            <li>Ferramentas de atendimento, WhatsApp, e-mail e comunicação</li>
            <li>Ferramentas de análise, desempenho e marketing</li>
            <li>Contabilidade, assessoria fiscal, jurídica ou administrativa</li>
            <li>Autoridades públicas, quando houver obrigação legal ou solicitação válida</li>
          </ul>
          <p className="mt-4">
            O compartilhamento é realizado apenas quando necessário e de acordo com a finalidade da relação entre o cliente e a GDN Store.
          </p>
        </InfoSection>

        <InfoSection title="7. Cookies e tecnologias de navegação">
          <p>
            Utilizamos cookies e tecnologias semelhantes para melhorar a experiência do usuário, manter o funcionamento do carrinho, reconhecer preferências, analisar navegação, medir desempenho do site e apoiar ações de marketing.
          </p>
          <p className="mt-4">Os cookies podem ser:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Cookies necessários:</strong> essenciais para o funcionamento do site, carrinho, checkout e segurança.</li>
            <li><strong>Cookies de desempenho e análise:</strong> ajudam a entender como os visitantes usam o site e quais páginas precisam ser melhoradas.</li>
            <li><strong>Cookies de marketing:</strong> podem ser usados para personalizar ofertas, campanhas e anúncios, quando aplicável.</li>
            <li><strong>Cookies de preferência:</strong> armazenam escolhas do usuário, como idioma, sessão ou preferências de navegação.</li>
          </ul>
          <p className="mt-4">
            O cliente pode configurar seu navegador para bloquear ou excluir cookies. No entanto, algumas funcionalidades do site podem não funcionar corretamente caso cookies essenciais sejam desativados.
          </p>
        </InfoSection>

        <InfoSection title="8. Newsletter, ofertas e comunicações">
          <p>
            Ao cadastrar seu e-mail, telefone ou WhatsApp para receber novidades, ofertas ou cupons, o cliente autoriza a GDN Store a enviar comunicações relacionadas a produtos, promoções, lançamentos, condições especiais e conteúdos da loja.
          </p>
          <p className="mt-4">
            O cliente pode solicitar o cancelamento dessas comunicações a qualquer momento, pelo próprio link de descadastro, quando disponível, ou entrando em contato com a GDN Store pelo WhatsApp.
          </p>
          <p className="mt-4">
            Mesmo após o cancelamento de comunicações promocionais, a GDN Store ainda poderá enviar mensagens transacionais relacionadas a compras, pagamentos, entregas, garantias, trocas, devoluções ou segurança da conta.
          </p>
        </InfoSection>

        <InfoSection title="9. Armazenamento e retenção dos dados">
          <p>
            Os dados pessoais serão armazenados pelo tempo necessário para cumprir as finalidades descritas nesta Política, incluindo processamento de pedidos, suporte, garantia, prevenção de fraudes e cumprimento de obrigações legais, fiscais e regulatórias.
          </p>
          <p className="mt-4">
            Após o término da finalidade ou mediante solicitação do titular, os dados poderão ser eliminados, anonimizados ou mantidos apenas quando houver obrigação legal, necessidade de defesa em processos, cumprimento de contrato ou outra base legal aplicável.
          </p>
        </InfoSection>

        <InfoSection title="10. Segurança dos dados">
          <p>
            A GDN Store adota medidas técnicas e administrativas para proteger os dados pessoais contra acesso não autorizado, perda, alteração, divulgação indevida ou uso inadequado.
          </p>
          <p className="mt-4">
            Nosso site utiliza ambiente protegido e ferramentas de segurança compatíveis com a operação de comércio eletrônico, incluindo checkout seguro, conexão protegida e sistemas de pagamento criptografados.
          </p>
          <p className="mt-4">
            Apesar dos cuidados adotados, nenhum ambiente digital é totalmente livre de riscos. Por isso, também recomendamos que o cliente proteja seus dados de acesso, evite compartilhar códigos de login, confira links antes de clicar e utilize canais oficiais da GDN Store para atendimento.
          </p>
        </InfoSection>

        <InfoSection title="11. Transferência internacional de dados">
          <p>
            Alguns fornecedores de tecnologia, hospedagem, pagamento, análise ou segurança utilizados pela GDN Store podem armazenar ou processar dados em servidores localizados no Brasil ou no exterior.
          </p>
          <p className="mt-4">
            Quando isso ocorrer, a GDN Store buscará utilizar fornecedores que adotem padrões adequados de segurança e proteção de dados, respeitando a legislação aplicável e as finalidades descritas nesta Política.
          </p>
        </InfoSection>

        <InfoSection title="12. Direitos do titular dos dados">
          <p>
            Nos termos da LGPD, o titular dos dados pessoais pode solicitar à GDN Store, quando aplicável:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Confirmação da existência de tratamento de dados</li>
            <li>Acesso aos dados pessoais tratados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade</li>
            <li>Portabilidade dos dados, conforme regulamentação aplicável</li>
            <li>Informação sobre compartilhamento de dados com terceiros</li>
            <li>Revogação do consentimento, quando o tratamento depender de consentimento</li>
            <li>Eliminação de dados tratados com base no consentimento, quando aplicável</li>
            <li>Oposição ao tratamento, em caso de descumprimento da legislação</li>
            <li>Revisão de decisões automatizadas, quando aplicável</li>
          </ul>
          <p className="mt-4">
            Para exercer seus direitos, o cliente pode entrar em contato pelos canais oficiais da GDN Store.
          </p>
        </InfoSection>

        <InfoSection title="13. Como solicitar informações ou exclusão de dados">
          <p>
            Para solicitações relacionadas a privacidade e proteção de dados, envie uma mensagem pelo WhatsApp oficial da GDN Store:
          </p>
          <p className="mt-2"><strong>WhatsApp:</strong> (00) 00000-0000</p>
          <p className="mt-4">
            Ao receber a solicitação, poderemos pedir informações adicionais para confirmar a identidade do solicitante e garantir que os dados sejam entregues ou alterados apenas pelo próprio titular ou por representante autorizado.
          </p>
          <p className="mt-4">
            A GDN Store responderá às solicitações dentro de prazo razoável e conforme os requisitos da legislação aplicável.
          </p>
        </InfoSection>

        <InfoSection title="14. Dados de menores de idade">
          <p>
            A GDN Store não direciona seus produtos, comunicações ou campanhas especificamente a crianças. Caso uma compra seja realizada por menor de idade, recomendamos que seja feita com acompanhamento e autorização dos pais ou responsáveis legais.
          </p>
          <p className="mt-4">
            Se identificarmos tratamento inadequado de dados de menores, poderemos adotar medidas para excluir, bloquear ou limitar o uso dessas informações, conforme a legislação aplicável.
          </p>
        </InfoSection>

        <InfoSection title="15. Links externos e plataformas de terceiros">
          <p>
            Nosso site pode conter links para redes sociais, plataformas de pagamento, páginas de rastreamento, marketplaces ou outros sites de terceiros.
          </p>
          <p className="mt-4">
            A GDN Store não se responsabiliza pelas práticas de privacidade, segurança ou conteúdo de sites externos. Recomendamos que o cliente leia as políticas de privacidade das plataformas acessadas fora do ambiente da GDN Store.
          </p>
        </InfoSection>

        <InfoSection title="16. Atualizações desta Política">
          <p>
            Esta Política de Privacidade poderá ser atualizada a qualquer momento para refletir mudanças na legislação, nos serviços da loja, nas ferramentas utilizadas ou nas práticas de tratamento de dados.
          </p>
          <p className="mt-4">
            A versão mais recente estará sempre disponível nesta página. Recomendamos que o cliente consulte esta Política periodicamente.
          </p>
        </InfoSection>

        <InfoSection title="17. Atendimento GDN Store">
          <p>
            Em caso de dúvidas sobre esta Política de Privacidade, tratamento de dados pessoais, segurança da conta ou uso das informações, entre em contato com nossa equipe.
          </p>
          <ul className="list-none pl-0 space-y-1 mt-4">
            <li><strong>WhatsApp:</strong> (00) 00000-0000</li>
            <li><strong>Instagram:</strong> @gdnsolucoes</li>
            <li><strong>Endereço:</strong> Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil</li>
            <li><strong>CNPJ:</strong> 00.000.000/0001-00</li>
          </ul>
          <p className="mt-4">
            A GDN Store se compromete a tratar os dados pessoais de seus clientes com responsabilidade, transparência e segurança, mantendo uma relação de confiança antes, durante e depois da compra.
          </p>
        </InfoSection>
      </InfoCard>
    </InfoPage>
  );
}
