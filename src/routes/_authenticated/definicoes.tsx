import { useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, BarChart3, Bell, Bot, Building2, CalendarClock, CheckCircle2, ChevronRight, Circle, ClipboardList,
  Clock, Gauge, HelpCircle, Image, LogOut, MessageSquareHeart, Mic, Package, PackageMinus, PackagePlus, Repeat,
  Search, Shield, ShieldCheck, Star, Target, Timer, Truck, UserRound, Users, AlertTriangle, ListOrdered, Handshake, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/zuno";
import { useAdmin, useKbLista, useKbUnica, type Linha } from "@/lib/kb";
import { Carregando, Erro, Cabecalho } from "@/components/zuno/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InterruptorAgente, TabIdentidade, TabNegocio, TabTom } from "@/components/zuno/kb/FormulariosUnicos";
import { TabEstrategia, TabPassarHumano, TabPerguntas, TabProdutos, TabRegras } from "@/components/zuno/kb/Listas";
import { TabMidia } from "@/components/zuno/kb/Midia";

type Seccao = "identidade" | "tom" | "regras" | "humano" | "estrategia" | "negocio" | "perguntas" | "midia" | "produtos";
const SECCOES: Record<Seccao, string> = {
  identidade: "Identidade", tom: "Tom de voz", regras: "Regras", humano: "Passar a humano", estrategia: "Estratégia",
  negocio: "Perfil do negócio", perguntas: "Perguntas frequentes", midia: "Mídia", produtos: "Produtos e serviços",
};

export const Route = createFileRoute("/_authenticated/definicoes")({
  validateSearch: (s: Record<string, unknown>): { s?: Seccao } =>
    typeof s["s"] === "string" && s["s"] in SECCOES ? { s: s["s"] as Seccao } : {},
  head: () => ({ meta: [{ title: "Definições — Zuno" }, { name: "description", content: "Definições do agente e do negócio no Zuno." }] }),
  component: DefinicoesPage,
});

const ativos = (l?: Linha[]) => (l ?? []).filter((x) => x.ativo).length;

function DefinicoesPage() {
  const { s } = Route.useSearch();
  const org = useOrg();
  const admin = useAdmin();
  if (org.isLoading || admin.isLoading) return <Carregando />;
  if (org.error) return <Erro erro={org.error} />;
  const ad = !!admin.data;
  if (s) return <PaginaSeccao s={s} admin={ad} />;
  return <Painel admin={ad} />;
}

function PaginaSeccao({ s, admin }: { s: Seccao; admin: boolean }) {
  const corpo: Record<Seccao, ReactNode> = {
    identidade: <TabIdentidade admin={admin} />, tom: <TabTom admin={admin} />, regras: <TabRegras admin={admin} />,
    humano: <TabPassarHumano admin={admin} />, estrategia: <TabEstrategia admin={admin} />, negocio: <TabNegocio admin={admin} />,
    perguntas: <TabPerguntas admin={admin} />, midia: <TabMidia admin={admin} />, produtos: <TabProdutos admin={admin} />,
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-2 py-2 md:px-4">
        <Button asChild variant="ghost" size="sm"><Link to="/definicoes" search={{}}><ArrowLeft className="h-4 w-4" /> Definições</Link></Button>
        <h1 className="font-display text-lg font-semibold">{SECCOES[s]}</h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-4 pb-0">{corpo[s]}<div className="h-10" /></div>
      </div>
    </div>
  );
}

type CartaoDef = { titulo: string; texto: string; icone: typeof Bot; estado?: ReactNode; s?: Seccao; extra?: ReactNode };

function Painel({ admin }: { admin: boolean }) {
  const org = useOrg();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const ag = useKbUnica("kb_agente");
  const ng = useKbUnica("kb_negocio");
  const pr = useKbLista("kb_produtos", "ordem");
  const fq = useKbLista("kb_faq");
  const md = useKbLista("kb_midias");
  const rg = useKbLista("kb_regras", "ordem");
  const ph = useKbLista("kb_passar_humano", "gatilho");
  const qs = [ag, ng, pr, fq, md, rg, ph];
  const erro = qs.find((q) => q.error)?.error;
  const carregando = qs.some((q) => q.isLoading);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const n = (q: { isLoading: boolean; data?: Linha[] | undefined }, um: string, varios: string) => {
    if (q.isLoading) return "…";
    const c = ativos(q.data);
    return `${c} ${c === 1 ? um : varios}`;
  };
  const ligado = ag.data?.modo === "ligado";

  const grupos: { titulo: string; texto: string; cartoes: CartaoDef[] }[] = [
    { titulo: "Agente IA", texto: "Como o agente se comporta e fala com os clientes.", cartoes: [
      { titulo: "Estado do agente", texto: "Liga ou desliga as respostas automáticas.", icone: Bot,
        estado: <Badge variant={ligado ? "default" : "secondary"}>{ligado ? "Ligado" : "Desligado"}</Badge>, extra: <InterruptorAgente admin={admin} /> },
      { titulo: "Identidade", texto: "Nome, apresentação, saudação e despedida.", icone: UserRound, s: "identidade", estado: ag.data?.nome || "Sem nome" },
      { titulo: "Tom de voz", texto: "Tom, emojis, tamanho e pausas das respostas.", icone: Mic, s: "tom" },
      { titulo: "Regras", texto: "O que o agente deve e não deve fazer.", icone: ShieldCheck, s: "regras", estado: n(rg, "ativa", "ativas") },
      { titulo: "Passar a humano", texto: "Situações em que a conversa passa a um colega.", icone: Handshake, s: "humano", estado: n(ph, "ativa", "ativas") },
      { titulo: "Estratégia", texto: "As jogadas do Jev em cada fase da venda.", icone: Target, s: "estrategia", estado: "5 jogadas" },
    ] },
    { titulo: "Negócio", texto: "O que o agente sabe sobre a tua empresa.", cartoes: [
      { titulo: "Perfil do negócio", texto: "Descrição, entregas, pagamentos e contactos.", icone: Building2, s: "negocio" },
      { titulo: "Perguntas frequentes", texto: "Respostas prontas às dúvidas comuns.", icone: HelpCircle, s: "perguntas", estado: n(fq, "ativa", "ativas") },
      { titulo: "Mídia", texto: "Fotos, vídeos e documentos para enviar.", icone: Image, s: "midia", estado: n(md, "ficheiro", "ficheiros") },
      { titulo: "Horário de atendimento", texto: "Quando o agente e a equipa respondem.", icone: Clock },
    ] },
    { titulo: "Catálogo e stock", texto: "Produtos, quantidades e reposições.", cartoes: [
      { titulo: "Produtos e serviços", texto: "O que vendes, com preços e categorias.", icone: Package, s: "produtos", estado: n(pr, "ativo", "ativos") },
      { titulo: "Entradas", texto: "Registo de mercadoria recebida.", icone: PackagePlus },
      { titulo: "Saídas", texto: "Registo de mercadoria vendida.", icone: PackageMinus },
      { titulo: "Alerta de stock baixo", texto: "Aviso quando um produto está a acabar.", icone: AlertTriangle },
      { titulo: "Lista de espera", texto: "Clientes à espera de reposição.", icone: ListOrdered },
    ] },
    { titulo: "Equipa", texto: "Quem trabalha contigo no Zuno.", cartoes: [
      { titulo: "Funcionários", texto: "Pessoas com acesso ao painel.", icone: Users },
      { titulo: "Funções", texto: "Atendente, vendedor, gestor.", icone: ClipboardList },
      { titulo: "Disponibilidade", texto: "Quem está disponível para atender.", icone: CalendarClock },
      { titulo: "Permissões", texto: "O que cada pessoa pode ver e mudar.", icone: Shield },
      { titulo: "Metas", texto: "Objetivos de vendas da equipa.", icone: Gauge },
    ] },
    { titulo: "Automações", texto: "Mensagens enviadas automaticamente.", cartoes: [
      { titulo: "Follow-up", texto: "Voltar a contactar quem não respondeu.", icone: Repeat },
      { titulo: "Lembretes", texto: "Avisos de pagamentos e encontros.", icone: Bell },
      { titulo: "Confirmação de entrega", texto: "Confirmar que a encomenda chegou.", icone: Truck },
      { titulo: "Avaliação de 1 a 5", texto: "Pedir ao cliente uma nota.", icone: Star },
      { titulo: "Relatório ao cliente", texto: "Resumo da compra enviado ao cliente.", icone: FileText },
    ] },
    { titulo: "Relatórios e conta", texto: "Desempenho e dados da tua conta.", cartoes: [
      { titulo: "Organização", texto: `${org.data?.organizacaoNome ?? ""} · ${org.data?.email ?? ""}`, icone: Building2, estado: admin ? "Administrador" : "Atendente" },
      { titulo: "Relatórios de vendas", texto: "Vendas por período e produto.", icone: BarChart3 },
      { titulo: "Tempo de resposta", texto: "Quanto demora a primeira resposta.", icone: Timer },
      { titulo: "Entregas", texto: "Estado das entregas.", icone: Truck },
      { titulo: "Notas dos clientes", texto: "Média das avaliações recebidas.", icone: MessageSquareHeart },
      { titulo: "Notificações", texto: "Como e quando recebes avisos.", icone: Bell },
    ] },
  ];

  const t = busca.trim().toLowerCase();
  const filtrados = grupos
    .map((g) => ({ ...g, cartoes: t ? g.cartoes.filter((c) => `${c.titulo} ${c.texto} ${g.titulo}`.toLowerCase().includes(t)) : g.cartoes }))
    .filter((g) => g.cartoes.length);

  const prontidao: [string, boolean, Seccao][] = [
    ["Identidade preenchida", !!String(ag.data?.nome ?? "").trim() && !!String(ag.data?.apresentacao ?? "").trim(), "identidade"],
    ["Perfil do negócio preenchido", !!String(ng.data?.descricao ?? "").trim() && !!String(ng.data?.o_que_vende ?? "").trim(), "negocio"],
    ["Pelo menos 1 produto ativo", ativos(pr.data) >= 1, "produtos"],
    ["Pelo menos 3 perguntas ativas", ativos(fq.data) >= 3, "perguntas"],
    ["Pelo menos 1 mídia ativa", ativos(md.data) >= 1, "midia"],
  ];
  const pct = Math.round((prontidao.filter(([, ok]) => ok).length / prontidao.length) * 100);

  return (
    <div className="flex h-full flex-col">
      <Cabecalho titulo="Definições" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-4 pb-10">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar definições" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>

          {erro ? <Erro erro={erro} /> : carregando ? <Carregando texto="A verificar prontidão..." /> : (
            <div className="rounded-2xl border border-primary/30 bg-card p-4 shadow-glow">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold">Prontidão do agente</p>
                <span className="font-display font-bold text-primary">{pct}%</span>
              </div>
              <Progress value={pct} className="mt-2 h-1.5" />
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {prontidao.map(([txt, ok, sec]) => (
                  <li key={txt}>
                    <Link to="/definicoes" search={{ s: sec }} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-secondary">
                      {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className={ok ? "" : "text-muted-foreground"}>{txt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {filtrados.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma definição encontrada.</p>}

          {filtrados.map((g) => (
            <section key={g.titulo} className="space-y-3">
              <div>
                <h2 className="font-display text-base font-semibold">{g.titulo}</h2>
                <p className="text-sm text-muted-foreground">{g.texto}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {g.cartoes.map((c) => <CartaoDefinicao key={c.titulo} c={c} />)}
              </div>
              {g.titulo === "Relatórios e conta" && (
                <Button variant="outline" onClick={sair} className="w-full md:w-auto"><LogOut className="h-4 w-4" /> Sair</Button>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function CartaoDefinicao({ c }: { c: CartaoDef }) {
  const breve = !c.s && !c.extra && c.titulo !== "Organização";
  const Icone = c.icone;
  const dentro = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icone className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{c.titulo}</p>
          {breve ? <Badge variant="outline">Em breve</Badge> : typeof c.estado === "string" ? <Badge variant="secondary" className="max-w-[10rem] truncate">{c.estado}</Badge> : c.estado}
        </div>
        <p className="truncate text-sm text-muted-foreground">{c.texto}</p>
      </div>
      {c.extra}
      {c.s && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl border bg-card p-4 text-left";
  if (c.s) return <Link to="/definicoes" search={{ s: c.s }} className={`${cls} transition-colors hover:border-primary/50`}>{dentro}</Link>;
  return <div className={`${cls} ${breve ? "pointer-events-none opacity-50" : ""}`} aria-disabled={breve}>{dentro}</div>;
}
