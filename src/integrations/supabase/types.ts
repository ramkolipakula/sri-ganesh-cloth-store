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
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory_log: {
        Row: {
          changed_by: string | null
          created_at: string
          id: number
          new_stock: number
          old_stock: number | null
          product_id: string
          reason: string | null
          size_label: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: never
          new_stock: number
          old_stock?: number | null
          product_id: string
          reason?: string | null
          size_label: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: never
          new_stock?: number
          old_stock?: number | null
          product_id?: string
          reason?: string | null
          size_label?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size_label: string
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          size_label: string
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size_label?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_fee: number
          discount: number
          fulfillment: string
          id: string
          idempotency_key: string
          order_number: string
          payment_status: string
          reserved_until: string | null
          status: string
          stock_released: boolean
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_fee?: number
          discount?: number
          fulfillment: string
          id?: string
          idempotency_key: string
          order_number: string
          payment_status?: string
          reserved_until?: string | null
          status?: string
          stock_released?: boolean
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_fee?: number
          discount?: number
          fulfillment?: string
          id?: string
          idempotency_key?: string
          order_number?: string
          payment_status?: string
          reserved_until?: string | null
          status?: string
          stock_released?: boolean
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          id: string
          method: string
          order_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          screenshot_path: string
          status: string
          submitted_at: string
          transaction_ref: string
        }
        Insert: {
          admin_note?: string | null
          id?: string
          method?: string
          order_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          screenshot_path: string
          status?: string
          submitted_at?: string
          transaction_ref: string
        }
        Update: {
          admin_note?: string | null
          id?: string
          method?: string
          order_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          screenshot_path?: string
          status?: string
          submitted_at?: string
          transaction_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          size_label: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          size_label: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          size_label?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          category_id: string
          created_at: string
          description: string | null
          free_size_stock: number
          id: string
          image_path: string | null
          inventory_mode: string
          is_active: boolean
          is_featured: boolean
          name: string
          original_price: number | null
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          free_size_stock?: number
          id?: string
          image_path?: string | null
          inventory_mode?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          original_price?: number | null
          price: number
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          free_size_stock?: number
          id?: string
          image_path?: string | null
          inventory_mode?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          original_price?: number | null
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string
          delivery_enabled: boolean
          delivery_fee: number
          delivery_note: string | null
          id: number
          low_stock_threshold: number
          payee_name: string | null
          payment_instructions: string | null
          phone: string
          pickup_enabled: boolean
          qr_image_path: string | null
          reservation_hours: number
          store_name: string
          tagline: string
          updated_at: string
          upi_id: string | null
          whatsapp: string
        }
        Insert: {
          address?: string
          delivery_enabled?: boolean
          delivery_fee?: number
          delivery_note?: string | null
          id?: number
          low_stock_threshold?: number
          payee_name?: string | null
          payment_instructions?: string | null
          phone?: string
          pickup_enabled?: boolean
          qr_image_path?: string | null
          reservation_hours?: number
          store_name?: string
          tagline?: string
          updated_at?: string
          upi_id?: string | null
          whatsapp?: string
        }
        Update: {
          address?: string
          delivery_enabled?: boolean
          delivery_fee?: number
          delivery_note?: string | null
          id?: number
          low_stock_threshold?: number
          payee_name?: string | null
          payment_instructions?: string | null
          phone?: string
          pickup_enabled?: boolean
          qr_image_path?: string | null
          reservation_hours?: number
          store_name?: string
          tagline?: string
          updated_at?: string
          upi_id?: string | null
          whatsapp?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_mark_refunded: { Args: { p_order_id: string }; Returns: string }
      admin_review_payment: {
        Args: {
          p_action: string
          p_note?: string
          p_payment_id: string
          p_reason?: string
        }
        Returns: string
      }
      admin_update_order_status: {
        Args: { p_order_id: string; p_reason?: string; p_status: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_admins: {
        Args: { _msg: string; _order: string; _title: string }
        Returns: undefined
      }
      notify_user: {
        Args: { _msg: string; _order: string; _title: string; _uid: string }
        Returns: undefined
      }
      place_order: {
        Args: {
          p_address: string
          p_customer_name: string
          p_customer_phone: string
          p_fulfillment: string
          p_idempotency_key: string
          p_items: Json
        }
        Returns: string
      }
      release_expired_orders: { Args: never; Returns: number }
      restore_order_stock: { Args: { _order_id: string }; Returns: undefined }
      submit_payment_proof: {
        Args: {
          p_order_id: string
          p_screenshot_path: string
          p_transaction_ref: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
