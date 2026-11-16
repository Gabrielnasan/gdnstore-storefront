import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ShieldCheck, MailCheck } from "lucide-react";
import { buildLoginUrl } from "@/lib/customerSession";
import { pageHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () =>
    pageHead(
      "/account",
      "Acessar conta · GDN Store",
      "Entre ou crie sua conta GDN Store. Acesso seguro por código enviado ao seu e-mail.",
    ),
});

function AccountPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-surface-muted py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <AuthCard />
      </div>
    </div>
  );
}

function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-3xl font-bold">Bem-vindo</h1>
        <p className="text-sm text-muted-foreground mt-1">Entre ou crie sua conta GDN Store</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-elegant overflow-hidden">
        <div className="grid grid-cols-2 bg-surface-muted">
          <button
            onClick={() => setMode("login")}
            className={`py-3.5 text-sm font-semibold transition relative ${mode === "login" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("register")}
            className={`py-3.5 text-sm font-semibold transition relative ${mode === "register" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Criar conta
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <EmailForm
                description="Digite seu e-mail para receber um código de acesso."
                buttonLabel="Receber código de acesso"
              />
            </motion.div>
          ) : (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <EmailForm
                description="Digite seu e-mail para criar ou acessar sua conta. A Shopify enviará um código de verificação para seu e-mail."
                buttonLabel="Criar conta"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-ink shrink-0" />
          Acesso 100% sem senha — mais seguro e simples.
        </li>
        <li className="flex items-start gap-2">
          <MailCheck className="w-4 h-4 mt-0.5 text-ink shrink-0" />
          Você recebe um código de 6 dígitos no seu e-mail para validar o acesso.
        </li>
      </ul>
    </div>
  );
}

function EmailForm({ description, buttonLabel }: { description: string; buttonLabel: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Redireciona para o início do OAuth (PKCE) do Customer Account API via edge function.
    window.location.href = buildLoginUrl("/minha-conta", email || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="relative">
        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          className="w-full h-11 pl-10 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink transition"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-lg bg-ink text-ink-foreground font-semibold hover:bg-highlight hover:text-highlight-foreground transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {buttonLabel} <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Ao continuar, você será direcionado para o login seguro da GDN Store, onde receberá um código por e-mail.
      </p>
    </form>
  );
}
