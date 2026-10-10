import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carregando, Erro } from "@/components/zuno/Estados";
import { db, useKbApagar, useKbGuardar, useKbLista, type Linha } from "@/lib/kb";
import { AcoesLinha, Campo, CampoTexto, Cartao, Confirmar, ListaVazia, SoLeitura } from "./Comum";

function Janela({ aberta, onClose, titulo, children, onGuardar, aGuardar }: {
  aberta: boolean; onClose: () => void; titulo: string; children: React.ReactNode; onGuardar: () => void; aGuardar: boolean;
}) {
  return (
    <Dialog open={aberta} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={onGuardar} disabled={aGuardar}>{aGuardar ? "A guardar..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useEdicao(tabela: string) {
  const [ed, setEd] = useState<Linha | null>(null);
  const guardar = useKbGuardar(tabela);
  const set = (k: string) => (v: unknown) => setEd((x) => ({ ...(x ?? {}), [k]: v }));
  const gravar = (obrig: string[]) => {
    if (!ed) return;
    for (const k of obrig) if (!String(ed[k] ?? "").trim()) return toast.error("Preenche os campos obrigatórios.");
    guardar.mutate(ed, { onSuccess: () => setEd(null) });
  };
  return { ed, setEd, set, gravar, guardar };
}

function useAlternar(tabela: string) {
  const g = useKbGuardar(tabela, "Estado atualizado.");
  return (l: Linha) => g.mutate({ id: l.id, ativo: !l.ativo });
}

// ---------- PRODUTOS ----------
export function TabProdutos({ admin }: { admin: boolean }) {
  const q = useKbLista("kb_produtos", "ordem");
  const { ed, setEd, set, gravar, guardar } = useEdicao("kb_produtos");
  const apagar = useKbApagar("kb_produtos");
  const alternar = useAlternar("kb_produtos");
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("todas");
  const cats = useMemo(() => [...new Set((q.data ?? []).map((p) => p.categoria).filter(Boolean))] as string[], [q.data]);
  const lista = (q.data ?? []).filter((p) =>
    (cat === "todas" || p.categoria === cat) && `${p.nome} ${p.descricao ?? ""}`.toLowerCase().includes(busca.toLowerCase()));

  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar produtos..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {admin && <Button onClick={() => setEd({ ativo: true, ordem: (q.data?.length ?? 0) + 1 })}><Plus className="h-4 w-4" /> Novo produto</Button>}
      </div>
      {lista.length === 0 ? (
        <ListaVazia texto={q.data?.length ? "Nenhum produto corresponde à pesquisa." : "Ainda não há produtos. Adiciona os produtos ou serviços que vendes para o agente os poder apresentar."} />
      ) : (
        <div className="space-y-2">
          {lista.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{p.nome}</p>
                  {p.categoria && <Badge variant="secondary">{p.categoria}</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{p.preco_texto || "Sem preço"} {p.descricao ? `· ${p.descricao}` : ""}</p>
              </div>
              <Switch checked={p.ativo} disabled={!admin} onCheckedChange={() => alternar(p)} aria-label="Ativo" />
              <AcoesLinha podeEditar={admin} titulo={p.nome} onEditar={() => setEd(p)} onApagar={() => apagar.mutate(p)} />
            </div>
          ))}
        </div>
      )}
      <Janela aberta={!!ed} onClose={() => setEd(null)} titulo={ed?.id ? "Editar produto" : "Novo produto"} onGuardar={() => gravar(["nome"])} aGuardar={guardar.isPending}>
        <CampoTexto label="Nome *" valor={ed?.nome} onChange={set("nome")} />
        <CampoTexto label="Categoria" valor={ed?.categoria} onChange={set("categoria")} />
        <CampoTexto label="Descrição" valor={ed?.descricao} onChange={set("descricao")} longo />
        <CampoTexto label="Preço" valor={ed?.preco_texto} onChange={set("preco_texto")} placeholder='Ex.: "150 000 Kz" ou "Sob consulta"' />
        <CampoTexto label="Link" valor={ed?.link} onChange={set("link")} placeholder="https://..." />
        <CampoTexto label="Ordem" tipo="number" valor={ed?.ordem} onChange={(v) => set("ordem")(Number(v))} />
      </Janela>
    </div>
  );
}

// ---------- PERGUNTAS ----------
export function TabPerguntas({ admin }: { admin: boolean }) {
  const q = useKbLista("kb_faq");
  const { ed, setEd, set, gravar, guardar } = useEdicao("kb_faq");
  const apagar = useKbApagar("kb_faq");
  const alternar = useAlternar("kb_faq");
  const [tipo, setTipo] = useState("todos");
  const lista = (q.data ?? []).filter((f) => tipo === "todos" || f.tipo === tipo);
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <div className="flex gap-2">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="flex-1 sm:w-48 sm:flex-none"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="duvida">Dúvida</SelectItem>
            <SelectItem value="objecao">Objeção</SelectItem>
          </SelectContent>
        </Select>
        {admin && <Button onClick={() => setEd({ tipo: "duvida", ativo: true })}><Plus className="h-4 w-4" /> Nova pergunta</Button>}
      </div>
      {lista.length === 0 ? (
        <ListaVazia texto="Ainda não há perguntas. Adiciona as dúvidas e objeções mais comuns dos clientes com a resposta certa." />
      ) : (
        <div className="space-y-2">
          {lista.map((f) => (
            <div key={f.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0 flex-1">
                <Badge variant={f.tipo === "objecao" ? "destructive" : "secondary"}>{f.tipo === "objecao" ? "Objeção" : "Dúvida"}</Badge>
                <p className="mt-1 font-medium">{f.pergunta}</p>
                <p className="text-sm text-muted-foreground">{f.resposta}</p>
              </div>
              <Switch checked={f.ativo} disabled={!admin} onCheckedChange={() => alternar(f)} aria-label="Ativa" />
              <AcoesLinha podeEditar={admin} titulo={f.pergunta} onEditar={() => setEd(f)} onApagar={() => apagar.mutate(f)} />
            </div>
          ))}
        </div>
      )}
      <Janela aberta={!!ed} onClose={() => setEd(null)} titulo={ed?.id ? "Editar pergunta" : "Nova pergunta"} onGuardar={() => gravar(["pergunta", "resposta"])} aGuardar={guardar.isPending}>
        <Campo label="Tipo">
          <Select value={ed?.tipo ?? "duvida"} onValueChange={set("tipo")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="duvida">Dúvida</SelectItem><SelectItem value="objecao">Objeção</SelectItem></SelectContent>
          </Select>
        </Campo>
        <CampoTexto label="Pergunta *" valor={ed?.pergunta} onChange={set("pergunta")} />
        <CampoTexto label="Resposta *" valor={ed?.resposta} onChange={set("resposta")} longo />
      </Janela>
    </div>
  );
}

// ---------- REGRAS ----------
function ColunaRegras({ tipo, titulo, linhas, admin, todas }: { tipo: string; titulo: string; linhas: Linha[]; admin: boolean; todas: number }) {
  const qc = useQueryClient();
  const { ed, setEd, set, gravar, guardar } = useEdicao("kb_regras");
  const apagar = useKbApagar("kb_regras");
  const alternar = useAlternar("kb_regras");
  async function mover(i: number, dir: -1 | 1) {
    const a = linhas[i], b = linhas[i + dir];
    if (!a || !b) return;
    const oa = a.ordem === b.ordem ? a.ordem + dir : b.ordem;
    const r1 = await db.from("kb_regras").update({ ordem: oa }).eq("id", a.id);
    const r2 = await db.from("kb_regras").update({ ordem: a.ordem }).eq("id", b.id);
    if (r1.error || r2.error) toast.error((r1.error ?? r2.error).message);
    qc.invalidateQueries({ queryKey: ["kb", "kb_regras"] });
  }
  return (
    <Cartao titulo={titulo} acao={admin && <Button size="sm" onClick={() => setEd({ tipo, ativo: true, ordem: todas + 1 })}><Plus className="h-4 w-4" /> Adicionar</Button>}>
      {linhas.length === 0 ? <ListaVazia texto="Sem regras. Adiciona uma regra clara e curta." /> : (
        <div className="space-y-2">
          {linhas.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg border p-2">
              {admin && (
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => mover(i, -1)} className="text-muted-foreground disabled:opacity-30" aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
                  <button disabled={i === linhas.length - 1} onClick={() => mover(i, 1)} className="text-muted-foreground disabled:opacity-30" aria-label="Descer"><ArrowDown className="h-4 w-4" /></button>
                </div>
              )}
              <p className={`min-w-0 flex-1 text-sm ${r.ativo ? "" : "text-muted-foreground line-through"}`}>{r.texto}</p>
              <Switch checked={r.ativo} disabled={!admin} onCheckedChange={() => alternar(r)} aria-label="Ativa" />
              <AcoesLinha podeEditar={admin} titulo={r.texto.slice(0, 30)} onEditar={() => setEd(r)} onApagar={() => apagar.mutate(r)} />
            </div>
          ))}
        </div>
      )}
      <Janela aberta={!!ed} onClose={() => setEd(null)} titulo={ed?.id ? "Editar regra" : "Nova regra"} onGuardar={() => gravar(["texto"])} aGuardar={guardar.isPending}>
        <CampoTexto label="Regra *" valor={ed?.texto} onChange={set("texto")} longo />
      </Janela>
    </Cartao>
  );
}

export function TabRegras({ admin }: { admin: boolean }) {
  const q = useKbLista("kb_regras", "ordem");
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  const t = q.data ?? [];
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <div className="grid gap-4 lg:grid-cols-2">
        <ColunaRegras tipo="fazer" titulo="O que deve fazer" linhas={t.filter((r) => r.tipo === "fazer")} admin={admin} todas={t.length} />
        <ColunaRegras tipo="nao_fazer" titulo="O que nunca deve fazer" linhas={t.filter((r) => r.tipo === "nao_fazer")} admin={admin} todas={t.length} />
      </div>
    </div>
  );
}

// ---------- ESTRATÉGIA ----------
const JOGADAS: [string, string, string][] = [
  ["perguntar", "Perguntar", "Descobrir o que o cliente precisa."],
  ["qualificar", "Qualificar", "Confirmar os dados essenciais para avançar."],
  ["apresentar", "Apresentar", "Mostrar a melhor opção, com preço e material."],
  ["objecao", "Objeção", "Responder a dúvidas e resistências do cliente."],
  ["fechar", "Fechar", "Confirmar o pedido e o próximo passo."],
];

export function TabEstrategia({ admin }: { admin: boolean }) {
  const q = useKbLista("kb_estrategia", "jogada");
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      {JOGADAS.map(([j, t, e]) => (
        <CartaoJogada key={j} jogada={j} titulo={t} explicacao={e} inicial={q.data?.find((x) => x.jogada === j)?.instrucoes ?? ""} admin={admin} />
      ))}
    </div>
  );
}

function CartaoJogada({ jogada, titulo, explicacao, inicial, admin }: { jogada: string; titulo: string; explicacao: string; inicial: string; admin: boolean }) {
  const [txt, setTxt] = useState(inicial);
  const [aGuardar, setAGuardar] = useState(false);
  const qc = useQueryClient();
  async function guardar() {
    setAGuardar(true);
    const { data: u } = await import("@/integrations/supabase/client").then((m) => m.supabase.auth.getUser());
    const { data: p } = await db.from("perfis").select("organizacao_id").eq("id", u.user?.id).single();
    const { error } = await db.from("kb_estrategia").upsert({ organizacao_id: p?.organizacao_id, jogada, instrucoes: txt }, { onConflict: "organizacao_id,jogada" });
    setAGuardar(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["kb", "kb_estrategia"] });
    toast.success(`Estratégia "${titulo}" guardada.`);
  }
  return (
    <Cartao titulo={titulo} texto={explicacao}>
      <Textarea rows={4} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={!admin} placeholder="Instruções para o agente nesta fase..." />
      {admin && <Button size="sm" className="mt-3" onClick={guardar} disabled={aGuardar || txt === inicial}>{aGuardar ? "A guardar..." : "Guardar"}</Button>}
    </Cartao>
  );
}

// ---------- PASSAR A HUMANO ----------
export function TabPassarHumano({ admin }: { admin: boolean }) {
  const q = useKbLista("kb_passar_humano", "gatilho");
  const { ed, setEd, set, gravar, guardar } = useEdicao("kb_passar_humano");
  const apagar = useKbApagar("kb_passar_humano");
  const alternar = useAlternar("kb_passar_humano");
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <Cartao titulo="Situações para passar a um humano" texto="Quando uma destas situações acontecer, o agente passa a conversa a um colega da equipa."
        acao={admin && <Button size="sm" onClick={() => setEd({ ativo: true })}><Plus className="h-4 w-4" /> Adicionar</Button>}>
        {(q.data ?? []).length === 0 ? <ListaVazia texto="Sem situações definidas. Ex.: “O cliente pede para falar com uma pessoa”." /> : (
          <div className="space-y-2">
            {q.data!.map((g) => (
              <div key={g.id} className="flex items-center gap-2 rounded-lg border p-3">
                <p className={`min-w-0 flex-1 text-sm ${g.ativo ? "" : "text-muted-foreground line-through"}`}>{g.gatilho}</p>
                <Switch checked={g.ativo} disabled={!admin} onCheckedChange={() => alternar(g)} aria-label="Ativa" />
                <AcoesLinha podeEditar={admin} titulo={g.gatilho.slice(0, 30)} onEditar={() => setEd(g)} onApagar={() => apagar.mutate(g)} />
              </div>
            ))}
          </div>
        )}
      </Cartao>
      <Janela aberta={!!ed} onClose={() => setEd(null)} titulo={ed?.id ? "Editar situação" : "Nova situação"} onGuardar={() => gravar(["gatilho"])} aGuardar={guardar.isPending}>
        <CampoTexto label="Situação *" valor={ed?.gatilho} onChange={set("gatilho")} longo />
      </Janela>
    </div>
  );
}

// ---------- TESTES ----------
export function TabTestes({ admin }: { admin: boolean }) {
  const q = useKbLista("kb_numeros_teste", "telefone");
  const guardar = useKbGuardar("kb_numeros_teste", "Número adicionado.");
  const apagar = useKbApagar("kb_numeros_teste");
  const [tel, setTel] = useState("");
  const [nome, setNome] = useState("");
  function adicionar() {
    const t = tel.trim();
    if (!/^\d{9,15}$/.test(t)) return toast.error("Usa só dígitos com o indicativo, ex.: 244923456789");
    guardar.mutate({ telefone: t, nome: nome.trim() || null }, { onSuccess: () => { setTel(""); setNome(""); } });
  }
  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <Cartao titulo="Números de teste" texto="No modo Teste, o agente só responde a estes números.">
        {admin && (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <Input inputMode="numeric" placeholder="244923456789" value={tel} onChange={(e) => setTel(e.target.value.replace(/\D/g, ""))} />
            <Input placeholder="Nome (opcional)" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Button onClick={adicionar} disabled={guardar.isPending}><Plus className="h-4 w-4" /> Adicionar</Button>
          </div>
        )}
        {(q.data ?? []).length === 0 ? <ListaVazia texto="Ainda não há números de teste. Adiciona o teu número para testar o agente com segurança." /> : (
          <div className="space-y-2">
            {q.data!.map((n) => (
              <div key={n.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm">{n.telefone}</p>
                  {n.nome && <p className="text-xs text-muted-foreground">{n.nome}</p>}
                </div>
                {admin && (
                  <Confirmar titulo="Apagar este número?" texto={n.telefone} onConfirmar={() => apagar.mutate(n)}>
                    <Button size="icon" variant="ghost" aria-label="Apagar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </Confirmar>
                )}
              </div>
            ))}
          </div>
        )}
      </Cartao>
    </div>
  );
}
