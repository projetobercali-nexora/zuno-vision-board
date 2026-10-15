import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Clock, Flame, Hand, MessageCircle, Plus, StickyNote, Timer, Check, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/kb";
import { useConversas, useOrg } from "@/lib/zuno";
import { TIPOS, haQuanto, useAgora, useAtualizarLembrete, useLembretes, vencido, ativo, NOTIF_KEY, type Lembrete } from "@/lib/lembretes";
import { Carregando, Erro } from "@/components/zuno/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ICONES: Record<string, typeof Bell> = { cliente_espera: Clock, conversa_parada: Timer, lead_quente: Flame, passou_humano: Hand, manual: StickyNote };

export function SinoLembretes({ className }: { className?: string }) {
  const [aberto, setAberto] = useState(false);
  const agora = useAgora();
  const { data } = useLembretes();
  const n = (data ?? []).filter((l) => vencido(l, agora)).length;
  return (
    <>
      <button onClick={() => setAberto(true)} aria-label={`Lembretes (${n} pendentes)`} className={cn("relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground", className)}>
        {n > 0 ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
        {n > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{n > 99 ? "99+" : n}</span>}
      </button>
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {aberto && <Painel fechar={() => setAberto(false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Painel({ fechar }: { fechar: () => void }) {
  const agora = useAgora();
  const q = useLembretes();
  const [sep, setSep] = useState<"pend" | "agen" | "feito">("pend");
  const [tipo, setTipo] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [perm, setPerm] = useState(() => typeof Notification !== "undefined" && Notification.permission === "granted" && localStorage.getItem(NOTIF_KEY) === "1");

  async function ativarNotif() {
    if (typeof Notification === "undefined") return toast.error("Este navegador não suporta notificações.");
    const r = await Notification.requestPermission();
    if (r === "granted") { localStorage.setItem(NOTIF_KEY, "1"); setPerm(true); toast.success("Notificações ativadas."); }
    else toast.error("Permissão recusada no navegador.");
  }

  const todos = q.data ?? [];
  const porSep = todos.filter((l) => sep === "pend" ? vencido(l, agora) : sep === "agen" ? ativo(l) && !vencido(l, agora) : l.estado === "feito");
  const lista = tipo ? porSep.filter((l) => l.tipo === tipo) : porSep;

  return (
    <>
      <SheetHeader className="border-b p-4 text-left">
        <SheetTitle className="font-display">Lembretes</SheetTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Novo lembrete</Button>
          {!perm && <Button size="sm" variant="outline" onClick={ativarNotif}><BellRing className="h-4 w-4" /> Ativar notificações do navegador</Button>}
        </div>
      </SheetHeader>
      <div className="space-y-3 border-b p-4">
        <Tabs value={sep} onValueChange={(v) => setSep(v as typeof sep)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pend">Pendentes</TabsTrigger>
            <TabsTrigger value="agen">Agendados</TabsTrigger>
            <TabsTrigger value="feito">Feitos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={tipo === null ? "default" : "outline"} className="h-7 rounded-full text-xs" onClick={() => setTipo(null)}>Todos</Button>
          {Object.entries(TIPOS).map(([k, v]) => (
            <Button key={k} size="sm" variant={tipo === k ? "default" : "outline"} className="h-7 rounded-full text-xs" onClick={() => setTipo(k)}>{v}</Button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {q.isLoading ? <Carregando /> : q.error ? <Erro erro={q.error} /> : lista.length === 0
          ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum lembrete aqui.</p>
          : lista.map((l) => <Cartao key={l.id} l={l} agora={agora} fechar={fechar} />)}
      </div>
      <NovoLembrete aberto={novo} setAberto={setNovo} />
    </>
  );
}

function Cartao({ l, agora, fechar }: { l: Lembrete; agora: number; fechar: () => void }) {
  const nav = useNavigate();
  const up = useAtualizarLembrete();
  const Icone = ICONES[l.tipo] ?? Bell;
  const cor = l.tipo === "cliente_espera" ? "text-destructive bg-destructive/10" : l.tipo === "conversa_parada" ? "text-amber-400 bg-amber-400/10" : "text-primary bg-primary/10";
  const feito = l.estado === "feito";
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex gap-3">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", cor)}><Icone className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">{l.titulo}</p>
          {l.texto && <p className="mt-0.5 text-sm text-muted-foreground">{l.texto}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {haQuanto(l.criado_em, agora)} · {TIPOS[l.tipo] ?? l.tipo}
            {!feito && new Date(l.vence_em).getTime() > agora && ` · vence ${new Date(l.vence_em).toLocaleString("pt-AO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
            {l.estado === "adiado" && " · adiado"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {l.conversa_id && <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { fechar(); nav({ to: "/conversas", search: { c: l.conversa_id! } }); }}><MessageCircle className="h-3.5 w-3.5" /> Abrir conversa</Button>}
        {!feito && <>
          <Button size="sm" className="h-7 text-xs" disabled={up.isPending} onClick={() => up.mutate({ id: l.id, estado: "feito", resolvido_em: new Date().toISOString() })}><Check className="h-3.5 w-3.5" /> Feito</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={up.isPending} onClick={() => up.mutate({ id: l.id, estado: "adiado", vence_em: new Date(Date.now() + 3600000).toISOString() })}><Clock className="h-3.5 w-3.5" /> Adiar 1 h</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={up.isPending} onClick={() => up.mutate({ id: l.id, estado: "ignorado" })}><X className="h-3.5 w-3.5" /> Ignorar</Button>
        </>}
      </div>
    </div>
  );
}

function localAgora() {
  const d = new Date(Date.now() + 3600000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function NovoLembrete({ aberto, setAberto }: { aberto: boolean; setAberto: (v: boolean) => void }) {
  const qc = useQueryClient();
  const org = useOrg();
  const conversas = useConversas();
  const [conv, setConv] = useState("nenhuma");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [quando, setQuando] = useState(localAgora);
  const criar = useMutation({
    mutationFn: async () => {
      if (!org.data) throw new Error("Organização não encontrada.");
      if (!titulo.trim()) throw new Error("Escreve um título.");
      const c = conversas.data?.find((x) => x.id === conv);
      const { error } = await db.from("lembretes").insert({
        organizacao_id: org.data.organizacaoId, tipo: "manual", estado: "pendente", titulo: titulo.trim(), texto: texto.trim() || null,
        vence_em: new Date(quando).toISOString(), conversa_id: c?.id ?? null, contacto_id: c?.contacto_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lembretes"] }); toast.success("Lembrete criado."); setAberto(false); setTitulo(""); setTexto(""); setConv("nenhuma"); setQuando(localAgora()); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo lembrete</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Contacto / conversa (opcional)</Label>
            <Select value={conv} onValueChange={setConv}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Nenhum</SelectItem>
                {conversas.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.contactos?.nome || c.contactos?.telefone}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ligar ao cliente" /></div>
          <div className="space-y-1.5"><Label>Texto</Label><Textarea value={texto} onChange={(e) => setTexto(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Data e hora</Label><Input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => criar.mutate()} disabled={criar.isPending}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
