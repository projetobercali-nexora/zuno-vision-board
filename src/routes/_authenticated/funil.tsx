import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useConversas, useEstagios, type ConversaComContacto } from "@/lib/zuno";
import { Carregando, Erro, Vazio, Cabecalho } from "@/components/zuno/Estados";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/funil")({
  head: () => ({ meta: [{ title: "Funil — Zuno" }, { name: "description", content: "Funil de vendas do Zuno." }] }),
  component: FunilPage,
});

function FunilPage() {
  const qc = useQueryClient();
  const estagios = useEstagios();
  const conversas = useConversas();
  const [sobre, setSobre] = useState<string | null>(null);

  const mover = useMutation({
    mutationFn: async ({ id, estagio_id }: { id: string; estagio_id: string }) => {
      const { error } = await supabase.from("conversas").update({ estagio_id }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, estagio_id }) => {
      await qc.cancelQueries({ queryKey: ["conversas"] });
      const antes = qc.getQueryData<ConversaComContacto[]>(["conversas"]);
      qc.setQueryData<ConversaComContacto[]>(["conversas"], (l) => l?.map((c) => (c.id === id ? { ...c, estagio_id } : c)));
      return { antes };
    },
    onError: (e, _v, ctx) => { qc.setQueryData(["conversas"], ctx?.antes); toast.error(e.message); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["conversas"] }),
  });

  if (estagios.isLoading || conversas.isLoading) return <Carregando />;
  if (estagios.error || conversas.error) return <Erro erro={estagios.error ?? conversas.error} />;
  if (!estagios.data?.length) return <Vazio titulo="Sem estágios" />;

  return (
    <div className="flex h-full flex-col">
      <Cabecalho titulo="Funil" />
      <div className="flex flex-1 snap-x gap-3 overflow-x-auto p-4">
        {estagios.data.map((e) => {
          const lista = conversas.data?.filter((c) => c.estagio_id === e.id) ?? [];
          return (
            <div
              key={e.id}
              onDragOver={(ev) => { ev.preventDefault(); setSobre(e.id); }}
              onDragLeave={() => setSobre(null)}
              onDrop={(ev) => { ev.preventDefault(); setSobre(null); const id = ev.dataTransfer.getData("text/plain"); if (id) mover.mutate({ id, estagio_id: e.id }); }}
              className={cn("flex w-72 shrink-0 snap-start flex-col rounded-2xl border bg-card", sobre === e.id && "border-primary")}
            >
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="flex items-center gap-2 font-display text-sm font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.cor ?? undefined }} />{e.nome}
                </span>
                <span className="rounded-full bg-secondary px-2 text-xs text-muted-foreground">{lista.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {lista.length === 0 && <p className="p-3 text-center text-xs text-muted-foreground">Arraste conversas para aqui</p>}
                {lista.map((c) => (
                  <div key={c.id} draggable onDragStart={(ev) => ev.dataTransfer.setData("text/plain", c.id)} className="cursor-grab rounded-xl border bg-background p-3 active:cursor-grabbing">
                    <p className="truncate text-sm font-medium">{c.contactos?.nome ?? c.contactos?.telefone}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.ultima ?? "Sem mensagens"}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
