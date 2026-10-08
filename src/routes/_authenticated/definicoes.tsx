import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg, useEstagios } from "@/lib/zuno";
import { Carregando, Erro, Cabecalho } from "@/components/zuno/Estados";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/definicoes")({
  head: () => ({ meta: [{ title: "Definições — Zuno" }, { name: "description", content: "Definições do Zuno." }] }),
  component: DefinicoesPage,
});

type Rem = "cliente" | "agente" | "humano";
const FICTICIOS: { nome: string; telefone: string; etiquetas: string[]; origem: string; estagio: number; msgs: [Rem, string][]; jev: { progresso: number; jogada: "perguntar" | "qualificar" | "apresentar" | "objecao" | "fechar"; motivo: string } }[] = [
  { nome: "Ana Domingos", telefone: "+244 923 111 222", etiquetas: ["VIP"], origem: "Instagram", estagio: 0,
    msgs: [["cliente", "Boa tarde, vi o vosso anúncio. Ainda têm disponível?"], ["agente", "Boa tarde, Ana! Temos sim 😊 Para que zona de Luanda seria a entrega?"]],
    jev: { progresso: 15, jogada: "perguntar", motivo: "Primeiro contacto: descobrir localização e necessidade." } },
  { nome: "Carlos Mendes", telefone: "+244 912 333 444", etiquetas: ["Revenda"], origem: "Indicação", estagio: 1,
    msgs: [["cliente", "Quero comprar em quantidade para revender."], ["agente", "Excelente! Quantas unidades pensa encomendar por mês?"], ["cliente", "Umas 50."]],
    jev: { progresso: 35, jogada: "qualificar", motivo: "Cliente revendedor com volume interessante; confirmar orçamento." } },
  { nome: "Luísa Neto", telefone: "+244 934 555 666", etiquetas: ["Talatona"], origem: "Facebook", estagio: 2,
    msgs: [["cliente", "Qual é o preço do pacote completo?"], ["agente", "O pacote completo fica em 45.000 Kz, com entrega incluída."], ["humano", "Luísa, enviei-lhe a proposta detalhada por aqui."]],
    jev: { progresso: 60, jogada: "apresentar", motivo: "Já pediu preço; apresentar benefícios do pacote." } },
  { nome: "Pedro Kiala", telefone: "+244 945 777 888", etiquetas: ["Urgente"], origem: "Site", estagio: 3,
    msgs: [["cliente", "Está um bocado caro. Fazem desconto?"], ["agente", "Compreendo, Pedro. Para pagamento hoje conseguimos 10% de desconto."]],
    jev: { progresso: 80, jogada: "objecao", motivo: "Objeção de preço; oferecer condição especial com prazo." } },
  { nome: "Marta Sebastião", telefone: "+244 956 999 000", etiquetas: ["VIP", "Recorrente"], origem: "WhatsApp", estagio: 4,
    msgs: [["cliente", "Já fiz a transferência!"], ["agente", "Recebido, Marta! A sua encomenda sai amanhã de manhã. Obrigado pela confiança 🙏"]],
    jev: { progresso: 100, jogada: "fechar", motivo: "Pagamento confirmado; venda fechada." } },
];

function DefinicoesPage() {
  const qc = useQueryClient();
  const org = useOrg();
  const estagios = useEstagios();

  const gerar = useMutation({
    mutationFn: async () => {
      const oid = org.data!.organizacaoId;
      const est = estagios.data ?? [];
      for (const f of FICTICIOS) {
        const { data: c, error: e1 } = await supabase.from("contactos").insert({ organizacao_id: oid, nome: f.nome, telefone: f.telefone, etiquetas: f.etiquetas, origem: f.origem }).select().single();
        if (e1) throw e1;
        const base = Date.now() - Math.random() * 3600_000 * 6;
        const ultima = new Date(base + f.msgs.length * 60_000).toISOString();
        const { data: conv, error: e2 } = await supabase.from("conversas").insert({ organizacao_id: oid, contacto_id: c.id, estagio_id: est[f.estagio]?.id ?? null, ultima_mensagem_em: ultima, estado: f.estagio === 4 ? "fechada" : "aberta" }).select().single();
        if (e2) throw e2;
        const { error: e3 } = await supabase.from("mensagens").insert(f.msgs.map(([remetente, texto], i) => ({ organizacao_id: oid, conversa_id: conv.id, remetente, texto, criado_em: new Date(base + i * 60_000).toISOString() })));
        if (e3) throw e3;
        const { error: e4 } = await supabase.from("decisoes_jev").insert({ organizacao_id: oid, conversa_id: conv.id, estagio: est[f.estagio]?.nome ?? null, ...f.jev });
        if (e4) throw e4;
      }
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Dados de teste gerados! Veja as Conversas."); },
    onError: (e) => toast.error(e.message),
  });

  if (org.isLoading) return <Carregando />;
  if (org.error) return <Erro erro={org.error} />;

  return (
    <div className="flex h-full flex-col">
      <Cabecalho titulo="Definições" />
      <div className="max-w-xl space-y-4 overflow-y-auto p-4">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organização</p>
          <p className="mt-1 font-display text-xl font-semibold">{org.data?.organizacaoNome}</p>
          <p className="mt-3 text-sm text-muted-foreground">{org.data?.nome} · {org.data?.email}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-display font-semibold">Dados de teste</p>
          <p className="mt-1 text-sm text-muted-foreground">Cria 5 contactos fictícios com conversas, mensagens e decisões do Jev para ver o Zuno a funcionar.</p>
          <Button className="mt-4" onClick={() => gerar.mutate()} disabled={gerar.isPending || !estagios.data}>
            <Database className="h-4 w-4" /> {gerar.isPending ? "A gerar..." : "Gerar dados de teste"}
          </Button>
        </div>
      </div>
    </div>
  );
}
