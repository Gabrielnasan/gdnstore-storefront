import { useEffect, useState } from "react";
import { HelpCircle, Loader2, LogIn, MessageCircleQuestion, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCustomer } from "@/hooks/useCustomer";
import {
  buildLoginUrl,
  getProductQuestions,
  submitProductQuestion,
  type PublicProductQuestion,
} from "@/lib/customerSession";

interface ProductQuestionsProps {
  shopifyProductId: string;
  productHandle?: string;
  returnTo?: string;
}

const MAX = 1000;

export function ProductQuestions({
  shopifyProductId,
  productHandle,
  returnTo,
}: ProductQuestionsProps) {
  const { status, customer } = useCustomer();
  const [questions, setQuestions] = useState<PublicProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await getProductQuestions({
      shopifyProductId,
      productHandle,
    });
    if (res.success) setQuestions(res.questions);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopifyProductId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (value.length < 5) {
      toast.error("Pergunta muito curta", { description: "Use pelo menos 5 caracteres." });
      return;
    }
    setSubmitting(true);
    const res = await submitProductQuestion({
      shopify_product_id: shopifyProductId,
      product_handle: productHandle ?? null,
      question: value,
    });
    setSubmitting(false);
    if (!res.success) {
      if (res.needs_login) {
        window.location.href = buildLoginUrl(returnTo ?? window.location.pathname);
        return;
      }
      toast.error("Não foi possível enviar", {
        description:
          res.error === "question_too_short"
            ? "Pergunta muito curta."
            : res.error === "question_too_long"
              ? "Pergunta muito longa."
              : "Tente novamente em instantes.",
      });
      return;
    }
    setText("");
    setSubmittedMsg(
      "Pergunta enviada! Nossa equipe irá analisar e responder em breve.",
    );
    toast.success("Pergunta enviada", {
      description: "Será analisada antes de aparecer no produto.",
    });
    void load();
  };

  const loginHref = buildLoginUrl(returnTo ?? (typeof window !== "undefined" ? window.location.pathname : "/"));

  return (
    <section className="mt-16 border-t pt-10">
      <div className="mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold">
          Perguntas sobre o produto
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tire suas dúvidas antes de comprar.
        </p>
      </div>

      {/* Form / login CTA */}
      {status === "loading" ? (
        <div className="rounded-2xl border bg-card p-5 md:p-6 mb-8 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : status === "authenticated" ? (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border bg-card p-5 md:p-6 mb-8 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Perguntando como{" "}
              <span className="font-medium text-foreground">
                {customer.display_name || customer.first_name || customer.email || "Cliente"}
              </span>
            </p>
            <span className="text-xs text-muted-foreground">
              {text.length}/{MAX}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="Digite sua pergunta sobre este produto..."
            rows={3}
            maxLength={MAX}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ink transition"
            required
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {submittedMsg ? (
              <p className="text-xs text-success font-medium">{submittedMsg}</p>
            ) : (
              <span className="text-xs text-muted-foreground">
                Mínimo 5 caracteres. Sua pergunta será revisada antes de aparecer.
              </span>
            )}
            <button
              type="submit"
              disabled={submitting || text.trim().length < 5}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-highlight text-highlight-foreground text-sm font-semibold hover:brightness-95 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enviar pergunta
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border bg-card p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <LogIn className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
            <p className="text-sm">
              Entre na sua conta para fazer uma pergunta sobre este produto.
            </p>
          </div>
          <a
            href={loginHref}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition self-start sm:self-auto"
          >
            Entrar para perguntar
          </a>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-2xl">
          <HelpCircle className="w-9 h-9 mx-auto text-muted-foreground/60" />
          <p className="mt-3 font-semibold">
            Ainda não há perguntas sobre este produto.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Seja o primeiro a perguntar.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {questions.map((q, i) => (
            <motion.li
              key={q.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <MessageCircleQuestion className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium whitespace-pre-line">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.customerName ? `${q.customerName} • ` : ""}
                    {formatDate(q.createdAt)}
                  </p>
                  {q.answer ? (
                    <div className="mt-4 pl-4 border-l-2 border-highlight/60">
                      <p className="text-xs font-semibold text-highlight mb-1">
                        Resposta da loja
                        {q.answeredAt ? ` • ${formatDate(q.answeredAt)}` : ""}
                      </p>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">
                        {q.answer}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground italic">
                      Aguardando resposta da loja
                    </p>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
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
