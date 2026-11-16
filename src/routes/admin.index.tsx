import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MessageCircleQuestion, Star, Users, Settings, ShieldCheck } from "lucide-react";
import { getCurrentAdmin } from "@/lib/adminQuestions";
import { getCustomerSessionToken, redirectToLogin } from "@/lib/customerSession";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/admin/")({
  component: AdminHubPage,
  head: () =>
    privateHead(
      "Central administrativa · GDN Store",
      "Área interna da GDN Store para acessar moderação de perguntas, avaliações e configurações da loja.",
    ),
});

type State =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden"; message: string }
  | { status: "admin"; role: string; name: string };

function AdminHubPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getCustomerSessionToken()) {
        if (!cancelled) setState({ status: "anonymous" });
        return;
      }
      const res = await getCurrentAdmin();
      if (cancelled) return;
      if (res.admin === true && "customer" in res) {
        const name =
          res.customer.display_name ||
          [res.customer.first_name, res.customer.last_name].filter(Boolean).join(" ") ||
          res.customer.email ||
          "Admin";
        setState({ status: "admin", role: res.role, name });
      } else if (res.authenticated === false) {
        setState({ status: "anonymous" });
      } else {
        setState({
          status: "forbidden",
          message: res.message || "Você não tem permissão para acessar esta página.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.status === "anonymous") {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center space-y-5">
        <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>
        <p className="text-muted-foreground">Faça login para acessar o painel administrativo.</p>
        <button
          onClick={() => redirectToLogin("/admin")}
          className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
        >
          Entrar
        </button>
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Acesso restrito</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <Link
          to="/minha-conta"
          className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-border text-sm font-semibold hover:bg-surface-muted transition"
        >
          Voltar para minha conta
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14 space-y-8">
      <section className="bg-card border border-border rounded-2xl shadow-elegant p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-highlight flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-highlight-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Painel administrativo</h1>
            <p className="text-sm text-muted-foreground truncate">
              Logado como {state.name} · {state.role}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminCard
          icon={<MessageCircleQuestion className="w-5 h-5" />}
          title="Perguntas dos produtos"
          description="Responda dúvidas enviadas pelos clientes."
          cta="Gerenciar perguntas"
          to="/admin/perguntas"
        />
        <AdminCard
          icon={<Star className="w-5 h-5" />}
          title="Avaliações"
          description="Moderar avaliações enviadas pelos clientes."
          cta="Gerenciar avaliações"
          to="/admin/avaliacoes"
        />
        <AdminCard
          icon={<Users className="w-5 h-5" />}
          title="Clientes"
          description="Informações e relacionamento com clientes."
          cta="Em breve"
          disabled
        />
        <AdminCard
          icon={<Settings className="w-5 h-5" />}
          title="Configurações"
          description="Ajustes administrativos da loja."
          cta="Em breve"
          disabled
        />
      </section>
    </div>
  );
}

function AdminCard({
  icon,
  title,
  description,
  cta,
  to,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  to?: string;
  disabled?: boolean;
}) {
  const body = (
    <div
      className={`h-full bg-card border border-border rounded-2xl p-6 shadow-sm transition ${
        disabled ? "opacity-60" : "hover:border-highlight hover:shadow-elegant"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="font-display font-semibold text-base sm:text-lg">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <div
        className={`inline-flex items-center mt-4 h-9 px-4 rounded-full text-xs font-semibold ${
          disabled
            ? "bg-surface-muted text-muted-foreground"
            : "bg-ink text-ink-foreground"
        }`}
      >
        {cta}
      </div>
    </div>
  );
  if (disabled || !to) return <div aria-disabled>{body}</div>;
  return <Link to={to}>{body}</Link>;
}
