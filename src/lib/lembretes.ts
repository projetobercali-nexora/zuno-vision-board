import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db, type Linha } from "@/lib/kb";

export type Lembrete = {
  id: string; organizacao_id: string; conversa_id: string | null; contacto_id: string | null;
  tipo: string; titulo: string; texto: string | null; vence_em: string; estado: string;
  criado_em: string; resolvido_em: string | null;
};

export const TIPOS: Record<string, string> = {
  cliente_espera: "Cliente à espera", conversa_parada: "Conversas paradas", lead_quente: "Leads quentes",
  passou_humano: "Passou a humano", manual: "Manuais",
};

export function useAgora(ms = 30000) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return t;
}

export function useLembretes() {
  return useQuery({
    queryKey: ["lembretes"],
    queryFn: async (): Promise<Lembrete[]> => {
      const { data, error } = await db.from("lembretes").select("*").neq("estado", "ignorado").order("criado_em", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const ativo = (l: Lembrete) => l.estado === "pendente" || l.estado === "adiado";
export const vencido = (l: Lembrete, agora: number) => ativo(l) && new Date(l.vence_em).getTime() <= agora;

export function useAtualizarLembrete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Linha) => {
      const { error } = await db.from("lembretes").update(p).eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["lembretes"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export const NOTIF_KEY = "zuno-notificacoes";

/** Subscrição única (no Shell) para lembretes em tempo real. */
export function useLembretesTempoReal() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("zuno-lembretes")
      .on("postgres_changes", { event: "*", schema: "public", table: "lembretes" }, (p) => {
        qc.invalidateQueries({ queryKey: ["lembretes"] });
        if (p.eventType === "INSERT") {
          const l = p.new as Lembrete;
          toast(l.titulo, { description: l.texto ?? undefined });
          if (typeof Notification !== "undefined" && Notification.permission === "granted" && localStorage.getItem(NOTIF_KEY) === "1") {
            try { new Notification(`Zuno · ${l.titulo}`, { body: l.texto ?? "", icon: "/favicon.png" }); } catch { /* ignorar */ }
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}

export function haQuanto(iso: string, agora = Date.now()) {
  const m = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 60000));
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}
