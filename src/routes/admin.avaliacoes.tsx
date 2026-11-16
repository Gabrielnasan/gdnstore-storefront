import { privateHead } from "@/lib/pageMeta";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, LogIn, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/StarRating";
import {
  adminListProductReviews,
  adminUpdateProductReview,
  type AdminReview,
} from "@/lib/productReviews";
import { getCurrentAdmin } from "@/lib/adminQuestions";
import { redirectToLogin } from "@/lib/customerSession";

export const Route = createFileRoute("/admin/avaliacoes")({
  ssr: false,
  head: () =>
    privateHead(
      "Moderação de avaliações · GDN Store",
      "Aprove, rejeite ou retorne para pendente as avaliações dos clientes na GDN Store.",
    ),
  component: AdminReviewsPage,
});

type Gate =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden"; message: string }
  | { status: "admin"; name: string };

function AdminReviewsPage() {
  const [gate, setGate] = useState<Gate>({ status: "loading" });

  useEffect(() => {
    (async () => {
      const res = await getCurrentAdmin();
      if (res.admin === true) {
        setGate({
          status: "admin",
          name:
            res.customer.display_name || res.customer.email || res.customer.first_name || "Admin",
        });
      } else if (res.authenticated) {
        setGate({ status: "forbidden", message: res.message ?? "Acesso não autorizado." });
      } else {
        setGate({ status: "anonymous" });
      }
    })();
  }, []);

  if (gate.status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (gate.status === "anonymous") {
    return (
      <CenterCard
        icon={<LogIn className="w-6 h-6" />}
        title="Acesso restrito"
        message="Faça login para acessar o painel administrativo."
        cta={{ label: "Entrar", onClick: () => redirectToLogin("/admin/avaliacoes") }}
      />
    );
  }
  if (gate.status === "forbidden") {
    return (
      <CenterCard icon={<ShieldAlert className="w-6 h-6" />} title="Acesso negado" message={gate.message} />
    );
  }
  return <Dashboard adminName={gate.name} />;
}

function CenterCard({
  icon,
  title,
  message,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="container mx-auto max-w-md px-4 py-20">
      <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-elegant">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center mb-4">
          {icon}
        </div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        {cta && (
          <Button onClick={cta.onClick} className="mt-6 rounded-full">
            {cta.label}
          </Button>
        )}
      </div>
    </div>
  );
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function Dashboard({ adminName }: { adminName: string }) {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminReview | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await adminListProductReviews({ status, search, limit: 100 });
    if (!res.success) {
      setError(res.error);
      setItems([]);
    } else {
      setItems(res.reviews);
      setCounts(res.counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const summary = useMemo(
    () => [
      { label: "Pendentes", value: counts.pending },
      { label: "Aprovadas", value: counts.approved },
      { label: "Rejeitadas", value: counts.rejected },
      { label: "Total", value: counts.total },
    ],
    [counts],
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-14 space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Moderação de avaliações</h1>
        <p className="text-sm text-muted-foreground">
          Aprove, rejeite ou retorne para pendente as avaliações dos clientes.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sessão: <span className="font-medium">{adminName}</span>
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="font-display text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col md:flex-row md:items-center gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex-1 flex gap-2 md:max-w-md md:ml-auto"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por produto, cliente, texto..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" className="rounded-full">Buscar</Button>
        </form>
      </section>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-destructive font-medium">Falha ao carregar: {error}</p>
          <Button onClick={() => void load()} variant="outline" className="mt-4 rounded-full">
            Tentar novamente
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Nenhuma avaliação encontrada.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              onReject={() => setRejecting(r)}
              onApprove={async () => {
                const res = await adminUpdateProductReview({ id: r.id, action: "approve" });
                if (res.success) {
                  toast.success("Avaliação aprovada.");
                  await load();
                } else toast.error("Falha ao aprovar.", { description: res.error });
              }}
              onSetPending={async () => {
                const res = await adminUpdateProductReview({ id: r.id, action: "set_pending" });
                if (res.success) {
                  toast.success("Avaliação movida para pendente.");
                  await load();
                } else toast.error("Falha.", { description: res.error });
              }}
            />
          ))}
        </ul>
      )}

      <RejectDialog
        review={rejecting}
        onClose={() => setRejecting(null)}
        onSaved={async () => {
          setRejecting(null);
          await load();
        }}
      />
    </div>
  );
}

function ReviewRow({
  review,
  onApprove,
  onReject,
  onSetPending,
}: {
  review: AdminReview;
  onApprove: () => void | Promise<void>;
  onReject: () => void;
  onSetPending: () => void | Promise<void>;
}) {
  const created = new Date(review.createdAt).toLocaleString("pt-BR");
  return (
    <li className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={review.status} />
            {review.verifiedPurchase && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                COMPRA VERIFICADA
              </span>
            )}
            <span className="text-xs text-muted-foreground">{created}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            Produto: <span className="font-medium text-foreground/80">{review.productTitle ?? review.shopifyProductId}</span>
            {review.shopifyOrderName ? ` · Pedido ${review.shopifyOrderName}` : ""}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            Cliente:{" "}
            <span className="font-medium text-foreground/80">{review.customerName ?? "—"}</span>
            {review.customerEmail ? ` · ${review.customerEmail}` : ""}
          </div>
          <div className="mt-2"><StarRating value={review.rating} size={16} /></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {review.status !== "approved" && (
            <Button size="sm" variant="outline" onClick={onApprove} className="rounded-full">
              <Check className="w-4 h-4 mr-1" /> Aprovar
            </Button>
          )}
          {review.status !== "rejected" && (
            <Button size="sm" variant="outline" onClick={onReject} className="rounded-full">
              <X className="w-4 h-4 mr-1" /> Rejeitar
            </Button>
          )}
          {review.status !== "pending" && (
            <Button size="sm" variant="ghost" onClick={onSetPending} className="rounded-full">
              <RotateCcw className="w-4 h-4 mr-1" /> Pendente
            </Button>
          )}
        </div>
      </div>
      {review.title && <h4 className="font-semibold mt-3">{review.title}</h4>}
      <p className="mt-2 text-sm whitespace-pre-line">{review.body}</p>
      {review.media.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {review.media.map((m, i) =>
            m.mediaType === "video" ? (
              <video key={i} src={m.url} controls className="w-32 h-32 rounded-lg bg-black object-cover" />
            ) : (
              <a key={i} href={m.url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden bg-surface-muted">
                <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              </a>
            ),
          )}
        </div>
      )}
      {review.moderationReason && (
        <p className="mt-3 text-xs text-muted-foreground">Motivo: {review.moderationReason}</p>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-amber-500/10 text-amber-700", label: "PENDENTE" },
    approved: { cls: "bg-emerald-500/10 text-emerald-700", label: "APROVADA" },
    rejected: { cls: "bg-red-500/10 text-red-700", label: "REJEITADA" },
  };
  const m = map[status] ?? { cls: "bg-muted text-muted-foreground", label: status.toUpperCase() };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}

function RejectDialog({
  review,
  onClose,
  onSaved,
}: {
  review: AdminReview | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason("");
  }, [review?.id]);

  if (!review) return null;

  const submit = async () => {
    setSaving(true);
    const res = await adminUpdateProductReview({
      id: review.id,
      action: "reject",
      moderation_reason: reason.trim() || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Avaliação rejeitada.");
      await onSaved();
    } else {
      toast.error("Falha ao rejeitar.", { description: res.error });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar avaliação</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Motivo (opcional)"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="rounded-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
