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
      badges: {
        Row: {
          description: string
          id: string
          image_url: string | null
          name: string
          sort: number
        }
        Insert: {
          description?: string
          id?: string
          image_url?: string | null
          name: string
          sort?: number
        }
        Update: {
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          sort?: number
        }
        Relationships: []
      }
      blooks: {
        Row: {
          emoji: string
          id: string
          image_url: string | null
          name: string
          pack_id: string | null
          rarity: string
          weight: number
        }
        Insert: {
          emoji: string
          id?: string
          image_url?: string | null
          name: string
          pack_id?: string | null
          rarity?: string
          weight?: number
        }
        Update: {
          emoji?: string
          id?: string
          image_url?: string | null
          name?: string
          pack_id?: string | null
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
          reply_to: string | null
          user_id: string
          username: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          reply_to?: string | null
          user_id?: string
          username?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          reply_to?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
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
          image_url: string | null
          play_url: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          image_url?: string | null
          play_url?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          image_url?: string | null
          play_url?: string
          title?: string
        }
        Relationships: []
      }
      market_settings: {
        Row: {
          colors: Json
          id: string
        }
        Insert: {
          colors?: Json
          id?: string
        }
        Update: {
          colors?: Json
          id?: string
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
      notifications: {
        Row: {
          actor_name: string
          body: string
          created_at: string
          id: string
          message_id: string | null
          read: boolean
          user_id: string
        }
        Insert: {
          actor_name?: string
          body?: string
          created_at?: string
          id?: string
          message_id?: string | null
          read?: boolean
          user_id: string
        }
        Update: {
          actor_name?: string
          body?: string
          created_at?: string
          id?: string
          message_id?: string | null
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          color: string
          emoji: string
          gradient_end: string
          gradient_start: string
          id: string
          image_url: string | null
          name: string
          open_image_url: string | null
          pattern_image_url: string | null
          price: number
          sort: number
        }
        Insert: {
          color?: string
          emoji?: string
          gradient_end?: string
          gradient_start?: string
          id?: string
          image_url?: string | null
          name: string
          open_image_url?: string | null
          pattern_image_url?: string | null
          price?: number
          sort?: number
        }
        Update: {
          color?: string
          emoji?: string
          gradient_end?: string
          gradient_start?: string
          id?: string
          image_url?: string | null
          name?: string
          open_image_url?: string | null
          pattern_image_url?: string | null
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
      staff_roles: {
        Row: {
          colors: string[]
          created_at: string
          id: string
          name: string
          permissions: string[]
          sort: number
        }
        Insert: {
          colors?: string[]
          created_at?: string
          id?: string
          name: string
          permissions?: string[]
          sort?: number
        }
        Update: {
          colors?: string[]
          created_at?: string
          id?: string
          name?: string
          permissions?: string[]
          sort?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          user_id: string
        }
        Update: {
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_staff_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_staff_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
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
      has_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mission_progress: { Args: { _kind: string }; Returns: number }
      my_permissions: { Args: never; Returns: string[] }
      open_pack: { Args: { _pack: string }; Returns: Json }
      open_packs: { Args: { _pack: string; _quantity: number }; Returns: Json }
      record_play: { Args: { _game: string }; Returns: undefined }
      sell_blook: { Args: { _blook: string }; Returns: number }
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
