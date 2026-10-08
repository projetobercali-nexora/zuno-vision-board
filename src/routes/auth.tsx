import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Zuno" },
      { name: "description", content: "Entre ou crie a sua conta no Zuno." },
      { property: "og:title", content: "Entrar — Zuno" },
      { property: "og:description", content: "Entre ou crie a sua conta no Zuno." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "registar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [org, setOrg] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setAEnviar(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/conversas" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin + "/conversas", data: { nome, organizacao: org || undefined } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/conversas" });
        else toast.success("Conta criada! Verifique o seu email para confirmar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-5xl font-extrabold text-brand">Zuno</h1>
          <p className="mt-3 text-lg font-semibold text-foreground">Bem-vindo ao Zuno</p>
          <p className="text-sm text-muted-foreground">{modo === "entrar" ? "Entre na sua conta" : "Crie a sua conta"}</p>
        </div>
        <form onSubmit={submeter} className="space-y-4 rounded-2xl border bg-card p-6 shadow-glow">
          {modo === "registar" && (
            <>
              <div className="space-y-1.5"><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Nome da empresa</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
            </>
          )}
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Palavra-passe</Label><Input type="password" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required /></div>
          <Button type="submit" className="w-full" disabled={aEnviar}>{aEnviar ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}</Button>
          <button type="button" onClick={() => setModo(modo === "entrar" ? "registar" : "entrar")} className="w-full text-sm text-muted-foreground hover:text-primary">
            {modo === "entrar" ? "Ainda não tem conta? Registe-se" : "Já tem conta? Entre"}
          </button>
        </form>
      </div>
    </main>
  );
}
