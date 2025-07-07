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
      issues: {
        Row: {
          address: string | null
          assigned_official_id: string | null
          assigned_to: string | null
          city: string | null
          created_at: string
          description: string
          district: string | null
          id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          latitude: number
          longitude: number
          media_urls: string[] | null
          pincode: string | null
          priority: number | null
          resolution_media_urls: string[] | null
          resolution_notes: string | null
          resolved_at: string | null
          state: string | null
          status: Database["public"]["Enums"]["issue_status"]
          suggested_official_id: string | null
          title: string
          updated_at: string
          user_id: string
          ward: string | null
        }
        Insert: {
          address?: string | null
          assigned_official_id?: string | null
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          description: string
          district?: string | null
          id?: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          latitude: number
          longitude: number
          media_urls?: string[] | null
          pincode?: string | null
          priority?: number | null
          resolution_media_urls?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          suggested_official_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          ward?: string | null
        }
        Update: {
          address?: string | null
          assigned_official_id?: string | null
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          description?: string
          district?: string | null
          id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"]
          latitude?: number
          longitude?: number
          media_urls?: string[] | null
          pincode?: string | null
          priority?: number | null
          resolution_media_urls?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          suggested_official_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          ward?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          issue_id: string | null
          message: string
          notification_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          issue_id?: string | null
          message: string
          notification_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          issue_id?: string | null
          message?: string
          notification_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          district: string | null
          full_name: string | null
          geo_bounds: Json | null
          id: string
          is_anonymous: boolean | null
          is_verified: boolean | null
          phone: string | null
          pincode: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          updated_at: string
          user_id: string
          ward: string | null
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          geo_bounds?: Json | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          pincode?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string
          user_id: string
          ward?: string | null
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          geo_bounds?: Json | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          pincode?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string
          user_id?: string
          ward?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          issue_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          issue_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          issue_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      issue_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "closed"
      issue_type:
        | "road"
        | "water"
        | "electricity"
        | "garbage"
        | "streetlight"
        | "sewage"
        | "other"
      user_role: "citizen" | "official"
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
    Enums: {
      issue_status: [
        "pending",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
      ],
      issue_type: [
        "road",
        "water",
        "electricity",
        "garbage",
        "streetlight",
        "sewage",
        "other",
      ],
      user_role: ["citizen", "official"],
    },
  },
} as const
