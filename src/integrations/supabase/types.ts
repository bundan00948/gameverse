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
      blooks: {
        Row: {
          emoji: string
          id: string
          name: string
          pack_id: string
          rarity: string
          weight: number
        }
        Insert: {
          emoji: string
          id?: string
          name: string
          pack_id: string
          rarity?: string
          weight?: number
        }
        Update: {
          emoji?: string
          id?: string
          name?: string
          pack_id?: string
          rarity?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "blooks_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      game_plays: {
        Row: {
          game_id: string
          id: string
          played_at: string
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          played_at?: string
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          played_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_plays_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          description: string
          emoji: string
          id: string
          play_url: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          play_url?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          play_url?: string
          title?: string
        }
        Relationships: []
      }
      mission_claims: {
        Row: {
          claimed_at: string
          mission_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          mission_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_claims_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          goal: number
          id: string
          kind: string
          reward: number
          title: string
        }
        Insert: {
          goal: number
          id?: string
          kind: string
          reward?: number
          title: string
        }
        Update: {
          goal?: number
          id?: string
          kind?: string
          reward?: number
          title?: string
        }
        Relationships: []
      }
      packs: {
        Row: {
          color: string
          emoji: string
          id: string
          name: string
          price: number
          sort: number
        }
        Insert: {
          color?: string
          emoji?: string
          id?: string
          name: string
          price?: number
          sort?: number
        }
        Update: {
          color?: string
          emoji?: string
          id?: string
          name?: string
          price?: number
          sort?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          username?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      user_blooks: {
        Row: {
          blook_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          blook_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          blook_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blooks_blook_id_fkey"
            columns: ["blook_id"]
            isOneToOne: false
            referencedRelation: "blooks"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          last_claim: string | null
          packs_opened: number
          tokens: number
          user_id: string
        }
        Insert: {
          last_claim?: string | null
          packs_opened?: number
          tokens?: number
          user_id: string
        }
        Update: {
          last_claim?: string | null
          packs_opened?: number
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_daily: { Args: never; Returns: number }
      claim_mission: { Args: { _mission: string }; Returns: number }
      ensure_wallet: {
        Args: never
        Returns: {
          last_claim: string | null
          packs_opened: number
          tokens: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mission_progress: { Args: { _kind: string }; Returns: number }
      open_pack: { Args: { _pack: string }; Returns: Json }
      record_play: { Args: { _game: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
