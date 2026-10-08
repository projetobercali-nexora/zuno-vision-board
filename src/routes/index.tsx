import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zuno — CRM de WhatsApp com IA" },
      { name: "description", content: "O Zuno organiza as suas conversas de WhatsApp e ajuda a vender mais." },
      { property: "og:title", content: "Zuno — CRM de WhatsApp com IA" },
      { property: "og:description", content: "O Zuno organiza as suas conversas de WhatsApp e ajuda a vender mais." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="font-display text-6xl font-extrabold text-brand">Zuno</h1>
      <p className="max-w-sm text-muted-foreground">O CRM de WhatsApp com IA que transforma conversas em vendas.</p>
      <div className="flex gap-3">
        <Button asChild size="lg"><Link to="/conversas">Abrir o Zuno</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/auth">Entrar</Link></Button>
      </div>
    </main>
  );
}
