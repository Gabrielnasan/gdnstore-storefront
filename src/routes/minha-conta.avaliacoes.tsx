import { privateHead } from "@/lib/pageMeta";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Loader2, LogIn, Send, Star, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/StarRating";
import { getCustomerSessionToken, redirectToLogin } from "@/lib/customerSession";
import {
  REVIEW_LIMITS,
  getReviewableProducts,
  submitProductReview,
  uploadReviewMedia,
  type ReviewableItem,
} from "@/lib/productReviews";

export const Route = createFileRoute("/minha-conta/avaliacoes")({
  ssr: false,
  component: MinhasAvaliacoesPage,
  head: () =>
    privateHead(
      "Minhas avaliações · GDN Store",
      "Avalie produtos comprados na GDN Store e acompanhe suas avaliações enviadas.",
    ),
});

type State =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; items: ReviewableItem[] }
  | { status: "error"; message: string };

function MinhasAvaliacoesPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reviewing, setReviewing] = useState<ReviewableItem | null>(null);

  const load = async () => {
    if (!getCustomerSessionToken()) {
      setState({ status: "anonymous" });
      return;
    }
    setState({ status: "loading" });
    const res = await getReviewableProducts();
    if (!res.success) {
      if (res.needs_login) {
        setState({ status: "anonymous" });
      } else {
        setState({ status: "error", message: res.error });
      }
      return;
    }
    setState({ status: "ready", items: res.items });
  };

  useEffect(() => {
    void load();
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
        <Star className="w-10 h-10 mx-auto text-highlight" />
        <h1 className="font-display text-2xl font-bold">Minhas avaliações</h1>
        <p className="text-muted-foreground">Faça login para avaliar seus produtos comprados.</p>
        <Button
          onClick={() => redirectToLogin("/minha-conta/avaliacoes")}
          className="rounded-full h-11 px-6 bg-ink text-ink-foreground hover:bg-highlight hover:text-highlight-foreground"
        >
          <LogIn className="w-4 h-4 mr-2" /> Entrar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14 space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Minhas avaliações</h1>
        <p className="text-sm text-muted-foreground">
          Avalie os produtos que você comprou. Suas avaliações ajudam outros clientes.
        </p>
        <Link to="/minha-conta" className="text-xs text-highlight underline">
          ← Voltar para Minha Conta
        </Link>
      </header>

      {state.status === "error" ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar: {state.message}</p>
          <Button onClick={load} variant="outline" className="mt-4 rounded-full">
            Tentar novamente
          </Button>
        </div>
      ) : state.items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <Star className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <p className="mt-4 font-semibold">
            Você ainda não possui produtos disponíveis para avaliação.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Após uma compra paga, você poderá avaliar os produtos aqui.
          </p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {state.items.map((it, i) => (
            <li
              key={`${it.shopifyOrderId}-${it.shopifyProductId}-${i}`}
              className="rounded-2xl border bg-card p-4 shadow-sm flex gap-4"
            >
              <div className="w-20 h-20 rounded-xl bg-surface-muted overflow-hidden shrink-0">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.productTitle} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="font-semibold truncate" title={it.productTitle}>
                  {it.productTitle}
                </div>
                {it.variantTitle && (
                  <div className="text-xs text-muted-foreground truncate">{it.variantTitle}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Pedido {it.shopifyOrderName}
                  {it.processedAt ? ` · ${new Date(it.processedAt).toLocaleDateString("pt-BR")}` : ""}
                </div>
                <div className="mt-auto pt-3">
                  <Button
                    size="sm"
                    onClick={() => setReviewing(it)}
                    className="rounded-full bg-highlight text-highlight-foreground hover:brightness-95"
                  >
                    <Star className="w-4 h-4 mr-1" /> Avaliar produto
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReviewDialog
        item={reviewing}
        onClose={() => setReviewing(null)}
        onSubmitted={async () => {
          setReviewing(null);
          await load();
        }}
      />
    </div>
  );
}

function ReviewDialog({
  item,
  onClose,
  onSubmitted,
}: {
  item: ReviewableItem | null;
  onClose: () => void;
  onSubmitted: () => void | Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setRating(0);
      setTitle("");
      setBody("");
      setImages([]);
      setVideo(null);
    }
  }, [item?.shopifyOrderId, item?.shopifyProductId]);

  if (!item) return null;

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const valid: File[] = [];
    for (const f of arr) {
      if (!(REVIEW_LIMITS.imageMimes as readonly string[]).includes(f.type.toLowerCase())) {
        toast.error(`Formato não suportado: ${f.name}`);
        continue;
      }
      if (f.size > REVIEW_LIMITS.maxImageBytes) {
        toast.error(`Imagem maior que 5 MB: ${f.name}`);
        continue;
      }
      valid.push(f);
    }
    setImages((prev) => [...prev, ...valid].slice(0, REVIEW_LIMITS.maxImages));
  };

  const setVideoFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!(REVIEW_LIMITS.videoMimes as readonly string[]).includes(f.type.toLowerCase())) {
      toast.error("Formato de vídeo não suportado (mp4, webm, mov).");
      return;
    }
    if (f.size > REVIEW_LIMITS.maxVideoBytes) {
      toast.error("Vídeo maior que 50 MB.");
      return;
    }
    setVideo(f);
  };

  const submit = async () => {
    if (rating < 1 || rating > 5) return toast.error("Selecione uma nota de 1 a 5.");
    if (body.trim().length < 10) return toast.error("Comentário muito curto (mínimo 10 caracteres).");
    if (body.length > 3000) return toast.error("Comentário muito longo.");
    if (title.length > 120) return toast.error("Título muito longo.");

    setSubmitting(true);
    try {
      const uploads = [];
      let order = 0;
      for (const img of images) {
        uploads.push(await uploadReviewMedia(img, order++));
      }
      if (video) uploads.push(await uploadReviewMedia(video, order++));

      const res = await submitProductReview({
        shopify_order_id: item.shopifyOrderId,
        shopify_order_name: item.shopifyOrderName,
        shopify_product_id: item.shopifyProductId,
        shopify_variant_id: item.shopifyVariantId,
        product_handle: item.productHandle ?? null,
        product_title: item.productTitle,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        media: uploads,
      });
      if (!res.success) {
        if (res.needs_login) {
          redirectToLogin("/minha-conta/avaliacoes");
          return;
        }
        toast.error("Não foi possível enviar", {
          description: res.message || res.error,
        });
        return;
      }
      toast.success("Avaliação enviada!", {
        description: "Ela será analisada antes de aparecer no produto.",
      });
      await onSubmitted();
    } catch (e) {
      toast.error("Falha ao enviar avaliação", { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar produto</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{item.productTitle}</p>
          <p className="text-xs text-muted-foreground">
            Pedido {item.shopifyOrderName}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label className="mb-2 block">Nota *</Label>
            <StarRating value={rating} size={32} onChange={setRating} />
          </div>
          <div>
            <Label htmlFor="rv-title" className="mb-2 block">Título (opcional)</Label>
            <Input
              id="rv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Resuma sua experiência"
            />
          </div>
          <div>
            <Label htmlFor="rv-body" className="mb-2 block">Comentário *</Label>
            <Textarea
              id="rv-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={3000}
              placeholder="Conte como foi sua experiência com o produto..."
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{body.length}/3000</p>
          </div>

          <div>
            <Label className="mb-2 block">Fotos (até {REVIEW_LIMITS.maxImages} · máx 5 MB cada)</Label>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer hover:bg-accent text-sm">
              <Camera className="w-4 h-4" />
              Adicionar fotos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => addImages(e.target.files)}
              />
            </label>
            {images.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {images.map((f, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-muted">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      aria-label="Remover"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Vídeo (opcional · 1 · máx 50 MB)</Label>
            {!video ? (
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer hover:bg-accent text-sm">
                <Video className="w-4 h-4" />
                Adicionar vídeo
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files)}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border bg-surface-muted p-3">
                <Video className="w-5 h-5 text-highlight" />
                <span className="text-sm truncate flex-1">{video.name}</span>
                <button
                  onClick={() => setVideo(null)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-full">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="rounded-full bg-highlight text-highlight-foreground hover:brightness-95"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
