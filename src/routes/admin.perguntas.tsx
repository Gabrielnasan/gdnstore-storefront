import { privateHead } from "@/lib/pageMeta";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  LogIn,
  MessageSquareReply,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminListProductQuestions,
  adminUpdateProductQuestion,
  getCurrentAdmin,
  type AdminProductQuestion,
} from "@/lib/adminQuestions";
import { redirectToLogin } from "@/lib/customerSession";

export const Route = createFileRoute("/admin/perguntas")({
  ssr: false,
  head: () =>
    privateHead(
      "Painel de Perguntas · GDN Store",
      "Gerencie dúvidas enviadas pelos clientes nos produtos da GDN Store.",
    ),
  component: AdminQuestionsPage,
});

type Gate =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "forbidden"; message: string }
  | { status: "admin"; role: string; name: string };

function AdminQuestionsPage() {
  const [gate, setGate] = useState<Gate>({ status: "loading" });

  useEffect(() => {
    (async () => {
      const res = await getCurrentAdmin();
      if (res.admin === true) {
        setGate({
          status: "admin",
          role: res.role,
          name:
            res.customer.display_name ||
            res.customer.email ||
            res.customer.first_name ||
            "Admin",
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
        cta={{
          label: "Entrar",
          onClick: () => redirectToLogin("/admin/perguntas"),
        }}
      />
    );
  }

  if (gate.status === "forbidden") {
    return (
      <CenterCard
        icon={<ShieldAlert className="w-6 h-6" />}
        title="Acesso negado"
        message={gate.message || "Você não tem permissão para acessar esta página."}
      />
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
  const [items, setItems] = useState<AdminProductQuestion[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState<AdminProductQuestion | null>(null);
  const [rejecting, setRejecting] = useState<AdminProductQuestion | null>(null);

  const load = async (override?: { status?: StatusFilter; search?: string }) => {
    setLoading(true);
    setError(null);
    const res = await adminListProductQuestions({
      status: override?.status ?? status,
      search: override?.search ?? search,
      limit: 100,
    });
    if (!res.success) {
      setError(res.error);
      setItems([]);
    } else {
      setItems(res.questions);
      setCounts(res.counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load({ status, search });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const summary = useMemo(
    () => [
      { label: "Pendentes", value: counts.pending, tone: "amber" },
      { label: "Aprovadas", value: counts.approved, tone: "emerald" },
      { label: "Rejeitadas", value: counts.rejected, tone: "red" },
      { label: "Total", value: counts.total, tone: "neutral" },
    ],
    [counts],
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-14 space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Painel de Perguntas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie dúvidas enviadas pelos clientes nos produtos.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sessão: <span className="font-medium">{adminName}</span>
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
            <div className="font-display text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col md:flex-row md:items-center gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={onSearch} className="flex-1 flex gap-2 md:max-w-md md:ml-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por pergunta, cliente, produto..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" className="rounded-full">
            Buscar
          </Button>
        </form>
      </section>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-destructive font-medium">
            Falha ao carregar perguntas: {error}
          </p>
          <Button onClick={() => void load()} variant="outline" className="mt-4 rounded-full">
            Tentar novamente
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Nenhuma pergunta encontrada.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              onAnswer={() => setAnswering(q)}
              onReject={() => setRejecting(q)}
              onApprove={async () => {
                const res = await adminUpdateProductQuestion({ id: q.id, action: "approve" });
                if (res.success) {
                  toast.success("Pergunta aprovada.");
                  await load();
                } else {
                  toast.error("Falha ao aprovar.", { description: res.error });
                }
              }}
              onSetPending={async () => {
                const res = await adminUpdateProductQuestion({ id: q.id, action: "set_pending" });
                if (res.success) {
                  toast.success("Pergunta movida para pendente.");
                  await load();
                } else {
                  toast.error("Falha ao atualizar.", { description: res.error });
                }
              }}
            />
          ))}
        </ul>
      )}

      <AnswerDialog
        question={answering}
        onClose={() => setAnswering(null)}
        onSaved={async () => {
          setAnswering(null);
          await load();
        }}
      />
      <RejectDialog
        question={rejecting}
        onClose={() => setRejecting(null)}
        onSaved={async () => {
          setRejecting(null);
          await load();
        }}
      />
    </div>
  );
}

function QuestionCard({
  q,
  onAnswer,
  onReject,
  onApprove,
  onSetPending,
}: {
  q: AdminProductQuestion;
  onAnswer: () => void;
  onReject: () => void;
  onApprove: () => void | Promise<void>;
  onSetPending: () => void | Promise<void>;
}) {
  const productLabel =
    q.shopify_product_title ||
    q.product_handle ||
    q.shopify_product_handle ||
    q.shopify_product_id ||
    "Produto";
  const created = new Date(q.created_at).toLocaleString("pt-BR");
  const hasAnswer = !!(q.answer && q.answer.trim());

  return (
    <li className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={q.status} />
            {hasAnswer && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                RESPONDIDA
              </span>
            )}
            <span className="text-xs text-muted-foreground">{created}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            Produto:{" "}
            <span className="font-medium text-foreground/80">{productLabel}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            Cliente:{" "}
            <span className="font-medium text-foreground/80">
              {q.customer_name || "—"}
            </span>
            {q.customer_email ? ` · ${q.customer_email}` : ""}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={onAnswer} className="rounded-full">
            <MessageSquareReply className="w-4 h-4 mr-1" />
            {hasAnswer ? "Editar resposta" : "Responder"}
          </Button>
          {q.status !== "approved" && (
            <Button size="sm" variant="outline" onClick={onApprove} className="rounded-full">
              <Check className="w-4 h-4 mr-1" /> Aprovar
            </Button>
          )}
          {q.status !== "rejected" && (
            <Button size="sm" variant="outline" onClick={onReject} className="rounded-full">
              <X className="w-4 h-4 mr-1" /> Rejeitar
            </Button>
          )}
          {q.status !== "pending" && (
            <Button size="sm" variant="ghost" onClick={onSetPending} className="rounded-full">
              <RotateCcw className="w-4 h-4 mr-1" /> Pendente
            </Button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm whitespace-pre-line">{q.question}</p>
      {hasAnswer && (
        <div className="mt-3 pl-3 border-l-2 border-highlight/50">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Resposta da loja
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-line">{q.answer}</p>
        </div>
      )}
      {q.moderation_reason && (
        <p className="mt-3 text-xs text-muted-foreground">
          Motivo da moderação: {q.moderation_reason}
        </p>
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
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

function AnswerDialog({
  question,
  onClose,
  onSaved,
}: {
  question: AdminProductQuestion | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(question?.answer ?? "");
  }, [question?.id]);

  if (!question) return null;

  const submit = async () => {
    const answer = value.trim();
    if (answer.length < 2) {
      toast.error("Resposta muito curta.");
      return;
    }
    if (answer.length > 3000) {
      toast.error("Resposta muito longa (máx. 3000).");
      return;
    }
    setSaving(true);
    const res = await adminUpdateProductQuestion({
      id: question.id,
      action: "answer",
      answer,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Resposta salva e pergunta aprovada.");
      await onSaved();
    } else {
      toast.error("Falha ao salvar.", { description: res.error });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Responder pergunta</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {question.question}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Resposta da loja</label>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            maxLength={3000}
            placeholder="Escreva uma resposta clara e objetiva..."
          />
          <div className="text-xs text-muted-foreground text-right">
            {value.length}/3000
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving} className="rounded-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar resposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  question,
  onClose,
  onSaved,
}: {
  question: AdminProductQuestion | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason("");
  }, [question?.id]);

  if (!question) return null;

  const submit = async () => {
    setSaving(true);
    const res = await adminUpdateProductQuestion({
      id: question.id,
      action: "reject",
      moderation_reason: reason.trim() || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Pergunta rejeitada.");
      await onSaved();
    } else {
      toast.error("Falha ao rejeitar.", { description: res.error });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar pergunta</DialogTitle>
          <DialogDescription>
            Esta pergunta não será exibida publicamente. Você pode informar um motivo
            interno para a moderação.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Motivo (opcional)"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
