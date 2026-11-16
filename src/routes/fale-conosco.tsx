import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { useState } from "react";
import { MessageCircle, HelpCircle, Phone, Instagram, MapPin, Send, CheckCircle2 } from "lucide-react";
import { InfoPage, InfoCard } from "@/components/InfoPage";

const PHONE_DISPLAY = "(00) 00000-0000";
const PHONE_DIGITS = "5500000000000";
const INSTAGRAM_URL = "https://www.instagram.com/gdnsolucoes";
const ADDRESS = "Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil";

export const Route = createFileRoute("/fale-conosco")({
  head: () => pageHead("/fale-conosco", "Fale Conosco · GDN Store", "Fale com a GDN Store por WhatsApp, Instagram ou pelo formulário de contato."),
  component: FaleConosco,
});

function FaleConosco() {
  const reasons = [
    "Dúvidas sobre pedidos",
    "Informações sobre produtos",
    "Trocas e devoluções",
    "Garantia",
    "Pagamentos",
    "Entrega e rastreamento",
  ];

  return (
    <InfoPage title="Fale com a GDN Store" subtitle="Acreditamos que comprar tecnologia deve ser uma experiência segura e bem orientada. Por isso, oferecemos atendimento humano para ajudar você a encontrar o produto certo, esclarecer dúvidas e acompanhar seu pedido sempre que necessário. Seja antes da compra, durante o processo ou após a entrega, nossa equipe está ao seu lado para garantir uma experiência de confiança do início ao fim.">
      <div className="grid md:grid-cols-2 gap-6">
        <InfoCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-highlight/15 text-highlight flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">WhatsApp e Telefone</h2>
          </div>
          <p className="text-foreground/80 mb-2">Atendimento direto pelo número:</p>
          <p className="font-display text-2xl font-bold mb-5">{PHONE_DISPLAY}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${PHONE_DIGITS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-ink text-ink-foreground px-5 py-2.5 text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href={`tel:+${PHONE_DIGITS}`}
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:border-ink transition"
            >
              <Phone className="w-4 h-4" /> Ligar
            </a>
          </div>
        </InfoCard>

        <InfoCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-highlight/15 text-highlight flex items-center justify-center">
              <Instagram className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Instagram</h2>
          </div>
          <p className="text-foreground/80 mb-4">Acompanhe lançamentos, novidades e bastidores da loja.</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-ink text-ink-foreground px-5 py-2.5 text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
          >
            <Instagram className="w-4 h-4" /> @gdnsolucoes
          </a>
        </InfoCard>
      </div>

      <InfoCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-highlight/15 text-highlight flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">Endereço</h2>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{ADDRESS}</p>
      </InfoCard>

      <InfoCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-highlight/15 text-highlight flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">Motivos de contato</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2 text-foreground/85">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-highlight" />
              {r}
            </li>
          ))}
        </ul>
      </InfoCard>

      <ContactForm />
    </InfoPage>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Dúvida sobre pedido");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    const text =
      `Olá, GDN Store!\n\n*Nome:* ${name}\n*E-mail:* ${email}\n*Telefone:* ${phone}\n*Assunto:* ${subject}\n\n${message}`;
    const url = `https://wa.me/${PHONE_DIGITS}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  if (sent) {
    return (
      <InfoCard className="text-center">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
        <h3 className="font-display text-xl font-semibold mb-2">Mensagem encaminhada</h3>
        <p className="text-sm text-foreground/70 max-w-md mx-auto">
          Abrimos uma conversa no WhatsApp com a sua mensagem. Se a janela não abriu, clique no botão de WhatsApp acima.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-5 text-sm font-semibold text-ink hover:text-highlight"
        >
          Enviar outra mensagem
        </button>
      </InfoCard>
    );
  }

  return (
    <InfoCard>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-highlight/15 text-highlight flex items-center justify-center">
          <Send className="w-5 h-5" />
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground">Formulário de contato</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        <input
          required maxLength={120} value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
          className="h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink"
        />
        <input
          required type="email" maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink"
        />
        <input
          maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone (opcional)"
          className="h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink"
        />
        <select
          value={subject} onChange={(e) => setSubject(e.target.value)}
          className="h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink"
        >
          <option>Dúvida sobre pedido</option>
          <option>Informação sobre produto</option>
          <option>Trocas e devoluções</option>
          <option>Garantia</option>
          <option>Pagamentos</option>
          <option>Outro assunto</option>
        </select>
        <textarea
          required maxLength={1500} rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Como podemos ajudar?"
          className="sm:col-span-2 px-3.5 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink resize-none"
        />
        <button
          type="submit"
          className="sm:col-span-2 h-12 rounded-lg bg-ink text-ink-foreground font-semibold hover:bg-highlight hover:text-highlight-foreground transition flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" /> Enviar pelo WhatsApp
        </button>
        <p className="sm:col-span-2 text-xs text-muted-foreground text-center">
          Sua mensagem será enviada pelo WhatsApp com os dados preenchidos acima.
        </p>
      </form>
    </InfoCard>
  );
}
