import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Link } from "@tanstack/react-router";
const universoAppleBanner = { url: "/images/banners/games-banner.svg" };
const gamesBanner = { url: "/images/banners/games-banner-v2.svg" };



export function PromoBanners() {
  return (
    <section className="container mx-auto px-4 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Link
          to="/collections/$handle"
          params={{ handle: "smartphones" }}
          aria-label="Universo Apple completo"
          className="relative aspect-[1500/512] w-full rounded-3xl overflow-hidden block group cursor-pointer shadow-sm hover:shadow-elegant transition-shadow bg-surface-muted"
        >
          <img
            src={universoAppleBanner.url}
            alt="Universo Apple completo - iPhone, MacBook, iPad, Watch"
            width={1500}
            height={512}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Link
          to="/collections/$handle"
          params={{ handle: "games" }}
          aria-label="Até 40% OFF em games"
          className="relative aspect-[1500/512] w-full rounded-3xl overflow-hidden block group cursor-pointer shadow-sm hover:shadow-elegant transition-shadow bg-surface-muted"
        >
          <img
            src={gamesBanner.url}
            alt="Até 40% OFF em games - Consoles, jogos e acessórios"
            width={1500}
            height={512}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
      </motion.div>
    </section>
  );
}

import { useState } from "react";
import { Loader2 } from "lucide-react";

// Regex de validação simples de e-mail (evita dependência externa).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Envia o e-mail para a plataforma de e-mail marketing.
 *
 * TODO(integração): conectar à ferramenta oficial (Klaviyo, Mailchimp,
 * Shopify Customer / marketing consent, ou endpoint próprio).
 * Basta trocar o corpo desta função pela chamada real (fetch/POST) —
 * o restante do componente já lida com loading, erro e sucesso.
 */
async function subscribeEmail(email: string): Promise<void> {
  // Fallback local enquanto a integração não existe:
  // guarda em localStorage para não perder leads coletados.
  try {
    if (typeof window !== "undefined") {
      const key = "gdn:newsletter:pending";
      const raw = window.localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(email)) list.push(email);
      window.localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {
    /* ignora falha de storage */
  }
  // Simula latência de rede para feedback visual coerente.
  await new Promise((r) => setTimeout(r, 500));
}

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setError("Digite um e-mail válido para continuarmos.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      await subscribeEmail(value);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Não conseguimos concluir agora. Tente novamente em instantes.");
    }
  };

  return (
    <section className="container mx-auto px-4 py-20 md:py-24">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Ofertas em tecnologia, antes de todo mundo.
        </h2>

        {status === "success" ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-8 text-sm text-foreground border-t border-border pt-6"
          >
            Pronto. Você está na lista.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8">
            <div className="flex items-center border-b border-border focus-within:border-foreground transition-colors">
              <label htmlFor="newsletter-email" className="sr-only">E-mail</label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="seu@email.com"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "newsletter-error" : undefined}
                className="flex-1 h-11 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-11 px-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Assinar →"
                )}
              </button>
            </div>
            <p
              id={status === "error" ? "newsletter-error" : undefined}
              className={`mt-3 text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
              role={status === "error" ? "alert" : undefined}
            >
              {status === "error" && error ? error : "Sem spam. Cancele quando quiser."}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}



import appleLogo from "@/assets/brands/apple.svg";
import sonyLogo from "@/assets/brands/sony.svg";
import microsoftLogo from "@/assets/brands/microsoft.svg";
import djiLogo from "@/assets/brands/dji.svg";
import dellLogo from "@/assets/brands/dell.svg";
import xiaomiLogo from "@/assets/brands/xiaomi.svg";
import asusRogLogo from "@/assets/brands/asus-rog.svg";
import garminLogo from "@/assets/brands/garmin.svg";

export function BrandsStrip() {
  // `scale` harmoniza opticamente logos com proporções muito distintas
  // sem deformar nenhum SVG (proporção original preservada).
  const brands: { handle: string; label: string; src: string; scale?: number }[] = [
    { handle: "apple", label: "Apple", src: appleLogo, scale: 0.78 },
    { handle: "sony", label: "Sony", src: sonyLogo, scale: 1 },
    { handle: "microsoft", label: "Microsoft", src: microsoftLogo, scale: 0.78 },
    { handle: "dji", label: "DJI", src: djiLogo, scale: 0.95 },
    { handle: "dell", label: "Dell", src: dellLogo, scale: 0.85 },
    { handle: "xiaomi", label: "Xiaomi", src: xiaomiLogo, scale: 0.85 },
    { handle: "asus-rog", label: "ASUS ROG", src: asusRogLogo, scale: 0.95 },
    { handle: "garmin", label: "Garmin", src: garminLogo, scale: 1 },
  ];
  return (
    <section className="border-y border-border bg-surface-muted/50">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6 md:mb-8">
          As maiores marcas estão aqui
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 items-center justify-items-center gap-x-4 gap-y-6 md:gap-x-6">
          {brands.map((b) => (
            <Link
              key={b.handle}
              to="/marca/$handle"
              params={{ handle: b.handle }}
              aria-label={b.label}
              title={b.label}
              className="group flex items-center justify-center w-full h-14 md:h-16 px-2 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <img
                src={b.src}
                alt={`${b.label} logo`}
                loading="lazy"
                className="max-h-full max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-200 [filter:grayscale(100%)] group-hover:[filter:grayscale(0%)]"
                style={{ transform: `scale(${b.scale ?? 1})` }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
