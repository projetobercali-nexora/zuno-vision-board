import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, UserRound, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useConversas, useEstagios, useOrg, hora, iniciais, type ConversaComContacto, type Mensagem } from "@/lib/zuno";
import { Carregando, Erro, Vazio, Cabecalho } from "@/components/zuno/Estados";
import { FichaCliente } from "@/components/zuno/FichaCliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/conversas")({
  head: () => ({ meta: [{ title: "Conversas — Zuno" }, { name: "description", content: "As suas conversas no Zuno." }] }),
  component: ConversasPage,
});

function ConversasPage() {
  const qc = useQueryClient();
  const conversas = useConversas();
  const { data: estagios } = useEstagios();
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    const ch = supabase
      .channel("zuno-conversas")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversas" }, () => qc.invalidateQueries({ queryKey: ["conversas"] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, (p) => {
        qc.invalidateQueries({ queryKey: ["conversas"] });
        qc.invalidateQueries({ queryKey: ["mensagens", (p.new as Mensagem).conversa_id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const sel = conversas.data?.find((c) => c.id === selId) ?? null;
  const nomeEstagio = (id: string | null) => estagios?.find((e) => e.id === id)?.nome;

  return (
    <div className="flex h-full">
      <section className={cn("flex w-full min-w-0 flex-col border-r md:w-80 md:shrink-0", sel && "hidden md:flex")}>
        <Cabecalho titulo="Conversas" />
        <div className="flex-1 overflow-y-auto">
          {conversas.isLoading ? <Carregando /> : conversas.error ? <Erro erro={conversas.error} />
            : !conversas.data?.length ? <Vazio titulo="Ainda sem conversas" texto="Vá a Definições e gere dados de teste para ver o Zuno a funcionar." />
            : conversas.data.map((c) => (
              <button key={c.id} onClick={() => setSelId(c.id)} className={cn("flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-muted", c.id === selId && "bg-muted")}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-semibold">{iniciais(c.contactos?.nome)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium">{c.contactos?.nome ?? c.contactos?.telefone}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{hora(c.ultima_mensagem_em)}</span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{c.ultima ?? "Sem mensagens"}</p>
                  {nomeEstagio(c.estagio_id) && <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">{nomeEstagio(c.estagio_id)}</span>}
                </div>
              </button>
            ))}
        </div>
      </section>

      <section className={cn("min-w-0 flex-1 flex-col", sel ? "flex" : "hidden md:flex")}>
        {sel ? <Chat key={sel.id} conversa={sel} onVoltar={() => setSelId(null)} /> : <Vazio titulo="Escolha uma conversa" texto="Selecione uma conversa à esquerda para abrir o chat." />}
      </section>

      {sel && (
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l xl:block">
          <FichaCliente conversa={sel} />
        </aside>
      )}
    </div>
  );
}

function Chat({ conversa, onVoltar }: { conversa: ConversaComContacto; onVoltar: () => void }) {
  const qc = useQueryClient();
  const { data: org } = useOrg();
  const [texto, setTexto] = useState("");
  const [fichaAberta, setFichaAberta] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  const msgs = useQuery({
    queryKey: ["mensagens", conversa.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mensagens").select("*").eq("conversa_id", conversa.id).order("criado_em");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [msgs.data]);

  const setIa = useMutation({
    mutationFn: async (ia_ativa: boolean) => {
      const { error } = await supabase.from("conversas").update({ ia_ativa }).eq("id", conversa.id);
      if (error) throw error;
      return ia_ativa;
    },
    onSuccess: (v) => { qc.invalidateQueries({ queryKey: ["conversas"] }); toast.success(v ? "IA do Zuno ativada" : "IA do Zuno pausada"); },
    onError: (e) => toast.error(e.message),
  });

  const enviar = useMutation({
    mutationFn: async (t: string) => {
      if (!org) throw new Error("Organização não carregada");
      const { error } = await supabase.from("mensagens").insert({ organizacao_id: org.organizacaoId, conversa_id: conversa.id, remetente: "humano", texto: t });
      if (error) throw error;
      await supabase.from("conversas").update({ ultima_mensagem_em: new Date().toISOString() }).eq("id", conversa.id);
    },
    onSuccess: () => { setTexto(""); qc.invalidateQueries({ queryKey: ["mensagens", conversa.id] }); qc.invalidateQueries({ queryKey: ["conversas"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onVoltar} aria-label="Voltar"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold">{conversa.contactos?.nome ?? conversa.contactos?.telefone}</p>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={conversa.ia_ativa} onCheckedChange={(v) => setIa.mutate(v)} />
            {conversa.ia_ativa ? <span className="text-primary">IA do Zuno ativa</span> : "IA do Zuno pausada"}
          </label>
        </div>
        {conversa.ia_ativa && <Button size="sm" variant="secondary" onClick={() => setIa.mutate(false)}><UserRound className="h-4 w-4" /> <span className="hidden sm:inline">Assumir conversa</span></Button>}
        <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setFichaAberta(true)} aria-label="Ficha do cliente"><Info className="h-5 w-5" /></Button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.isLoading ? <Carregando /> : msgs.error ? <Erro erro={msgs.error} />
          : !msgs.data?.length ? <Vazio titulo="Sem mensagens" texto="Escreva a primeira mensagem." />
          : msgs.data.map((m) => <Balao key={m.id} m={m} />)}
        <div ref={fim} />
      </div>

      <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); const t = texto.trim(); if (t) enviar.mutate(t); }}>
        <Input placeholder="Escreva uma mensagem..." value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Button type="submit" size="icon" disabled={enviar.isPending || !texto.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
      </form>

      <Sheet open={fichaAberta} onOpenChange={setFichaAberta}>
        <SheetContent className="overflow-y-auto p-0">
          <SheetHeader className="px-4 pt-4"><SheetTitle>Ficha do cliente</SheetTitle></SheetHeader>
          <FichaCliente conversa={conversa} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function Balao({ m }: { m: Mensagem }) {
  const direita = m.remetente !== "cliente";
  const estilo = m.remetente === "cliente" ? "bg-bubble-cliente text-foreground rounded-bl-sm"
    : m.remetente === "agente" ? "bg-bubble-agente text-foreground rounded-br-sm"
    : "bg-bubble-humano text-primary-foreground rounded-br-sm";
  const quem = m.remetente === "agente" ? "IA do Zuno" : m.remetente === "humano" ? "Você" : null;
  return (
    <div className={cn("flex", direita ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", estilo)}>
        {quem && <p className="mb-0.5 text-[11px] font-semibold opacity-80">{quem}</p>}
        <p className="whitespace-pre-wrap">{m.texto}</p>
        <p className="mt-1 text-right text-[10px] opacity-70">{hora(m.criado_em)}</p>
      </div>
    </div>
  );
}
