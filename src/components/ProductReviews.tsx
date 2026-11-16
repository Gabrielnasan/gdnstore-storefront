import { useEffect, useState } from "react";
import { Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { StarRating } from "@/components/StarRating";
import {
  getProductReviews,
  type PublicReview,
  type ReviewSummary,
} from "@/lib/productReviews";

interface ProductReviewsProps {
  shopifyProductId: string;
  productHandle?: string;
}

export function ProductReviews({ shopifyProductId, productHandle }: ProductReviewsProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const [starFilter, setStarFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getProductReviews({ shopifyProductId, productHandle });
      if (cancelled) return;
      if (res.success) {
        setReviews(res.reviews);
        setSummary(res.summary);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [shopifyProductId, productHandle]);

  const visible = starFilter === 0 ? reviews : reviews.filter((r) => r.rating === starFilter);

  return (
    <section className="mt-16 border-t pt-10">
      <div className="mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold">Avaliações do produto</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Apenas clientes que compraram este produto podem avaliá-lo.
        </p>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : summary.totalReviews === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl">
          <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <h3 className="mt-3 font-semibold">Este produto ainda não possui avaliações.</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comprou este produto? Avalie em Minha Conta &rarr; Avaliações.
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-10">
            <div>
              <div className="flex items-end gap-3">
                <span className="text-5xl md:text-6xl font-bold text-highlight tabular-nums leading-none">
                  {summary.averageRating.toFixed(1)}
                </span>
                <div className="pb-1">
                  <StarRating value={summary.averageRating} size={18} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.totalReviews} {summary.totalReviews === 1 ? "avaliação" : "avaliações"}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = summary.ratingCounts[String(s) as "1" | "2" | "3" | "4" | "5"] ?? 0;
                  const pct = summary.totalReviews ? (count / summary.totalReviews) * 100 : 0;
                  const active = starFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStarFilter(active ? 0 : (s as 1 | 2 | 3 | 4 | 5))}
                      className="w-full flex items-center gap-2 group"
                    >
                      <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">{s}★</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${active ? "bg-highlight" : "bg-ink/80 group-hover:bg-highlight"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{count}</span>
                    </button>
                  );
                })}
                {starFilter > 0 && (
                  <button onClick={() => setStarFilter(0)} className="text-xs text-highlight underline mt-2">
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>

            <div>
              {visible.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhuma avaliação corresponde ao filtro.
                </p>
              ) : (
                <div className="space-y-4">
                  {visible.map((r, i) => (
                    <ReviewCard key={r.id} review={r} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ReviewCard({ review, index }: { review: PublicReview; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{review.customerName ?? "Cliente"}</span>
            {review.verifiedPurchase && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> COMPRA VERIFICADA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={review.rating} size={14} />
            <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </header>
      {review.title && <h4 className="font-semibold mt-3">{review.title}</h4>}
      <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">
        {review.body}
      </p>
      {review.media.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {review.media.map((m, i) => (
            <ReviewMediaThumb key={`${review.id}-${i}`} media={m} />
          ))}
        </div>
      )}
    </motion.article>
  );
}

function ReviewMediaThumb({ media }: { media: PublicReview["media"][number] }) {
  if (media.mediaType === "video") {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        className="w-32 h-32 rounded-lg bg-black object-cover"
      />
    );
  }
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="block w-24 h-24 rounded-lg overflow-hidden bg-surface-muted"
    >
      <img
        src={media.url}
        alt="Foto da avaliação"
        loading="lazy"
        className="w-full h-full object-cover hover:scale-105 transition-transform"
      />
    </a>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

