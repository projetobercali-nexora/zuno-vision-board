export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contactos: {
        Row: {
          criado_em: string
          etiquetas: string[]
          id: string
          nome: string | null
          organizacao_id: string
          origem: string | null
          telefone: string
        }
        Insert: {
          criado_em?: string
          etiquetas?: string[]
          id?: string
          nome?: string | null
          organizacao_id: string
          origem?: string | null
          telefone: string
        }
        Update: {
          criado_em?: string
          etiquetas?: string[]
          id?: string
          nome?: string | null
          organizacao_id?: string
          origem?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          contacto_id: string
          criado_em: string
          estado: Database["public"]["Enums"]["estado_conversa"]
          estagio_id: string | null
          ia_ativa: boolean
          id: string
          organizacao_id: string
          ultima_mensagem_em: string | null
        }
        Insert: {
          contacto_id: string
          criado_em?: string
          estado?: Database["public"]["Enums"]["estado_conversa"]
          estagio_id?: string | null
          ia_ativa?: boolean
          id?: string
          organizacao_id: string
          ultima_mensagem_em?: string | null
        }
        Update: {
          contacto_id?: string
          criado_em?: string
          estado?: Database["public"]["Enums"]["estado_conversa"]
          estagio_id?: string | null
          ia_ativa?: boolean
          id?: string
          organizacao_id?: string
          ultima_mensagem_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_estagio_id_fkey"
            columns: ["estagio_id"]
            isOneToOne: false
            referencedRelation: "estagios_funil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      decisoes_jev: {
        Row: {
          conversa_id: string
          criado_em: string
          estagio: string | null
          id: string
          jogada: Database["public"]["Enums"]["jogada_jev"]
          motivo: string | null
          organizacao_id: string
          progresso: number
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          estagio?: string | null
          id?: string
          jogada: Database["public"]["Enums"]["jogada_jev"]
          motivo?: string | null
          organizacao_id: string
          progresso?: number
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          estagio?: string | null
          id?: string
          jogada?: Database["public"]["Enums"]["jogada_jev"]
          motivo?: string | null
          organizacao_id?: string
          progresso?: number
        }
        Relationships: [
          {
            foreignKeyName: "decisoes_jev_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisoes_jev_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      estagios_funil: {
        Row: {
          cor: string | null
          id: string
          nome: string
          ordem: number
          organizacao_id: string
        }
        Insert: {
          cor?: string | null
          id?: string
          nome: string
          ordem?: number
          organizacao_id: string
        }
        Update: {
          cor?: string | null
          id?: string
          nome?: string
          ordem?: number
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estagios_funil_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          conversa_id: string
          criado_em: string
          id: string
          organizacao_id: string
          remetente: Database["public"]["Enums"]["remetente_msg"]
          texto: string
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          id?: string
          organizacao_id: string
          remetente: Database["public"]["Enums"]["remetente_msg"]
          texto: string
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          id?: string
          organizacao_id?: string
          remetente?: Database["public"]["Enums"]["remetente_msg"]
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      papeis_utilizador: {
        Row: {
          id: string
          papel: Database["public"]["Enums"]["app_role"]
          utilizador_id: string
        }
        Insert: {
          id?: string
          papel: Database["public"]["Enums"]["app_role"]
          utilizador_id: string
        }
        Update: {
          id?: string
          papel?: Database["public"]["Enums"]["app_role"]
          utilizador_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          criado_em: string
          id: string
          nome: string | null
          organizacao_id: string
        }
        Insert: {
          criado_em?: string
          id: string
          nome?: string | null
          organizacao_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string | null
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          cabecalhos: Json | null
          corpo: Json | null
          erro: string | null
          id: string
          processado: boolean
          recebido_em: string
        }
        Insert: {
          cabecalhos?: Json | null
          corpo?: Json | null
          erro?: string | null
          id?: string
          processado?: boolean
          recebido_em?: string
        }
        Update: {
          cabecalhos?: Json | null
          corpo?: Json | null
          erro?: string | null
          id?: string
          processado?: boolean
          recebido_em?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      minha_organizacao: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "atendente"
      estado_conversa: "aberta" | "fechada"
      jogada_jev:
        | "perguntar"
        | "qualificar"
        | "apresentar"
        | "objecao"
        | "fechar"
      remetente_msg: "cliente" | "agente" | "humano"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "atendente"],
      estado_conversa: ["aberta", "fechada"],
      jogada_jev: [
        "perguntar",
        "qualificar",
        "apresentar",
        "objecao",
        "fechar",
      ],
      remetente_msg: ["cliente", "agente", "humano"],
    },
  },
} as const
