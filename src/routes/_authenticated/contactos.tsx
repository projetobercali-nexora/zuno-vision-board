import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/zuno";
import { Carregando, Erro, Vazio, Cabecalho } from "@/components/zuno/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/contactos")({
  head: () => ({ meta: [{ title: "Contactos — Zuno" }, { name: "description", content: "Contactos no Zuno." }] }),
  component: ContactosPage,
});

function ContactosPage() {
  const qc = useQueryClient();
  const { data: org } = useOrg();
  const [q, setQ] = useState("");
  const [etiqueta, setEtiqueta] = useState("todas");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", etiquetas: "", origem: "" });

  const contactos = useQuery({
    queryKey: ["contactos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contactos").select("*").order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const todasEtiquetas = useMemo(() => [...new Set(contactos.data?.flatMap((c) => c.etiquetas) ?? [])].sort(), [contactos.data]);
  const filtrados = useMemo(() => {
    const t = q.toLowerCase();
    return (contactos.data ?? []).filter((c) =>
      (!t || (c.nome ?? "").toLowerCase().includes(t) || c.telefone.includes(t)) &&
      (etiqueta === "todas" || c.etiquetas.includes(etiqueta)));
  }, [contactos.data, q, etiqueta]);

  const adicionar = useMutation({
    mutationFn: async () => {
      if (!org) throw new Error("Organização não carregada");
      const { error } = await supabase.from("contactos").insert({
        organizacao_id: org.organizacaoId, nome: form.nome || null, telefone: form.telefone,
        origem: form.origem || null, etiquetas: form.etiquetas.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contacto adicionado"); setAberto(false); setForm({ nome: "", telefone: "", etiquetas: "", origem: "" }); qc.invalidateQueries({ queryKey: ["contactos"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col">
      <Cabecalho titulo="Contactos"><Button size="sm" onClick={() => setAberto(true)}><Plus className="h-4 w-4" /> Adicionar</Button></Cabecalho>
      <div className="flex flex-col gap-2 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={etiqueta} onValueChange={setEtiqueta}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etiquetas</SelectItem>
            {todasEtiquetas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-auto px-4 pb-4">
        {contactos.isLoading ? <Carregando /> : contactos.error ? <Erro erro={contactos.error} />
          : !filtrados.length ? <Vazio titulo="Nenhum contacto encontrado" texto={contactos.data?.length ? "Tente outra pesquisa." : "Adicione o primeiro contacto."} />
          : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead className="hidden sm:table-cell">Etiquetas</TableHead><TableHead className="hidden md:table-cell">Origem</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtrados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome ?? "—"}</TableCell>
                      <TableCell>{c.telefone}</TableCell>
                      <TableCell className="hidden sm:table-cell"><div className="flex flex-wrap gap-1">{c.etiquetas.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div></TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{c.origem ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo contacto</DialogTitle></DialogHeader>
          <form id="novo" className="space-y-3" onSubmit={(e) => { e.preventDefault(); adicionar.mutate(); }}>
            <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Telefone *</Label><Input required placeholder="+244 9XX XXX XXX" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Etiquetas (separadas por vírgula)</Label><Input value={form.etiquetas} onChange={(e) => setForm({ ...form, etiquetas: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Origem</Label><Input placeholder="Instagram, indicação..." value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>
          </form>
          <DialogFooter><Button type="submit" form="novo" disabled={adicionar.isPending}>{adicionar.isPending ? "A guardar..." : "Guardar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
