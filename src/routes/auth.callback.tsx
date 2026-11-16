import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  exchangeCustomerSession,
  setCustomerSessionToken,
} from "@/lib/customerSession";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
  head: () =>
    privateHead(
      "Entrando · GDN Store",
      "Concluindo seu login com segurança na GDN Store.",
    ),
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exchangeCode = params.get("exchange_code");
    const errParam = params.get("error");
    const returnToParam = params.get("return_to") || "/minha-conta";

    if (errParam) {
      setError(errParam);
      return;
    }
    if (!exchangeCode) {
      setError("missing_exchange_code");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await exchangeCustomerSession(exchangeCode);
        if (cancelled) return;
        setCustomerSessionToken(res.session_token);
        // Clean the URL before redirecting away.
        window.history.replaceState(null, "", window.location.pathname);
        const target = res.return_to || returnToParam || "/minha-conta";
        navigate({ to: target, replace: true });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    const friendly =
      error === "callback_failed"
        ? "Não conseguimos concluir o login com a sua conta Shopify. Isso pode acontecer se a sessão expirou ou se a janela ficou aberta por muito tempo."
        : `Houve um erro ao concluir o login (${error}).`;
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Não foi possível entrar</h1>
          <p className="text-sm text-muted-foreground">{friendly}</p>
          <a
            href="/account"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition"
          >
            Tentar novamente
          </a>
          <div>
            <a href="/" className="text-xs text-muted-foreground underline">
              Voltar para a página inicial
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Concluindo seu login com segurança…
      </div>
    </div>
  );
}
