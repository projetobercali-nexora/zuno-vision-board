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
      agente_fila: {
        Row: {
          conversa_id: string
          criado_em: string
          id: number
          organizacao_id: string
          processado: boolean
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          id?: number
          organizacao_id: string
          processado?: boolean
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          id?: number
          organizacao_id?: string
          processado?: boolean
        }
        Relationships: []
      }
      config_atendimento: {
        Row: {
          fuso: string
          instrucao_fora: string
          organizacao_id: string
          usar_horario: boolean
        }
        Insert: {
          fuso?: string
          instrucao_fora?: string
          organizacao_id: string
          usar_horario?: boolean
        }
        Update: {
          fuso?: string
          instrucao_fora?: string
          organizacao_id?: string
          usar_horario?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "config_atendimento_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      config_jev: {
        Row: {
          ativo: boolean
          id: number
          instrucoes: string
          modelo: string
        }
        Insert: {
          ativo?: boolean
          id?: number
          instrucoes: string
          modelo?: string
        }
        Update: {
          ativo?: boolean
          id?: number
          instrucoes?: string
          modelo?: string
        }
        Relationships: []
      }
      config_lembretes: {
        Row: {
          brinde_ativo: boolean
          espera_ativo: boolean
          espera_minutos: number
          humano_ativo: boolean
          organizacao_id: string
          parada_ativo: boolean
          parada_horas: number
          quente_ativo: boolean
          quente_probabilidade: number
        }
        Insert: {
          brinde_ativo?: boolean
          espera_ativo?: boolean
          espera_minutos?: number
          humano_ativo?: boolean
          organizacao_id: string
          parada_ativo?: boolean
          parada_horas?: number
          quente_ativo?: boolean
          quente_probabilidade?: number
        }
        Update: {
          brinde_ativo?: boolean
          espera_ativo?: boolean
          espera_minutos?: number
          humano_ativo?: boolean
          organizacao_id?: string
          parada_ativo?: boolean
          parada_horas?: number
          quente_ativo?: boolean
          quente_probabilidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "config_lembretes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
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
          fechada_em: string | null
          ia_ativa: boolean
          id: string
          organizacao_id: string
          ultima_mensagem_em: string | null
          valor_venda: number | null
        }
        Insert: {
          contacto_id: string
          criado_em?: string
          estado?: Database["public"]["Enums"]["estado_conversa"]
          estagio_id?: string | null
          fechada_em?: string | null
          ia_ativa?: boolean
          id?: string
          organizacao_id: string
          ultima_mensagem_em?: string | null
          valor_venda?: number | null
        }
        Update: {
          contacto_id?: string
          criado_em?: string
          estado?: Database["public"]["Enums"]["estado_conversa"]
          estagio_id?: string | null
          fechada_em?: string | null
          ia_ativa?: boolean
          id?: string
          organizacao_id?: string
          ultima_mensagem_em?: string | null
          valor_venda?: number | null
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
          intencao_cliente: string | null
          jogada: Database["public"]["Enums"]["jogada_jev"]
          motivo: string | null
          organizacao_id: string
          probabilidade_conversao: number | null
          progresso: number
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          estagio?: string | null
          id?: string
          intencao_cliente?: string | null
          jogada: Database["public"]["Enums"]["jogada_jev"]
          motivo?: string | null
          organizacao_id: string
          probabilidade_conversao?: number | null
          progresso?: number
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          estagio?: string | null
          id?: string
          intencao_cliente?: string | null
          jogada?: Database["public"]["Enums"]["jogada_jev"]
          motivo?: string | null
          organizacao_id?: string
          probabilidade_conversao?: number | null
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
      horario_atendimento: {
        Row: {
          abre: string
          ativo: boolean
          dia_semana: number
          fecha: string
          id: string
          organizacao_id: string
        }
        Insert: {
          abre?: string
          ativo?: boolean
          dia_semana: number
          fecha?: string
          id?: string
          organizacao_id: string
        }
        Update: {
          abre?: string
          ativo?: boolean
          dia_semana?: number
          fecha?: string
          id?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horario_atendimento_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      instancias_whatsapp: {
        Row: {
          criado_em: string
          id: string
          nome_instancia: string | null
          numero: string
          organizacao_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome_instancia?: string | null
          numero: string
          organizacao_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome_instancia?: string | null
          numero?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instancias_whatsapp_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      jev_fila: {
        Row: {
          conversa_id: string
          criado_em: string
          id: number
          organizacao_id: string
          processado: boolean
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          id?: number
          organizacao_id: string
          processado?: boolean
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          id?: number
          organizacao_id?: string
          processado?: boolean
        }
        Relationships: []
      }
      jev_logs: {
        Row: {
          conversa_id: string | null
          criado_em: string
          detalhe: string | null
          estado: string | null
          id: number
        }
        Insert: {
          conversa_id?: string | null
          criado_em?: string
          detalhe?: string | null
          estado?: string | null
          id?: number
        }
        Update: {
          conversa_id?: string | null
          criado_em?: string
          detalhe?: string | null
          estado?: string | null
          id?: number
        }
        Relationships: []
      }
      kb_agente: {
        Row: {
          apresentacao: string | null
          atualizado_em: string
          despedida: string | null
          funcao: string
          mensagem_passar_humano: string
          modo: string
          nome: string
          organizacao_id: string
          pausa_max_seg: number
          pausa_min_seg: number
          personalidade: string | null
          saudacao: string | null
          tamanho_resposta: string
          tom: string
          usa_emojis: string
          variante_idioma: string
        }
        Insert: {
          apresentacao?: string | null
          atualizado_em?: string
          despedida?: string | null
          funcao?: string
          mensagem_passar_humano?: string
          modo?: string
          nome?: string
          organizacao_id: string
          pausa_max_seg?: number
          pausa_min_seg?: number
          personalidade?: string | null
          saudacao?: string | null
          tamanho_resposta?: string
          tom?: string
          usa_emojis?: string
          variante_idioma?: string
        }
        Update: {
          apresentacao?: string | null
          atualizado_em?: string
          despedida?: string | null
          funcao?: string
          mensagem_passar_humano?: string
          modo?: string
          nome?: string
          organizacao_id?: string
          pausa_max_seg?: number
          pausa_min_seg?: number
          personalidade?: string | null
          saudacao?: string | null
          tamanho_resposta?: string
          tom?: string
          usa_emojis?: string
          variante_idioma?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_agente_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_estrategia: {
        Row: {
          id: string
          instrucoes: string
          jogada: string
          organizacao_id: string
        }
        Insert: {
          id?: string
          instrucoes?: string
          jogada: string
          organizacao_id: string
        }
        Update: {
          id?: string
          instrucoes?: string
          jogada?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_estrategia_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_faq: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          organizacao_id: string
          pergunta: string
          resposta: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          organizacao_id: string
          pergunta: string
          resposta: string
          tipo?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          organizacao_id?: string
          pergunta?: string
          resposta?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_faq_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_midias: {
        Row: {
          ativo: boolean
          caminho_storage: string | null
          criado_em: string
          descricao: string | null
          id: string
          legenda: string | null
          organizacao_id: string
          produto_id: string | null
          quando_enviar: string | null
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          ativo?: boolean
          caminho_storage?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          legenda?: string | null
          organizacao_id: string
          produto_id?: string | null
          quando_enviar?: string | null
          tipo: string
          titulo: string
          url: string
        }
        Update: {
          ativo?: boolean
          caminho_storage?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          legenda?: string | null
          organizacao_id?: string
          produto_id?: string | null
          quando_enviar?: string | null
          tipo?: string
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_midias_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_midias_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "kb_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_negocio: {
        Row: {
          atualizado_em: string
          contactos: string | null
          descricao: string | null
          diferenciais: string | null
          formas_pagamento: string | null
          garantia_devolucoes: string | null
          horario: string | null
          localizacao: string | null
          nome_empresa: string | null
          o_que_vende: string | null
          organizacao_id: string
          outras_informacoes: string | null
          politica_entrega: string | null
          publico_alvo: string | null
          zonas_entrega: string | null
        }
        Insert: {
          atualizado_em?: string
          contactos?: string | null
          descricao?: string | null
          diferenciais?: string | null
          formas_pagamento?: string | null
          garantia_devolucoes?: string | null
          horario?: string | null
          localizacao?: string | null
          nome_empresa?: string | null
          o_que_vende?: string | null
          organizacao_id: string
          outras_informacoes?: string | null
          politica_entrega?: string | null
          publico_alvo?: string | null
          zonas_entrega?: string | null
        }
        Update: {
          atualizado_em?: string
          contactos?: string | null
          descricao?: string | null
          diferenciais?: string | null
          formas_pagamento?: string | null
          garantia_devolucoes?: string | null
          horario?: string | null
          localizacao?: string | null
          nome_empresa?: string | null
          o_que_vende?: string | null
          organizacao_id?: string
          outras_informacoes?: string | null
          politica_entrega?: string | null
          publico_alvo?: string | null
          zonas_entrega?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_negocio_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_numeros_teste: {
        Row: {
          id: string
          nome: string | null
          organizacao_id: string
          telefone: string
        }
        Insert: {
          id?: string
          nome?: string | null
          organizacao_id: string
          telefone: string
        }
        Update: {
          id?: string
          nome?: string | null
          organizacao_id?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_numeros_teste_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_passar_humano: {
        Row: {
          ativo: boolean
          gatilho: string
          id: string
          organizacao_id: string
        }
        Insert: {
          ativo?: boolean
          gatilho: string
          id?: string
          organizacao_id: string
        }
        Update: {
          ativo?: boolean
          gatilho?: string
          id?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_passar_humano_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          criado_em: string
          descricao: string | null
          id: string
          link: string | null
          nome: string
          ordem: number
          organizacao_id: string
          preco_texto: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          link?: string | null
          nome: string
          ordem?: number
          organizacao_id: string
          preco_texto?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          link?: string | null
          nome?: string
          ordem?: number
          organizacao_id?: string
          preco_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_produtos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_regras: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          ordem: number
          organizacao_id: string
          texto: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          ordem?: number
          organizacao_id: string
          texto: string
          tipo: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          ordem?: number
          organizacao_id?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_regras_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      leitura_fila: {
        Row: {
          conversa_id: string
          criado_em: string
          id: number
          id_externo: string
          organizacao_id: string
          processado: boolean
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          id?: number
          id_externo: string
          organizacao_id: string
          processado?: boolean
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          id?: number
          id_externo?: string
          organizacao_id?: string
          processado?: boolean
        }
        Relationships: []
      }
      lembretes: {
        Row: {
          chave: string | null
          contacto_id: string | null
          conversa_id: string | null
          criado_em: string
          estado: string
          id: string
          organizacao_id: string
          resolvido_em: string | null
          texto: string | null
          tipo: string
          titulo: string
          vence_em: string
        }
        Insert: {
          chave?: string | null
          contacto_id?: string | null
          conversa_id?: string | null
          criado_em?: string
          estado?: string
          id?: string
          organizacao_id: string
          resolvido_em?: string | null
          texto?: string | null
          tipo: string
          titulo: string
          vence_em?: string
        }
        Update: {
          chave?: string | null
          contacto_id?: string | null
          conversa_id?: string | null
          criado_em?: string
          estado?: string
          id?: string
          organizacao_id?: string
          resolvido_em?: string | null
          texto?: string | null
          tipo?: string
          titulo?: string
          vence_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembretes_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembretes_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembretes_organizacao_id_fkey"
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
          id_externo: string | null
          organizacao_id: string
          remetente: Database["public"]["Enums"]["remetente_msg"]
          texto: string
          tipo: string
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          id?: string
          id_externo?: string | null
          organizacao_id: string
          remetente: Database["public"]["Enums"]["remetente_msg"]
          texto: string
          tipo?: string
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          id?: string
          id_externo?: string | null
          organizacao_id?: string
          remetente?: Database["public"]["Enums"]["remetente_msg"]
          texto?: string
          tipo?: string
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
      automacao_semear: { Args: { p_org: string }; Returns: undefined }
      executar_agente: { Args: never; Returns: undefined }
      executar_jev: { Args: never; Returns: undefined }
      executar_leitura: { Args: never; Returns: undefined }
      gerar_lembretes: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      horario_texto: { Args: { p_org: string }; Returns: string }
      kb_contexto_agente: { Args: { p_org: string }; Returns: string }
      kb_contexto_jev: { Args: { p_org: string }; Returns: string }
      kb_semear: { Args: { p_org: string }; Returns: undefined }
      minha_organizacao: { Args: never; Returns: string }
      sou_admin: { Args: never; Returns: boolean }
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
