import { createFileRoute, useNavigate, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { privateHead } from "@/lib/pageMeta";

export const Route = createFileRoute("/auth")({
  head: () =>
    privateHead(
      "Acesso administrativo · GDN Store",
      "Login e cadastro da equipe da GDN Store para acessar o painel administrativo da loja.",
    ),
  component: AuthLayout,
});


function AuthLayout() {
  const childMatches = useChildMatches();
  // If a child route (e.g. /auth/callback) is active, render it instead of the admin login.
  if (childMatches.length > 0) return <Outlet />;
  return <AuthPage />;
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin/reviews" });
    });
  }, [navigate]);

  const handle = async (mode: "signin" | "signup") => {
    setLoading(true);
    try {
      const fn = mode === "signin" ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password });
      const { error } = await fn;
      if (error) throw error;
      toast.success(mode === "signin" ? "Bem-vindo!" : "Conta criada");
      navigate({ to: "/admin/reviews" });
    } catch (e) {
      toast.error("Erro", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card p-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-highlight" />
          <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Acesso restrito a moderadores da loja.</p>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 mb-5">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password" className="mb-2 block">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <TabsContent value="signin" className="mt-5">
            <Button onClick={() => handle("signin")} disabled={loading} className="w-full rounded-full bg-ink text-ink-foreground hover:bg-highlight hover:text-highlight-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="mt-5">
            <Button onClick={() => handle("signup")} disabled={loading} className="w-full rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              O primeiro usuário cadastrado se torna automaticamente administrador da loja.
            </p>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
