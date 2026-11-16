import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  LogOut,
  MessageCircleQuestion,
  Package,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { useCustomer } from "@/hooks/useCustomer";
import {
  type CustomerOrder,
  type Money,
  getCustomerOrders,
  logoutCustomer,
  redirectToLogin,
} from "@/lib/customerSession";
import { getCurrentAdmin } from "@/lib/adminQuestions";
import AccountDataSection from "@/components/AccountDataSection";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/minha-conta/")({
  component: MinhaContaPage,
  head: () =>
    privateHead(
      "Resumo da conta · GDN Store",
      "Área do cliente GDN Store: visualize seus pedidos, dados pessoais, endereços, avaliações e perguntas.",
    ),
});

function MinhaContaPage() {
  const { status, customer, refresh } = useCustomer();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === "anonymous") {
      redirectToLogin("/minha-conta");
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      const res = await getCurrentAdmin();
      if (!cancelled) setIsAdmin(res.admin === true);
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading" || status === "anonymous") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleLogout = async () => {
    const { shopifyLogoutUrl } = await logoutCustomer();
    if (typeof window !== "undefined" && shopifyLogoutUrl) {
      if (import.meta.env.DEV) console.log("Redirecting to Shopify logout");
      window.location.assign(shopifyLogoutUrl);
      return;
    }
    await refresh();
    if (typeof window !== "undefined") window.location.assign("/");
  };

  const displayName =
    customer.display_name || customer.first_name || customer.email || "Cliente";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <section className="bg-card border border-border rounded-2xl shadow-elegant p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="w-14 h-14 rounded-full bg-highlight flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-highlight-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              Olá, {displayName}
            </h1>
            {customer.email && (
              <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-border text-sm font-semibold hover:bg-surface-muted transition self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </section>

      {/* Dashboard cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardCard
          icon={<Package className="w-5 h-5" />}
          title="Pedidos"
          subtitle="Acompanhe suas compras"
          href="#pedidos"
        />
        <DashboardCard
          icon={<Star className="w-5 h-5" />}
          title="Avaliações"
          subtitle="Avalie seus produtos"
          to="/minha-conta/avaliacoes"
        />
        <DashboardCard
          icon={<MessageCircleQuestion className="w-5 h-5" />}
          title="Perguntas"
          subtitle="Suas dúvidas em produtos"
          to="/minha-conta/perguntas"
        />
        <DashboardCard
          icon={<User className="w-5 h-5" />}
          title="Dados da conta"
          subtitle="Seus dados pessoais"
          href="#dados"
        />
      </section>

      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-highlight hover:shadow-elegant transition"
        >
          <div className="w-10 h-10 rounded-full bg-highlight flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-highlight-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold">Painel administrativo</div>
            <div className="text-xs text-muted-foreground">
              Gerenciar perguntas de produtos enviadas pelos clientes.
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </Link>
      )}

      <OrdersSection />

      <AccountDataSection fallbackEmail={customer.email} />
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  subtitle,
  href,
  to,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  to?: string;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={`h-full bg-card border border-border rounded-2xl p-4 sm:p-5 transition shadow-sm ${
        disabled
          ? "opacity-60"
          : "hover:border-highlight hover:shadow-elegant cursor-pointer"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-surface-muted flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="font-display font-semibold text-sm sm:text-base text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
    </div>
  );
  if (disabled) return inner;
  if (to) return <Link to={to}>{inner}</Link>;
  if (href) return <a href={href}>{inner}</a>;
  return inner;
}

type OrdersState =
  | { status: "loading" }
  | { status: "error"; message: string; needsLogin?: boolean }
  | { status: "ready"; orders: CustomerOrder[] };

function OrdersSection() {
  const [state, setState] = useState<OrdersState>({ status: "loading" });

  const load = async () => {
    setState({ status: "loading" });
    const res = await getCustomerOrders();
    if (res.success) {
      setState({ status: "ready", orders: res.orders });
    } else {
      setState({
        status: "error",
        message: res.error,
        needsLogin: res.needs_login === true,
      });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section id="pedidos" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg sm:text-xl font-bold">Meus pedidos</h2>
        {state.status === "ready" && state.orders.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {state.orders.length} {state.orders.length === 1 ? "pedido" : "pedidos"}
          </span>
        )}
      </div>

      {state.status === "loading" && (
        <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {state.status === "error" && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {state.needsLogin
              ? "Sua sessão expirou. Entre novamente para ver seus pedidos."
              : "Não foi possível carregar seus pedidos no momento."}
          </p>
          {state.needsLogin ? (
            <button
              onClick={() => redirectToLogin("/minha-conta")}
              className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
            >
              Entrar novamente
            </button>
          ) : (
            <button
              onClick={() => void load()}
              className="inline-flex items-center justify-center h-10 px-4 rounded-full border border-border text-sm font-semibold hover:bg-surface-muted transition"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {state.status === "ready" && state.orders.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-display font-semibold">Você ainda não tem pedidos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Quando finalizar uma compra, ela aparecerá aqui.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center h-10 px-4 mt-4 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
          >
            Explorar a loja
          </a>
        </div>
      )}

      {state.status === "ready" && state.orders.length > 0 && (
        <div className="space-y-4">
          {state.orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </section>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  return (
    <article className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-5 border-b border-border bg-surface-muted/40">
        <div>
          <div className="font-display font-bold text-base">Pedido {order.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(order.processedAt)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={translateFinancial(order.financialStatus)} tone="financial" />
          <StatusBadge
            label={translateFulfillment(order.fulfillmentStatus)}
            tone="fulfillment"
          />
        </div>
      </header>

      <div className="p-5 space-y-4">
        {order.lineItems.map((li, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-surface-muted overflow-hidden shrink-0 flex items-center justify-center">
              {li.imageUrl ? (
                <img
                  src={li.imageUrl}
                  alt={li.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Package className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium line-clamp-2">{li.title}</div>
              {li.variantTitle && li.variantTitle !== "Default Title" && (
                <div className="text-xs text-muted-foreground">{li.variantTitle}</div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">
                Qtd: {li.quantity}
              </div>
            </div>
            <div className="text-sm font-semibold whitespace-nowrap">
              {formatMoney(li.price)}
            </div>
          </div>
        ))}
      </div>

      <footer className="px-5 py-4 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-display font-bold">{formatMoney(order.totalPrice)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.fulfillments
            .flatMap((f) => f.trackingInfo)
            .filter((t) => t.url || t.number)
            .map((t, i) =>
              t.url ? (
                <a
                  key={i}
                  href={t.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-highlight text-highlight-foreground text-xs font-semibold hover:opacity-90 transition"
                >
                  Rastrear {t.number ? `#${t.number}` : ""}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span
                  key={i}
                  className="inline-flex items-center h-9 px-3 rounded-full bg-surface-muted text-xs font-semibold"
                >
                  Rastreio: {t.number}
                </span>
              ),
            )}
        </div>
      </footer>
    </article>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "financial" | "fulfillment";
}) {
  const base =
    "inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide";
  const cls =
    tone === "financial"
      ? "bg-ink text-ink-foreground"
      : "bg-highlight text-highlight-foreground";
  return <span className={`${base} ${cls}`}>{label}</span>;
}

function translateFinancial(s: string | null): string {
  if (!s) return "—";
  switch (s.toUpperCase()) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pendente";
    case "AUTHORIZED":
      return "Autorizado";
    case "PARTIALLY_PAID":
      return "Parcialmente pago";
    case "REFUNDED":
      return "Reembolsado";
    case "PARTIALLY_REFUNDED":
      return "Parcialmente reembolsado";
    case "VOIDED":
      return "Cancelado";
    case "EXPIRED":
      return "Expirado";
    default:
      return s;
  }
}

function translateFulfillment(s: string | null): string {
  if (!s) return "Aguardando envio";
  switch (s.toUpperCase()) {
    case "FULFILLED":
      return "Enviado";
    case "PARTIAL":
    case "PARTIALLY_FULFILLED":
      return "Parcialmente enviado";
    case "UNFULFILLED":
      return "Aguardando envio";
    case "RESTOCKED":
      return "Devolvido ao estoque";
    case "IN_PROGRESS":
      return "Em preparação";
    case "ON_HOLD":
      return "Em espera";
    case "SCHEDULED":
      return "Agendado";
    case "OPEN":
      return "Aberto";
    default:
      return s;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatMoney(m: Money): string {
  if (!m) return "—";
  const amount = Number(m.amount);
  if (Number.isNaN(amount)) return `${m.amount} ${m.currencyCode}`;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: m.currencyCode || "BRL",
    }).format(amount);
  } catch {
    return `R$ ${amount.toFixed(2)}`;
  }
}
