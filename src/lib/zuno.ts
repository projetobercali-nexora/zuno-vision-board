import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Estagio = Tables<"estagios_funil">;
export type Contacto = Tables<"contactos">;
export type Mensagem = Tables<"mensagens">;
export type ConversaComContacto = Tables<"conversas"> & {
  contactos: Contacto | null;
  ultima?: string | null;
};

export function useOrg() {
  return useQuery({
    queryKey: ["org"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sem sessão");
      const { data: perfil, error } = await supabase
        .from("perfis")
        .select("id, nome, organizacao_id, organizacoes(nome)")
        .eq("id", u.user.id)
        .single();
      if (error) throw error;
      return {
        userId: u.user.id,
        email: u.user.email,
        nome: perfil.nome,
        organizacaoId: perfil.organizacao_id,
        organizacaoNome: (perfil.organizacoes as { nome: string } | null)?.nome ?? "",
      };
    },
  });
}

export function useEstagios() {
  return useQuery({
    queryKey: ["estagios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("estagios_funil").select("*").order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useConversas() {
  return useQuery({
    queryKey: ["conversas"],
    queryFn: async (): Promise<ConversaComContacto[]> => {
      const { data, error } = await supabase
        .from("conversas")
        .select("*, contactos(*)")
        .order("ultima_mensagem_em", { ascending: false, nullsFirst: false });
      if (error) throw error;
      const ids = data.map((c) => c.id);
      const ultimas: Record<string, string> = {};
      if (ids.length) {
        const { data: msgs } = await supabase
          .from("mensagens")
          .select("conversa_id, texto, criado_em")
          .in("conversa_id", ids)
          .order("criado_em", { ascending: false })
          .limit(1000);
        msgs?.forEach((m) => {
          if (!(m.conversa_id in ultimas)) ultimas[m.conversa_id] = m.texto;
        });
      }
      return data.map((c) => ({ ...c, ultima: ultimas[c.id] ?? null }));
    },
  });
}

export function hora(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString())
    return d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit" });
}

export function iniciais(nome?: string | null) {
  return (nome ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
