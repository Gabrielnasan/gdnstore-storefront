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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customer_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          shopify_customer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          shopify_customer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          shopify_customer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_session_exchanges: {
        Row: {
          created_at: string
          customer_session_id: string
          exchange_code_hash: string
          expires_at: string
          id: string
          return_to: string
          session_token_encrypted: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_session_id: string
          exchange_code_hash: string
          expires_at: string
          id?: string
          return_to?: string
          session_token_encrypted: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_session_id?: string
          exchange_code_hash?: string
          expires_at?: string
          id?: string
          return_to?: string
          session_token_encrypted?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_session_exchanges_customer_session_id_fkey"
            columns: ["customer_session_id"]
            isOneToOne: false
            referencedRelation: "customer_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_sessions: {
        Row: {
          created_at: string
          customer_profile_id: string
          expires_at: string
          id: string
          ip_address: string | null
          last_seen_at: string
          revoked_at: string | null
          session_token_hash: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          customer_profile_id: string
          expires_at: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          session_token_hash: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          customer_profile_id?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          session_token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_sessions_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_shopify_tokens: {
        Row: {
          access_token_encrypted: string
          created_at: string
          customer_profile_id: string
          expires_at: string | null
          id: string
          id_token_encrypted: string | null
          refresh_token_encrypted: string | null
          scope: string | null
          token_type: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          customer_profile_id: string
          expires_at?: string | null
          id?: string
          id_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          customer_profile_id?: string
          expires_at?: string | null
          id?: string
          id_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_shopify_tokens_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: true
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          id: string
          question: string
          shopify_product_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          question: string
          shopify_product_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          question?: string
          shopify_product_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_review_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          review_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          review_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          review_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          customer_email: string | null
          customer_name: string
          helpful_count: number
          id: string
          rating: number
          shopify_product_id: string
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
          verified_purchase: boolean
        }
        Insert: {
          comment: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          helpful_count?: number
          id?: string
          rating: number
          shopify_product_id: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_purchase?: boolean
        }
        Update: {
          comment?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          helpful_count?: number
          id?: string
          rating?: number
          shopify_product_id?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_purchase?: boolean
        }
        Relationships: []
      }
      shopify_oauth_states: {
        Row: {
          code_verifier_encrypted: string
          created_at: string
          expires_at: string
          id: string
          login_hint: string | null
          return_to: string
          state_hash: string
          used_at: string | null
        }
        Insert: {
          code_verifier_encrypted: string
          created_at?: string
          expires_at: string
          id?: string
          login_hint?: string | null
          return_to?: string
          state_hash: string
          used_at?: string | null
        }
        Update: {
          code_verifier_encrypted?: string
          created_at?: string
          expires_at?: string
          id?: string
          login_hint?: string | null
          return_to?: string
          state_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
