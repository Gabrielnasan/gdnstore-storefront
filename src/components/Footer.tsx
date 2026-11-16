import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Instagram, CreditCard, Truck, ShieldCheck, Headphones, Phone, MessageCircle, MapPin, Building2, Lock, BadgeCheck, Globe, Star, Award } from "lucide-react";
import { fetchShopLinks } from "@/lib/shopify";
import { INSTALLMENT_FULL, INSTALLMENT_SHORT } from "@/lib/commerce";
import logo from "@/assets/logo-gdn.svg";
import paymentMethods from "@/assets/payment-methods.svg";

const INSTAGRAM_URL = "https://www.instagram.com/gdnsolucoes";
const PHONE_DISPLAY = "(00) 00000-0000";
const PHONE_DIGITS = "5500000000000";
const CNPJ = "00.000.000/0001-00";

const ADDRESS = "Rua Exemplo, 123, Centro, Cidade UF, 00000-000, Brasil";


export function Footer() {
  useQuery({
    queryKey: ["shop-links"],
    queryFn: fetchShopLinks,
    staleTime: 5 * 60_000,
  });

  const categories = [
    { label: "Smartphones", to: "/collections/$handle", handle: "smartphones" },
    { label: "Computadores", to: "/collections/$handle", handle: "computadores" },
    { label: "Games", to: "/collections/$handle", handle: "games" },
    { label: "Áudio", to: "/collections/$handle", handle: "audio" },
    { label: "Acessórios", to: "/collections/$handle", handle: "acessorios" },
    
  ];

  return (
    <footer className="bg-ink text-ink-foreground mt-20">
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Envio com rastreio", sub: "Código enviado após postagem" },
            { icon: CreditCard, title: INSTALLMENT_SHORT, sub: "Juros conforme a operadora" },
            { icon: ShieldCheck, title: "Compra segura", sub: "Pagamento protegido" },
            { icon: Headphones, title: "Atendimento humano", sub: "Antes e depois da compra" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-highlight/10 text-highlight flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-white/60">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-14 flex flex-wrap justify-between gap-x-8 gap-y-10">
        {/* Brand */}
        <div className="w-full sm:w-[260px]">
          <img src={logo} alt="GDN Store" className="h-[60px] md:h-[83px] w-auto max-w-none object-contain block mb-4" />
          <p className="text-sm text-white/60 leading-relaxed">
            Loja de tecnologia com produtos selecionados, pagamento facilitado e experiência de compra segura.
          </p>
        </div>

        {/* Ajuda */}
        <div className="w-[45%] sm:w-auto">
          <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-highlight">Ajuda</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/fale-conosco" className="text-white/60 hover:text-white transition">Fale conosco</Link></li>
            <li><Link to="/perguntas-frequentes" className="text-white/60 hover:text-white transition">Perguntas frequentes</Link></li>
            <li><Link to="/trocas-e-devolucoes" className="text-white/60 hover:text-white transition">Trocas e devoluções</Link></li>
            <li><Link to="/politica-de-entrega" className="text-white/60 hover:text-white transition">Política de entrega</Link></li>
            <li><a href="https://gdnstore.com.br/minha-conta#pedidos" className="text-white/60 hover:text-white transition">Meus pedidos</a></li>
            
            <li><Link to="/garantia" className="text-white/60 hover:text-white transition">Garantia</Link></li>
          </ul>
        </div>

        {/* Institucional */}
        <div className="w-[45%] sm:w-auto">
          <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-highlight">Institucional</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/sobre-nos" className="text-white/60 hover:text-white transition">Sobre nós</Link></li>
            <li><Link to="/politica-de-privacidade" className="text-white/60 hover:text-white transition">Política de privacidade</Link></li>
            <li><Link to="/termos-de-uso" className="text-white/60 hover:text-white transition">Termos de uso</Link></li>
            <li><Link to="/trocas-e-devolucoes" className="text-white/60 hover:text-white transition">Troca e devolução</Link></li>
          </ul>
        </div>

        {/* Categorias */}
        <div className="w-[45%] sm:w-auto">
          <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-highlight">Categorias</h4>
          <ul className="space-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.handle}>
                <Link to={c.to} params={{ handle: c.handle }} className="text-white/60 hover:text-white transition">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>


        {/* Contato */}
        <div className="w-full sm:w-auto">
          <h4 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider text-highlight">
            Contato
          </h4>
          <ul className="space-y-4 text-sm">
            <li>
              <a
                href={`tel:+${PHONE_DIGITS}`}
                className="flex items-center gap-3 text-white/70 hover:text-highlight transition"
              >
                <Phone className="w-4 h-4 text-highlight shrink-0" />
                <span className="leading-none">{PHONE_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${PHONE_DIGITS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/70 hover:text-highlight transition"
              >
                <MessageCircle className="w-4 h-4 text-highlight shrink-0" />
                <span className="leading-none">{PHONE_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/70 hover:text-highlight transition"
              >
                <Instagram className="w-4 h-4 text-highlight shrink-0" />
                <span className="leading-none">@gdnsolucoes</span>
              </a>
            </li>
            <li className="flex items-start gap-3 text-white/70">
              <MapPin className="w-4 h-4 text-highlight shrink-0 mt-0.5" />
              <span className="leading-relaxed max-w-sm">
                Rua Exemplo, 123,<br />
                Centro, Cidade UF, 00000-000, Brasil
              </span>
            </li>
            <li className="flex items-center gap-3 text-white/70">
              <Building2 className="w-4 h-4 text-highlight shrink-0" />
              <span className="leading-none">CNPJ: {CNPJ}</span>
            </li>
          </ul>
        </div>

        {/* Pagamento */}
        <div className="w-full sm:w-auto">
          <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-highlight">Formas de Pagamento</h4>
          <img
            src={paymentMethods}
            alt="Formas de pagamento aceitas"
            className="w-full max-w-[200px] sm:max-w-[240px] h-auto object-contain block"
          />
        </div>
      </div>

      {/* Trust & Marketplaces */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-10 grid gap-10 md:grid-cols-2">
          {/* Segurança */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-highlight">
              Segurança
            </h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-white/70">
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-highlight shrink-0" /> Compra 100% Segura</li>
              <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-highlight shrink-0" /> Pagamentos Criptografados</li>
              <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-highlight shrink-0" /> Ambiente SSL Protegido</li>
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-highlight shrink-0" /> Dados do Cliente Protegidos</li>
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {["Let's Encrypt", "SSL Secure", "Google Safe Browsing", "Shopify Secure Checkout"].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/75"
                >
                  <ShieldCheck className="w-3 h-3 text-highlight" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Marketplaces */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-highlight">
              Também estamos em
            </h4>
            <p className="text-sm text-white/70 leading-relaxed">
              Nossos produtos também podem ser encontrados nos principais marketplaces do Brasil.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {["Mercado Livre", "Amazon", "Shopee"].map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85"
                >
                  <Star className="w-3 h-3 text-highlight" />
                  {m}
                </span>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-xs text-white/60">
              <li className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-highlight shrink-0" /> Produtos selecionados com foco em tecnologia e qualidade</li>
              <li className="flex items-center gap-2"><BadgeCheck className="w-3.5 h-3.5 text-highlight shrink-0" /> Atendimento especializado para ajudar na sua compra</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-highlight shrink-0" /> Envio para todo o Brasil com produtos originais e garantia</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 flex items-center justify-center">
          <p className="text-xs text-white/50 text-center">
            © {new Date().getFullYear()} GDN Store · gdnstore.com.br · CNPJ {CNPJ} · Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
