export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          client_name: string
          client_whatsapp: string
          company_whatsapp: string | null
          created_at: string | null
          date: string
          id: string
          service_id: string | null
          status: string | null
          time: string
          updated_at: string | null
        }
        Insert: {
          client_name: string
          client_whatsapp: string
          company_whatsapp?: string | null
          created_at?: string | null
          date: string
          id?: string
          service_id?: string | null
          status?: string | null
          time: string
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          client_whatsapp?: string
          company_whatsapp?: string | null
          created_at?: string | null
          date?: string
          id?: string
          service_id?: string | null
          status?: string | null
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_whatsapp_fkey"
            columns: ["company_whatsapp"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["whatsapp"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string | null
          company_whatsapp: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string | null
          slot_duration: number | null
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          company_whatsapp?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          slot_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          company_whatsapp?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          slot_duration?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_company_whatsapp_fkey"
            columns: ["company_whatsapp"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["whatsapp"]
          },
        ]
      }
      client_company_interactions: {
        Row: {
          client_name: string | null
          client_whatsapp: string
          company_whatsapp: string
          first_contact_at: string | null
          id: string
          last_contact_at: string | null
          total_interactions: number | null
        }
        Insert: {
          client_name?: string | null
          client_whatsapp: string
          company_whatsapp: string
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          total_interactions?: number | null
        }
        Update: {
          client_name?: string | null
          client_whatsapp?: string
          company_whatsapp?: string
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          total_interactions?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          cpf_cnpj: string | null
          created_at: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          professional_name: string | null
          social_media: string | null
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          address?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          professional_name?: string | null
          social_media?: string | null
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          address?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          professional_name?: string | null
          social_media?: string | null
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_whatsapp: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          password: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          company_whatsapp?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          company_whatsapp?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_whatsapp_fkey"
            columns: ["company_whatsapp"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["whatsapp"]
          },
        ]
      }
      services: {
        Row: {
          company_whatsapp: string | null
          created_at: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          company_whatsapp?: string | null
          created_at?: string | null
          duration: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          company_whatsapp?: string | null
          created_at?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_company_whatsapp_fkey"
            columns: ["company_whatsapp"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["whatsapp"]
          },
        ]
      }
      url_validations: {
        Row: {
          client_whatsapp: string
          company_whatsapp: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_valid: boolean | null
          security_code: string
          updated_at: string | null
        }
        Insert: {
          client_whatsapp: string
          company_whatsapp?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_valid?: boolean | null
          security_code: string
          updated_at?: string | null
        }
        Update: {
          client_whatsapp?: string
          company_whatsapp?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_valid?: boolean | null
          security_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "url_validations_company_whatsapp_fkey"
            columns: ["company_whatsapp"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["whatsapp"]
          },
        ]
      }
      user_auth: {
        Row: {
          client_whatsapp: string
          company_whatsapp: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_valid: boolean | null
          security_code: string
          updated_at: string | null
        }
        Insert: {
          client_whatsapp: string
          company_whatsapp: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_valid?: boolean | null
          security_code: string
          updated_at?: string | null
        }
        Update: {
          client_whatsapp?: string
          company_whatsapp?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_valid?: boolean | null
          security_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      validate_security_code: {
        Args: { user_phone: string; security_code: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
