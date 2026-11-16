import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HelpCircle, Loader2, LogIn, MessageCircleQuestion, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { fetchVisibleQuestions, submitQuestion } from "@/lib/reviews";
import { useAuthUser } from "@/hooks/useAuthUser";

export function QuestionsSection({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuthUser();
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions", productId],
    queryFn: () => fetchVisibleQuestions(productId),
    enabled: !!productId,
  });

  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");

  const mutation = useMutation({
    mutationFn: () => submitQuestion({ productId, name: name || undefined, question }),
    onSuccess: () => {
      toast.success("Pergunta enviada", { description: "Sua pergunta foi enviada e será revisada antes de aparecer no site." });
      setQuestion("");
      qc.invalidateQueries({ queryKey: ["questions", productId] });
    },
    onError: (e: Error) => toast.error("Erro ao enviar", { description: e.message }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 5) return toast.error("Pergunta muito curta");
    mutation.mutate();
  };

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Perguntas</h2>

      {authLoading ? (
        <div className="rounded-2xl border bg-card p-5 md:p-6 mb-8 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : !user ? (
        <div className="rounded-2xl border bg-card p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <LogIn className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
            <p className="text-sm">Faça login para enviar uma pergunta sobre este produto.</p>
          </div>
          <Button asChild className="rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border bg-card p-5 md:p-6 mb-8 space-y-4">
          <div>
            <Label htmlFor="q-name" className="mb-2 block text-sm">Nome (opcional)</Label>
            <Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="flex gap-2 items-stretch flex-col md:flex-row">
            <Textarea
              placeholder="Digite sua pergunta..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              rows={2}
              className="flex-1 resize-none"
              required
            />
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl md:rounded-2xl bg-highlight text-highlight-foreground hover:bg-highlight/90 md:px-6 md:self-stretch"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <span className="inline-flex items-center gap-2"><Send className="w-4 h-4" /> Perguntar</span>
              )}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-2xl">
          <HelpCircle className="w-9 h-9 mx-auto text-muted-foreground/60" />
          <p className="mt-3 font-semibold">Ainda não há perguntas</p>
          <p className="text-sm text-muted-foreground mt-1">Faça a primeira pergunta sobre este produto.</p>
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
              className="rounded-2xl border bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <MessageCircleQuestion className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.customer_name ? `${q.customer_name} • ` : ""}{new Date(q.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {q.answer && (
                    <div className="mt-4 pl-4 border-l-2 border-highlight/50">
                      <p className="text-xs font-semibold text-highlight mb-1">Resposta da loja</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">{q.answer}</p>
                    </div>
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
