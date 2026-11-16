import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { InfoPage, InfoCard, InfoSection } from "@/components/InfoPage";
import { Phone, FileText } from "lucide-react";

const PHONE_DISPLAY = "(00) 00000-0000";
const CNPJ = "00.000.000/0001-00";

export const Route = createFileRoute("/sobre-nos")({
  head: () => pageHead("/sobre-nos", "Nossa História · GDN Store", "Conheça a GDN Store, sua loja de tecnologia com produtos selecionados e atendimento próximo."),
  component: Sobre,
});

function Sobre() {
  return (
    <InfoPage
      title="Nossa História"
      subtitle="Tecnologia, confiança e praticidade em um só lugar."
    >
      <InfoCard>
        <p className="text-foreground/85 leading-relaxed text-lg">
          A GDN Store nasceu em Colatina, Espírito Santo, a partir da iniciativa de três jovens empreendedores que se conheceram durante a faculdade e compartilharam uma mesma visão: criar uma empresa capaz de oferecer tecnologia de qualidade com atendimento próximo, transparente e confiável.
        </p>
        <p className="text-foreground/85 leading-relaxed text-lg mt-4">
          Fundada por Gabriel Antonio do Nascimento, Gustavo Caldonho e João Henrique Leite Gama, a GDN Store surgiu da percepção de uma oportunidade única no mercado. Em um cenário onde muitas lojas focam apenas na venda, acreditamos que a experiência do cliente deve começar muito antes da compra e continuar mesmo após a entrega do produto.
        </p>
      </InfoCard>

      <InfoCard>
        <InfoSection title="O que fazemos">
          <p>
            Selecionamos smartphones, notebooks, consoles, acessórios e outros produtos de tecnologia com foco em desempenho, confiabilidade e excelente custo-benefício. Nosso objetivo é ajudar cada cliente a fazer uma compra mais segura e bem informada.
          </p>
          <p>
            Mais do que vender tecnologia, buscamos orientar, esclarecer dúvidas e oferecer suporte humano em todas as etapas da jornada de compra.
          </p>
        </InfoSection>
      </InfoCard>

      <InfoCard>
        <InfoSection title="Nossa Missão">
          <p>
            Tornar a compra de produtos de tecnologia uma experiência simples, segura e transparente, conectando nossos clientes às melhores soluções do mercado por meio de atendimento próximo e especializado.
          </p>
        </InfoSection>
      </InfoCard>

      <InfoCard>
        <InfoSection title="Nossos Valores">
          <ul className="list-disc pl-5 space-y-1">
            <li>Transparência em cada negociação.</li>
            <li>Respeito e compromisso com nossos clientes.</li>
            <li>Atendimento humano e acessível.</li>
            <li>Busca constante por qualidade e inovação.</li>
            <li>Construção de relações de confiança a longo prazo.</li>
          </ul>
        </InfoSection>
      </InfoCard>

      <InfoCard>
        <InfoSection title="Nosso Compromisso">
          <p>
            Na GDN Store, acreditamos que confiança é construída todos os dias. Por isso, trabalhamos para oferecer não apenas produtos de qualidade, mas também uma experiência de compra que transmita segurança, credibilidade e tranquilidade do início ao fim.
          </p>
        </InfoSection>
      </InfoCard>

      <InfoCard>
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">Dados da loja</h2>
        <div className="space-y-2 text-foreground/85">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-highlight" />
            <span>Telefone / WhatsApp: <strong>{PHONE_DISPLAY}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-highlight" />
            <span>CNPJ: <strong>{CNPJ}</strong></span>
          </div>
        </div>
      </InfoCard>
    </InfoPage>
  );
}
