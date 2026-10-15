import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Columns3, Users, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SinoLembretes } from "@/components/zuno/Lembretes";
import { useLembretesTempoReal } from "@/lib/lembretes";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

const itens = [
  { to: "/conversas", label: "Conversas", icon: MessageCircle },
  { to: "/funil", label: "Funil", icon: Columns3 },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/definicoes", label: "Definições", icon: Settings },
] as const;

function Shell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  useLembretesTempoReal();
  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex h-dvh flex-col bg-background md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-8 flex items-center justify-between px-2">
          <span className="font-display text-3xl font-extrabold text-brand">Zuno</span>
          <SinoLembretes />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {itens.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-primary" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <button onClick={sair} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <nav className="grid shrink-0 grid-cols-4 border-t bg-sidebar md:hidden">
        {itens.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
