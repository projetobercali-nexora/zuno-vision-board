import { useRef, useState } from "react";
import { AlertTriangle, FileText, Film, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carregando, Erro } from "@/components/zuno/Estados";
import { db, useKbApagar, useKbGuardar, useKbLista, type Linha } from "@/lib/kb";
import { useOrg } from "@/lib/zuno";
import { AcoesLinha, Campo, CampoTexto, ListaVazia, SoLeitura } from "./Comum";

const BUCKET = "zuno-midias";
const MB = 1024 * 1024;
const LIMITE: Record<string, number> = { imagem: 5 * MB, video: 16 * MB, pdf: 16 * MB };
const ACEITA: Record<string, string> = { imagem: "image/*", video: "video/*", pdf: "application/pdf" };

function Icone({ m }: { m: Linha }) {
  if (m.tipo === "imagem") return <img src={m.url} alt={m.titulo} className="h-full w-full object-cover" loading="lazy" />;
  const I = m.tipo === "video" ? Film : m.tipo === "pdf" ? FileText : Link2;
  return <I className="h-10 w-10 text-primary" />;
}

export function TabMidia({ admin }: { admin: boolean }) {
  const org = useOrg();
  const q = useKbLista("kb_midias");
  const produtos = useKbLista("kb_produtos", "ordem");
  const guardar = useKbGuardar("kb_midias");
  const apagar = useKbApagar("kb_midias", async (l) => {
    if (l.caminho_storage) {
      const { error } = await db.storage.from(BUCKET).remove([l.caminho_storage]);
      if (error) throw error;
    }
  });
  const alternar = useKbGuardar("kb_midias", "Estado atualizado.");
  const [ed, setEd] = useState<Linha | null>(null);
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  const set = (k: string) => (v: unknown) => setEd((x: Linha) => ({ ...(x ?? {}), [k]: v }));

  function escolher(f: File | null) {
    if (f && ed && f.size > (LIMITE[ed.tipo] ?? 0)) {
      toast.error(`O ficheiro tem ${(f.size / MB).toFixed(1)} MB. O limite para ${ed.tipo} é ${(LIMITE[ed.tipo] ?? 0) / MB} MB.`);
      if (inp.current) inp.current.value = "";
      return setFicheiro(null);
    }
    setFicheiro(f);
  }

  async function gravar() {
    if (!ed) return;
    if (!ed.titulo?.trim()) { toast.error("Indica um título."); return; }
    const linha = { ...ed };
    delete linha.produto_nome;
    if (linha.produto_id === "nenhum") linha.produto_id = null;
    try {
      if (ed.tipo === "link") {
        if (!/^https?:\/\//.test(ed.url ?? "")) { toast.error("Indica um URL válido (https://...)."); return; }
      } else if (ficheiro) {
        setACarregar(true);
        const nome = ficheiro.name.replace(/[^\w.-]+/g, "_");
        const caminho = `${org.data!.organizacaoId}/${crypto.randomUUID()}-${nome}`;
        const { error } = await db.storage.from(BUCKET).upload(caminho, ficheiro, { contentType: ficheiro.type });
        if (error) throw error;
        if (ed.caminho_storage) await db.storage.from(BUCKET).remove([ed.caminho_storage]);
        linha.caminho_storage = caminho;
        linha.url = db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
      } else if (!ed.id) {
        { toast.error("Escolhe um ficheiro para carregar."); return; }
      }
      guardar.mutate(linha, { onSuccess: () => { setEd(null); setFicheiro(null); } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar o ficheiro.");
    } finally {
      setACarregar(false);
    }
  }

  if (q.isLoading) return <Carregando />;
  if (q.error) return <Erro erro={q.error} />;
  const lista = q.data ?? [];
  return (
    <div className="space-y-4">
      {!admin && <SoLeitura />}
      <div className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <p>Os ficheiros ficam acessíveis por link público. Não carregues documentos privados.</p>
      </div>
      {admin && <Button onClick={() => { setFicheiro(null); setEd({ tipo: "imagem", ativo: true }); }}><Plus className="h-4 w-4" /> Adicionar</Button>}
      {lista.length === 0 ? (
        <ListaVazia texto="A biblioteca está vazia. Adiciona fotos, vídeos, catálogos em PDF ou links que o agente pode enviar aos clientes." />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {lista.map((m) => (
            <div key={m.id} className={`overflow-hidden rounded-xl border bg-card ${m.ativo ? "" : "opacity-50"}`}>
              <a href={m.url} target="_blank" rel="noreferrer" className="flex aspect-video items-center justify-center bg-muted">
                <Icone m={m} />
              </a>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium">{m.titulo}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{m.descricao || "Sem descrição"}</p>
                <div className="flex items-center justify-between">
                  <Switch checked={m.ativo} disabled={!admin} onCheckedChange={() => alternar.mutate({ id: m.id, ativo: !m.ativo })} aria-label="Ativa" />
                  <AcoesLinha podeEditar={admin} titulo={m.titulo} onEditar={() => { setFicheiro(null); setEd(m); }} onApagar={() => apagar.mutate(m)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!ed} onOpenChange={(o) => !o && setEd(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ed?.id ? "Editar mídia" : "Adicionar mídia"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Campo label="Tipo">
              <Select value={ed?.tipo} onValueChange={(v) => { set("tipo")(v); setFicheiro(null); }} disabled={!!ed?.id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="imagem">Imagem (até 5 MB)</SelectItem>
                  <SelectItem value="video">Vídeo (até 16 MB)</SelectItem>
                  <SelectItem value="pdf">PDF (até 16 MB)</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
            {ed?.tipo === "link" ? (
              <CampoTexto label="URL *" valor={ed?.url} onChange={set("url")} placeholder="https://..." />
            ) : (
              <Campo label={ed?.id ? "Substituir ficheiro (opcional)" : "Ficheiro *"}>
                <Input ref={inp} type="file" accept={ACEITA[ed?.tipo ?? "imagem"]} onChange={(e) => escolher(e.target.files?.[0] ?? null)} />
              </Campo>
            )}
            <CampoTexto label="Título *" valor={ed?.titulo} onChange={set("titulo")} />
            <CampoTexto label="Descrição" valor={ed?.descricao} onChange={set("descricao")} longo ajuda="Explica o que o ficheiro mostra — a IA decide o que enviar com base neste texto." />
            <Campo label="Produto associado (opcional)">
              <Select value={ed?.produto_id ?? "nenhum"} onValueChange={set("produto_id")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {(produtos.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <CampoTexto label="Quando enviar" valor={ed?.quando_enviar} onChange={set("quando_enviar")} placeholder="Ex.: quando o cliente pedir fotos de roupeiros" />
            <CampoTexto label="Legenda a acompanhar o envio" valor={ed?.legenda} onChange={set("legenda")} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEd(null)}>Cancelar</Button>
            <Button onClick={gravar} disabled={aCarregar || guardar.isPending}>{aCarregar ? "A carregar..." : guardar.isPending ? "A guardar..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
