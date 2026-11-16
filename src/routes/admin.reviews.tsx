import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LogOut, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/admin/reviews")({
  ssr: false,
  head: () =>
    privateHead(
      "Moderação de conteúdo · GDN Store",
      "Aprove, responda ou rejeite avaliações e perguntas dos clientes na GDN Store.",
    ),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).eq("role", "admin");
      if (!roles || roles.length === 0) {
        toast.error("Acesso negado", { description: "Apenas administradores podem acessar." });
        navigate({ to: "/" });
        return;
      }
      setIsAdmin(true);
      setReady(true);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (!ready || !isAdmin) {
    return <div className="container mx-auto py-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Moderação</h1>
          <p className="text-sm text-muted-foreground">Aprove, responda ou rejeite avaliações e perguntas.</p>
        </div>
        <Button variant="outline" onClick={signOut} className="rounded-full"><LogOut className="w-4 h-4 mr-2" /> Sair</Button>
      </div>

      <Input
        placeholder="Filtrar por ID do produto Shopify"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 max-w-md"
      />

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="questions">Perguntas</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews" className="mt-6"><ReviewsAdmin filter={filter} /></TabsContent>
        <TabsContent value="questions" className="mt-6"><QuestionsAdmin filter={filter} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewsAdmin({ filter }: { filter: string }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, shopify_product_id, customer_name, rating, title, comment, status, verified_purchase, helpful_count, created_at, updated_at, photos:product_review_photos(id, storage_path, photo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () => (filter ? data.filter((r: any) => r.shopify_product_id.includes(filter)) : data),
    [data, filter]
  );

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("product_reviews").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }
  };

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (filtered.length === 0) return <p className="text-center text-muted-foreground py-10">Nenhuma avaliação.</p>;

  return (
    <div className="space-y-4">
      {filtered.map((r: any) => (
        <div key={r.id} className="rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{r.customer_name}</span>
                <StatusBadge status={r.status} />
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <StarRating value={r.rating} size={14} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1 break-all">Produto: {r.shopify_product_id}</p>
            </div>
            <div className="flex gap-2">
              {r.status !== "approved" && <Button size="sm" onClick={() => update(r.id, "approved")} className="rounded-full"><Check className="w-4 h-4 mr-1" /> Aprovar</Button>}
              {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => update(r.id, "rejected")} className="rounded-full"><X className="w-4 h-4 mr-1" /> Rejeitar</Button>}
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="rounded-full text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
          {r.title && <h4 className="font-semibold mt-3">{r.title}</h4>}
          <p className="mt-2 text-sm whitespace-pre-line">{r.comment}</p>
          {r.photos?.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {r.photos.map((p: any) => (
                <AdminPhoto key={p.id} path={p.storage_path} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    supabase.storage.from("review-photos").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl));
  }, [path]);
  return (
    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
    </div>
  );
}

function QuestionsAdmin({ filter }: { filter: string }) {
  const qc = useQueryClient();
  const [answering, setAnswering] = useState<Record<string, string>>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_questions")
        .select("id, shopify_product_id, customer_name, question, answer, status, created_at, answered_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () => (filter ? data.filter((q: any) => q.shopify_product_id.includes(filter)) : data),
    [data, filter]
  );

  const update = async (id: string, patch: { status?: string; answer?: string; answered_at?: string }) => {
    const { error } = await supabase.from("product_questions").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["admin-questions"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta pergunta?")) return;
    const { error } = await supabase.from("product_questions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin-questions"] }); }
  };

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (filtered.length === 0) return <p className="text-center text-muted-foreground py-10">Nenhuma pergunta.</p>;

  return (
    <div className="space-y-4">
      {filtered.map((q: any) => (
        <div key={q.id} className="rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{q.customer_name ?? "Anônimo"}</span>
                <StatusBadge status={q.status} />
                {q.answer && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">RESPONDIDA</span>}
                <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 break-all">Produto: {q.shopify_product_id}</p>
              <p className="mt-2">{q.question}</p>
              {q.answer && <p className="mt-3 pl-3 border-l-2 border-highlight/50 text-sm text-muted-foreground whitespace-pre-line">{q.answer}</p>}
            </div>
            <div className="flex gap-2">
              {q.status !== "approved" && <Button size="sm" onClick={() => update(q.id, { status: "approved" })} className="rounded-full"><Check className="w-4 h-4 mr-1" /> Aprovar</Button>}
              {q.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => update(q.id, { status: "rejected" })} className="rounded-full"><X className="w-4 h-4 mr-1" /> Rejeitar</Button>}
              <Button size="sm" variant="ghost" onClick={() => remove(q.id)} className="rounded-full text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-2">
            <Textarea
              placeholder="Escrever resposta..."
              value={answering[q.id] ?? q.answer ?? ""}
              onChange={(e) => setAnswering((s) => ({ ...s, [q.id]: e.target.value }))}
              rows={2}
              className="flex-1"
              maxLength={2000}
            />
            <Button
              onClick={() => update(q.id, { answer: answering[q.id] ?? "", answered_at: new Date().toISOString(), status: "approved" })}
              className="rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90"
            >
              Responder e publicar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    approved: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-red-500/10 text-red-600",
  };
  const label: Record<string, string> = { pending: "PENDENTE", approved: "APROVADO", rejected: "REJEITADO" };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-muted"}`}>{label[status] ?? status.toUpperCase()}</span>;
}
