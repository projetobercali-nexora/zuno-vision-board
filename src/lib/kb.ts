import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/zuno";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as { from: (t: string) => any; storage: typeof supabase.storage };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Linha = any;

export function useAdmin() {
  return useQuery({
    queryKey: ["sou-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("papeis_utilizador").select("papel").eq("utilizador_id", u.user.id);
      return (data ?? []).some((p) => p.papel === "admin");
    },
  });
}

export function useKbLista(tabela: string, ordem = "criado_em", asc = true) {
  return useQuery({
    queryKey: ["kb", tabela],
    queryFn: async (): Promise<Linha[]> => {
      const { data, error } = await db.from(tabela).select("*").order(ordem, { ascending: asc });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useKbUnica(tabela: string) {
  const org = useOrg();
  return useQuery({
    queryKey: ["kb", tabela],
    enabled: !!org.data,
    queryFn: async (): Promise<Linha | null> => {
      const { data, error } = await db.from(tabela).select("*").eq("organizacao_id", org.data!.organizacaoId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useKbGuardar(tabela: string, msg = "Guardado com sucesso.") {
  const qc = useQueryClient();
  const org = useOrg();
  return useMutation({
    mutationFn: async (linha: Linha) => {
      const oid = org.data?.organizacaoId;
      if (!oid) throw new Error("Organização não encontrada.");
      const { id, ...resto } = linha;
      const payload = { ...resto, organizacao_id: oid };
      const q = id ? db.from(tabela).update(payload).eq("id", id) : db.from(tabela).insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb", tabela] }); toast.success(msg); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useKbApagar(tabela: string, antes?: (l: Linha) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linha: Linha) => {
      if (antes) await antes(linha);
      const { error } = await db.from(tabela).delete().eq("id", linha.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb", tabela] }); toast.success("Apagado."); },
    onError: (e: Error) => toast.error(e.message),
  });
}
