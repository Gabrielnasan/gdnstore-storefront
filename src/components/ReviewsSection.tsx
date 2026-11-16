import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BadgeCheck, Camera, Loader2, LogIn, MessageSquare, ShieldCheck, Sparkles, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/StarRating";
import { fetchApprovedReviews, submitReview, summarize, verifyPurchase, type Review } from "@/lib/reviews";
import { useAuthUser } from "@/hooks/useAuthUser";

type SortKey = "newest" | "highest" | "lowest" | "photos";
type StarFilter = 0 | 1 | 2 | 3 | 4 | 5;

export function ReviewsSection({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuthUser();
  const [verifying, setVerifying] = useState(false);
  const [purchaseVerified, setPurchaseVerified] = useState<boolean | null>(null);
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchApprovedReviews(productId),
    enabled: !!productId,
  });

  const handleOpenForm = async () => {
    if (showForm) { setShowForm(false); return; }
    if (!user) return;
    setVerifying(true);
    try {
      const ok = await verifyPurchase(productId);
      setPurchaseVerified(ok);
      if (!ok) {
        toast.error("Apenas clientes que compraram este produto podem avaliá-lo.");
        return;
      }
      setShowForm(true);
    } catch (e) {
      toast.error("Não foi possível verificar sua compra", { description: (e as Error).message });
    } finally {
      setVerifying(false);
    }
  };

  const [sort, setSort] = useState<SortKey>("newest");
  const [starFilter, setStarFilter] = useState<StarFilter>(0);
  const [showForm, setShowForm] = useState(false);

  const summary = useMemo(() => summarize(reviews), [reviews]);
  const photos = useMemo(
    () => reviews.flatMap((r) => (r.photos ?? []).map((p) => ({ ...p, rating: r.rating }))).filter((p) => p.signedUrl),
    [reviews]
  );

  const visible = useMemo(() => {
    let list = [...reviews];
    if (starFilter > 0) list = list.filter((r) => r.rating === starFilter);
    switch (sort) {
      case "highest":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        list.sort((a, b) => a.rating - b.rating);
        break;
      case "photos":
        list = list.filter((r) => (r.photos?.length ?? 0) > 0);
        break;
      default:
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [reviews, sort, starFilter]);

  const aiSummary = useMemo(() => buildSummary(reviews), [reviews]);

  return (
    <section className="mt-16 border-t pt-10">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h2 className="font-display text-2xl md:text-3xl font-bold">Opiniões do produto</h2>
        {authLoading ? null : !user ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/auth"><LogIn className="w-4 h-4 mr-2" />Entrar para avaliar</Link>
          </Button>
        ) : (
          <Button onClick={handleOpenForm} disabled={verifying} variant="outline" className="rounded-full">
            {verifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : showForm ? "Fechar" : "Escrever avaliação"}
          </Button>
        )}
      </div>

      {!authLoading && !user && (
        <div className="rounded-2xl border bg-card p-5 mb-6 flex items-start gap-3 text-sm">
          <LogIn className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
          <p>Você precisa estar logado e ter comprado este produto para deixar uma avaliação.</p>
        </div>
      )}
      {user && purchaseVerified === false && !showForm && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 mb-6 flex items-start gap-3 text-sm">
          <ShieldCheck className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p>Apenas clientes que compraram este produto podem deixar uma avaliação.</p>
        </div>
      )}

      {showForm && <ReviewForm productId={productId} onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["reviews", productId] }); }} />}

      {isLoading ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : summary.total === 0 ? (
        <EmptyState onWrite={handleOpenForm} canWrite={!!user} />
      ) : (
        <>
          <div className="grid md:grid-cols-[260px_1fr] gap-8 md:gap-12">
            {/* Summary */}
            <div>
              <div className="flex items-end gap-3">
                <span className="text-5xl md:text-6xl font-bold text-highlight tabular-nums leading-none">{summary.avg.toFixed(1)}</span>
                <div className="pb-1">
                  <StarRating value={summary.avg} size={18} />
                  <p className="text-xs text-muted-foreground mt-1">{summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}</p>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = summary.distribution[s as 1 | 2 | 3 | 4 | 5];
                  const pct = summary.total ? (count / summary.total) * 100 : 0;
                  const active = starFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStarFilter(active ? 0 : (s as StarFilter))}
                      className="w-full flex items-center gap-2 group"
                    >
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${active ? "bg-highlight" : "bg-ink/80 group-hover:bg-highlight"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{s} ★</span>
                    </button>
                  );
                })}
                {starFilter > 0 && (
                  <button onClick={() => setStarFilter(0)} className="text-xs text-highlight underline mt-2">Limpar filtro</button>
                )}
              </div>
            </div>

            {/* Photos + AI summary */}
            <div>
              {photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Opiniões com fotos</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                    {photos.slice(0, 12).map((p) => (
                      <div key={p.id} className="relative shrink-0 w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden bg-surface-muted snap-start">
                        <img src={p.signedUrl} alt="Foto da avaliação" loading="lazy" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          {p.rating} ★
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiSummary && (
                <div className="rounded-2xl border bg-surface-muted/40 p-4 md:p-5">
                  <p className="text-sm md:text-[15px] leading-relaxed text-foreground/90">{aiSummary}</p>
                  <p className="mt-3 text-xs font-medium text-highlight inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Resumo gerado a partir das avaliações aprovadas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls + list */}
          <div className="mt-10">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <h3 className="font-semibold text-lg">Opiniões <span className="text-sm text-muted-foreground font-normal">({visible.length})</span></h3>
              <div className="flex gap-2">
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="rounded-full h-9 w-[150px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="highest">Maior nota</SelectItem>
                    <SelectItem value="lowest">Menor nota</SelectItem>
                    <SelectItem value="photos">Com fotos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma avaliação corresponde ao filtro.</p>
            ) : (
              <div className="space-y-5">
                {visible.map((r, i) => <ReviewItem key={r.id} review={r} index={i} />)}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function ReviewItem({ review, index }: { review: Review; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
      className="rounded-2xl border bg-card p-5 md:p-6"
    >
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{review.customer_name}</span>
            {review.verified_purchase && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">COMPRA VERIFICADA</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={review.rating} size={14} />
            <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </header>
      {review.title && <h4 className="font-semibold mt-3">{review.title}</h4>}
      <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">{review.comment}</p>
      {review.photos && review.photos.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {review.photos.map((p) => (
            <a key={p.id} href={p.signedUrl} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden bg-surface-muted">
              <img src={p.signedUrl} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </a>
          ))}
        </div>
      )}
      <footer className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <ThumbsUp className="w-3.5 h-3.5" /> Útil ({review.helpful_count})
      </footer>
    </motion.article>
  );
}

function EmptyState({ onWrite, canWrite }: { onWrite: () => void; canWrite: boolean }) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-2xl">
      <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/60" />
      <h3 className="mt-3 font-semibold">Ainda não há avaliações</h3>
      <p className="text-sm text-muted-foreground mt-1">Seja a primeira pessoa a avaliar este produto.</p>
      {canWrite ? (
        <Button onClick={onWrite} className="mt-5 rounded-full">Escrever a primeira avaliação</Button>
      ) : (
        <Button asChild className="mt-5 rounded-full">
          <Link to="/auth"><LogIn className="w-4 h-4 mr-2" />Entrar para avaliar</Link>
        </Button>
      )}
    </div>
  );
}

function ReviewForm({ productId, onSuccess }: { productId: string; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: () => submitReview({ productId, name, rating, title: title || undefined, comment, files }),
    onSuccess: () => {
      toast.success("Obrigado!", { description: "Sua avaliação foi enviada e aparecerá após aprovação." });
      onSuccess();
    },
    onError: (e: Error) => toast.error("Erro ao enviar", { description: e.message }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return toast.error("Selecione uma nota de 1 a 5");
    if (name.trim().length < 2) return toast.error("Informe seu nome");
    if (comment.trim().length < 10) return toast.error("Comentário muito curto (mínimo 10 caracteres)");
    mutation.mutate();
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      onSubmit={submit}
      className="rounded-2xl border bg-card p-5 md:p-6 mb-8 space-y-4"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
        <BadgeCheck className="w-3.5 h-3.5" /> COMPRA VERIFICADA
      </div>
      <h3 className="font-semibold text-lg">Sua avaliação</h3>
      <div>
        <Label className="mb-2 block">Nota *</Label>
        <StarRating value={rating} size={28} onChange={setRating} />
      </div>
      <div>
        <Label htmlFor="rv-name" className="mb-2 block">Nome *</Label>
        <Input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
      </div>
      <div>
        <Label htmlFor="rv-title" className="mb-2 block">Título (opcional)</Label>
        <Input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="rv-comment" className="mb-2 block">Comentário *</Label>
        <Textarea id="rv-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={4} required />
        <p className="text-xs text-muted-foreground mt-1">{comment.length}/2000</p>
      </div>
      <div>
        <Label className="mb-2 block">Fotos (opcional, até 4 — jpg, png, webp, máx 5MB cada)</Label>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer hover:bg-accent text-sm">
          <Camera className="w-4 h-4" />
          {files.length > 0 ? `${files.length} arquivo(s)` : "Adicionar fotos"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 4))}
          />
        </label>
      </div>
      <Button type="submit" disabled={mutation.isPending} className="rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90">
        {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : "Enviar avaliação"}
      </Button>
    </motion.form>
  );
}

function buildSummary(reviews: Review[]): string | null {
  if (reviews.length < 2) return null;
  const summary = summarize(reviews);
  const positives = reviews.filter((r) => r.rating >= 4).length;
  const ratio = positives / reviews.length;
  const tone =
    ratio >= 0.85
      ? "muito bem avaliado pelos clientes, com destaque para qualidade e desempenho"
      : ratio >= 0.6
      ? "geralmente bem avaliado, com a maioria dos clientes satisfeitos"
      : "avaliações mistas — leia os comentários abaixo para conhecer prós e contras";
  return `Com média ${summary.avg.toFixed(1)} em ${summary.total} ${summary.total === 1 ? "avaliação" : "avaliações"}, este produto é ${tone}.`;
}
