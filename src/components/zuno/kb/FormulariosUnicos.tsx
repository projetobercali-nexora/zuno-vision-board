import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Carregando, Erro } from "@/components/zuno/Estados";
import { db, useKbUnica, type Linha } from "@/lib/kb";
import { useOrg } from "@/lib/zuno";
import { Campo, CampoTexto, Cartao, SoLeitura } from "./Comum";

function useAtualizarUnica(tabela: string) {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb", tabela] }); toast.success("Alterações guardadas."); },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useForm(tabela: string) {
  const q = useKbUnica(tabela);
  const [f, setF] = useState<Linha>({});
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);
  const set = (k: string) => (v: unknown) => setF((x) => ({ ...x, [k]: v }));
  return { q, f, set };
}

function Opcoes({ valor, onChange, opcoes, disabled }: { valor: string; onChange: (v: string) => void; opcoes: [string, string][]; disabled: boolean }) {
  return (
    <Select value={valor} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{opcoes.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

const MODOS: [string, string][] = [
  ["desligado", "Desligado"],
  ["teste", "Teste (responde só aos números de teste)"],
  ["ligado", "Ligado (responde a todos)"],
];

export function TabAgente({ admin }: { admin: boolean }) {
  const { q, f, set } = useForm("kb_agente");
  const guardar = useAtualizarUnica("kb_agente");
  const [confirmar, setConfirmar] = useState(false);
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  if (!q.data) return <Erro erro={new Error("Configuração do agente não encontrada para esta organização.")} />;
  const d = !admin;

  return (
    <div className="space-y-4">
      {d && <SoLeitura />}
      <Cartao titulo="Modo do agente" texto="Define a quem o agente responde.">
        <RadioGroup value={f.modo} disabled={d} onValueChange={(v) => (v === "ligado" ? setConfirmar(true) : set("modo")(v))} className="gap-3">
          {MODOS.map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary">
              <RadioGroupItem value={v} /> {l}
            </label>
          ))}
        </RadioGroup>
      </Cartao>
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ligar o agente para todos?</AlertDialogTitle>
            <AlertDialogDescription>O agente passará a responder a todos os clientes. Confirma que a base de conhecimento está pronta.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => set("modo")("ligado")}>Sim, ligar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Cartao titulo="Identidade">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Nome do agente" valor={f.nome} onChange={set("nome")} disabled={d} />
          <CampoTexto label="Função" valor={f.funcao} onChange={set("funcao")} disabled={d} />
          <div className="md:col-span-2"><CampoTexto label="Como se apresenta ao cliente" valor={f.apresentacao} onChange={set("apresentacao")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Personalidade" valor={f.personalidade} onChange={set("personalidade")} disabled={d} longo /></div>
        </div>
      </Cartao>

      <Cartao titulo="Estilo de resposta">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo label="Tom"><Opcoes valor={f.tom} onChange={set("tom")} disabled={d} opcoes={[["formal", "Formal"], ["amigavel", "Amigável"], ["descontraido", "Descontraído"]]} /></Campo>
          <Campo label="Uso de emojis"><Opcoes valor={f.usa_emojis} onChange={set("usa_emojis")} disabled={d} opcoes={[["nunca", "Nunca"], ["pouco", "Pouco"], ["muito", "Muito"]]} /></Campo>
          <Campo label="Tamanho das respostas"><Opcoes valor={f.tamanho_resposta} onChange={set("tamanho_resposta")} disabled={d} opcoes={[["curta", "Curta"], ["media", "Média"], ["detalhada", "Detalhada"]]} /></Campo>
          <CampoTexto label="Variante do idioma" valor={f.variante_idioma} onChange={set("variante_idioma")} disabled={d} />
          <div className="md:col-span-2"><CampoTexto label="Saudação inicial" valor={f.saudacao} onChange={set("saudacao")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Despedida" valor={f.despedida} onChange={set("despedida")} disabled={d} longo /></div>
          <div className="md:col-span-2"><CampoTexto label="Mensagem ao passar para um humano" valor={f.mensagem_passar_humano} onChange={set("mensagem_passar_humano")} disabled={d} longo /></div>
          <Campo label="Pausa mínima antes de responder (segundos)">
            <Input type="number" min={0} value={f.pausa_min_seg ?? 0} disabled={d} onChange={(e) => set("pausa_min_seg")(Number(e.target.value))} />
          </Campo>
          <Campo label="Pausa máxima (segundos)">
            <Input type="number" min={0} value={f.pausa_max_seg ?? 0} disabled={d} onChange={(e) => set("pausa_max_seg")(Number(e.target.value))} />
          </Campo>
        </div>
      </Cartao>

      <div className="flex gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <p>Se um cliente perguntar diretamente se está a falar com uma IA, o agente responde com sinceridade e oferece passar a conversa a um colega. Esta regra não pode ser desativada.</p>
      </div>

      {admin && (
        <Button onClick={() => {
          if (Number(f.pausa_min_seg) > Number(f.pausa_max_seg)) return toast.error("A pausa mínima não pode ser maior que a máxima.");
          guardar.mutate(f);
        }} disabled={guardar.isPending}>
          <Save className="h-4 w-4" /> {guardar.isPending ? "A guardar..." : "Guardar agente"}
        </Button>
      )}
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
  const { q, f, set } = useForm("kb_negocio");
  const guardar = useAtualizarUnica("kb_negocio");
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  if (!q.data) return <Erro erro={new Error("Perfil do negócio não encontrado para esta organização.")} />;
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
      {admin && (
        <Button onClick={() => guardar.mutate(f)} disabled={guardar.isPending}>
          <Save className="h-4 w-4" /> {guardar.isPending ? "A guardar..." : "Guardar negócio"}
        </Button>
      )}
    </div>
  );
}
