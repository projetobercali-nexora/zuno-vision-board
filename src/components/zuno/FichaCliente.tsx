import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEstagios, iniciais, type ConversaComContacto } from "@/lib/zuno";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const JOGADAS: Record<string, string> = {
  perguntar: "Perguntar",
  qualificar: "Qualificar",
  apresentar: "Apresentar",
  objecao: "Tratar objeção",
  fechar: "Fechar venda",
};

export function FichaCliente({ conversa }: { conversa: ConversaComContacto }) {
  const qc = useQueryClient();
  const { data: estagios } = useEstagios();
  const contacto = conversa.contactos;
  const [nova, setNova] = useState("");

  const jev = useQuery({
    queryKey: ["jev", conversa.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisoes_jev").select("*").eq("conversa_id", conversa.id)
        .order("criado_em", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const mudarEstagio = useMutation({
    mutationFn: async (estagio_id: string) => {
      const { error } = await supabase.from("conversas").update({ estagio_id }).eq("id", conversa.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["conversas"] }); toast.success("Estágio atualizado"); },
    onError: (e) => toast.error(e.message),
  });

  const guardarEtiquetas = useMutation({
    mutationFn: async (etiquetas: string[]) => {
      const { error } = await supabase.from("contactos").update({ etiquetas }).eq("id", contacto!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["conversas"] }); qc.invalidateQueries({ queryKey: ["contactos"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (!contacto) return null;
  const etiquetas = contacto.etiquetas ?? [];

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand font-display font-bold text-primary-foreground">{iniciais(contacto.nome)}</div>
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{contacto.nome ?? "Sem nome"}</p>
          <p className="text-sm text-muted-foreground">{contacto.telefone}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Etiquetas</p>
        <div className="flex flex-wrap gap-1.5">
          {etiquetas.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button aria-label={`Remover ${t}`} onClick={() => guardarEtiquetas.mutate(etiquetas.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {etiquetas.length === 0 && <span className="text-sm text-muted-foreground">Sem etiquetas</span>}
        </div>
        <form className="mt-2" onSubmit={(e) => { e.preventDefault(); const v = nova.trim(); if (v && !etiquetas.includes(v)) guardarEtiquetas.mutate([...etiquetas, v]); setNova(""); }}>
          <Input placeholder="Nova etiqueta + Enter" value={nova} onChange={(e) => setNova(e.target.value)} />
        </form>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Estágio atual</p>
        <Select value={conversa.estagio_id ?? ""} onValueChange={(v) => mudarEstagio.mutate(v)}>
          <SelectTrigger><SelectValue placeholder="Escolher estágio" /></SelectTrigger>
          <SelectContent>
            {estagios?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-accent/40 p-4 shadow-glow">
        <div className="mb-3 flex items-center gap-2 font-display font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Jev · Zuno</div>
        {jev.isLoading ? <p className="text-sm text-muted-foreground">A carregar...</p>
          : !jev.data ? <p className="text-sm text-muted-foreground">O Jev ainda não analisou esta conversa.</p>
          : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Estágio</span><span>{jev.data.estagio ?? "—"}</span></div>
              <div>
                <div className="mb-1 flex justify-between"><span className="text-muted-foreground">Progresso</span><span className="font-semibold text-primary">{jev.data.progresso}%</span></div>
                <Progress value={jev.data.progresso} />
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jogada</span><Badge>{JOGADAS[jev.data.jogada] ?? jev.data.jogada}</Badge></div>
              {jev.data.motivo && <p className="rounded-lg bg-background/50 p-2 text-muted-foreground">{jev.data.motivo}</p>}
            </div>
          )}
      </div>
    </div>
  );
}
