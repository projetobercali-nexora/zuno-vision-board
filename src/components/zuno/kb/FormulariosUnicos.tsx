import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "@tanstack/react-router";
import { toast } from "sonner";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Carregando, Erro } from "@/components/zuno/Estados";
import { db, useKbUnica, type Linha } from "@/lib/kb";
import { useOrg } from "@/lib/zuno";
import { Campo, CampoTexto, Cartao, SoLeitura } from "./Comum";

function useAtualizarUnica(tabela: string, msg = "Alterações guardadas.") {
  const qc = useQueryClient();
  const org = useOrg();
  return useMutation({
    mutationFn: async (l: Linha) => {
      const { organizacao_id: _o, atualizado_em: _a, ...resto } = l;
      const { data, error } = await db.from(tabela)
        .update({ ...resto, atualizado_em: new Date().toISOString() })
        .eq("organizacao_id", org.data!.organizacaoId).select();
      if (error) throw error;
      if (!data?.length) throw new Error("Não foi possível guardar (registo não encontrado ou sem permissão).");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb", tabela] }); toast.success(msg); },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useForm(tabela: string) {
  const q = useKbUnica(tabela);
  const [f, setF] = useState<Linha>({});
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);
  const set = (k: string) => (v: unknown) => setF((x: Linha) => ({ ...x, [k]: v }));
  const sujo = !!q.data && Object.keys(f).some((k) => (f[k] ?? "") !== (q.data[k] ?? ""));
  return { q, f, set, sujo };
}

function useAvisoSair(sujo: boolean) {
  useBlocker({
    shouldBlockFn: () => sujo && !window.confirm("Tens alterações por guardar. Sair mesmo assim?"),
    enableBeforeUnload: sujo,
  });
}

function BarraGuardar({ visivel, aGuardar, onGuardar }: { visivel: boolean; aGuardar: boolean; onGuardar: () => void }) {
  if (!visivel) return null;
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Tens alterações por guardar.</p>
        <Button onClick={onGuardar} disabled={aGuardar}>
          <Save className="h-4 w-4" /> {aGuardar ? "A guardar..." : "Guardar alterações"}
        </Button>
      </div>
    </div>
  );
}

function Opcoes({ valor, onChange, opcoes, disabled }: { valor: string; onChange: (v: string) => void; opcoes: [string, string][]; disabled: boolean }) {
  return (
    <Select value={valor} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{opcoes.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Estados({ q, nome }: { q: ReturnType<typeof useKbUnica>; nome: string }) {
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  if (!q.data) return <Erro erro={new Error(`${nome} não encontrado para esta organização.`)} />;
  return null;
}

/** Interruptor Ligado/Desligado usado no cartão "Estado do agente". */
export function InterruptorAgente({ admin }: { admin: boolean }) {
  const q = useKbUnica("kb_agente");
  const guardar = useAtualizarUnica("kb_agente", "Estado do agente atualizado.");
  const [confirmar, setConfirmar] = useState(false);
  const ligado = q.data?.modo === "ligado";
  return (
    <>
      <Switch
        checked={ligado}
        disabled={!admin || !q.data || guardar.isPending}
        onCheckedChange={(v) => (v ? setConfirmar(true) : guardar.mutate({ modo: "desligado" }))}
        aria-label="Ligar ou desligar o agente"
      />
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ligar o agente para todos?</AlertDialogTitle>
            <AlertDialogDescription>O agente passará a responder a todos os clientes. Confirma que a base de conhecimento está pronta.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => guardar.mutate({ modo: "ligado" })}>Sim, ligar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function TabIdentidade({ admin }: { admin: boolean }) {
  const { q, f, set, sujo } = useForm("kb_agente");
  const guardar = useAtualizarUnica("kb_agente");
  useAvisoSair(sujo && admin);
  const e = Estados({ q, nome: "Configuração do agente" });
  if (e) return e;
  const d = !admin;
  return (
    <div className="space-y-4">
      {d && <SoLeitura />}
      <Cartao titulo="Identidade" texto="Quem é o agente e como fala com os clientes.">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Nome do agente" valor={f.nome} onChange={set("nome")} disabled={d} />
          <CampoTexto label="Função" valor={f.funcao} onChange={set("funcao")} disabled={d} />
          <div className="md:col-span-2"><CampoTexto label="Como se apresenta ao cliente" valor={f.apresentacao} onChange={set("apresentacao")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Personalidade" valor={f.personalidade} onChange={set("personalidade")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Saudação inicial" valor={f.saudacao} onChange={set("saudacao")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Despedida" valor={f.despedida} onChange={set("despedida")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Mensagem ao passar a um humano" valor={f.mensagem_passar_humano} onChange={set("mensagem_passar_humano")} disabled={d} longo /></div>
        </div>
      </Cartao>
      <div className="flex gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <p>Se um cliente perguntar diretamente se está a falar com uma IA, o agente responde com sinceridade e oferece passar a conversa a um colega. Esta regra não pode ser desativada.</p>
      </div>
      <BarraGuardar visivel={admin && sujo} aGuardar={guardar.isPending} onGuardar={() => guardar.mutate(f)} />
    </div>
  );
}

export function TabTom({ admin }: { admin: boolean }) {
  const { q, f, set, sujo } = useForm("kb_agente");
  const guardar = useAtualizarUnica("kb_agente");
  useAvisoSair(sujo && admin);
  const e = Estados({ q, nome: "Configuração do agente" });
  if (e) return e;
  const d = !admin;
  return (
    <div className="space-y-4">
      {d && <SoLeitura />}
      <Cartao titulo="Tom de voz" texto="Estilo e ritmo das respostas.">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo label="Tom"><Opcoes valor={f.tom} onChange={set("tom")} disabled={d} opcoes={[["formal", "Formal"], ["amigavel", "Amigável"], ["descontraido", "Descontraído"]]} /></Campo>
          <Campo label="Uso de emojis"><Opcoes valor={f.usa_emojis} onChange={set("usa_emojis")} disabled={d} opcoes={[["nunca", "Nunca"], ["pouco", "Pouco"], ["muito", "Muito"]]} /></Campo>
          <Campo label="Tamanho das respostas"><Opcoes valor={f.tamanho_resposta} onChange={set("tamanho_resposta")} disabled={d} opcoes={[["curta", "Curta"], ["media", "Média"], ["detalhada", "Detalhada"]]} /></Campo>
          <CampoTexto label="Variante do idioma" valor={f.variante_idioma} onChange={set("variante_idioma")} disabled={d} />
          <Campo label="Pausa mínima antes de responder (segundos)">
            <Input type="number" min={0} value={f.pausa_min_seg ?? 0} disabled={d} onChange={(ev) => set("pausa_min_seg")(Number(ev.target.value))} />
          </Campo>
          <Campo label="Pausa máxima (segundos)">
            <Input type="number" min={0} value={f.pausa_max_seg ?? 0} disabled={d} onChange={(ev) => set("pausa_max_seg")(Number(ev.target.value))} />
          </Campo>
        </div>
      </Cartao>
      <BarraGuardar visivel={admin && sujo} aGuardar={guardar.isPending} onGuardar={() => {
        if (Number(f.pausa_min_seg) > Number(f.pausa_max_seg)) { toast.error("A pausa mínima não pode ser maior que a máxima."); return; }
        guardar.mutate(f);
      }} />
    </div>
  );
}

const CAMPOS_NEGOCIO: [string, string, boolean?][] = [
  ["nome_empresa", "Nome da empresa"], ["descricao", "Descrição", true], ["o_que_vende", "O que vende", true],
  ["publico_alvo", "Público-alvo", true], ["diferenciais", "Diferenciais", true], ["horario", "Horário"],
  ["localizacao", "Localização"], ["zonas_entrega", "Zonas de entrega", true], ["formas_pagamento", "Formas de pagamento", true],
  ["politica_entrega", "Política de entrega", true], ["garantia_devolucoes", "Garantia e devoluções", true],
  ["contactos", "Contactos", true], ["outras_informacoes", "Outras informações", true],
];

export function TabNegocio({ admin }: { admin: boolean }) {
  const { q, f, set, sujo } = useForm("kb_negocio");
  const guardar = useAtualizarUnica("kb_negocio");
  useAvisoSair(sujo && admin);
  const e = Estados({ q, nome: "Perfil do negócio" });
  if (e) return e;
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <Cartao titulo="Perfil do negócio" texto="O agente usa estas informações para responder aos clientes.">
        <div className="grid gap-4 md:grid-cols-2">
          {CAMPOS_NEGOCIO.map(([k, l, longo]) => (
            <div key={k} className={longo ? "md:col-span-2" : ""}>
              <CampoTexto label={l} valor={f[k]} onChange={set(k)} longo={longo} disabled={!admin} />
            </div>
          ))}
        </div>
      </Cartao>
      <BarraGuardar visivel={admin && sujo} aGuardar={guardar.isPending} onGuardar={() => guardar.mutate(f)} />
    </div>
  );
}
