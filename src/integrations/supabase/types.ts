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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          perm_assign_orders: string
          perm_banners: string
          perm_categories: string
          perm_cooks: string
          perm_delivery_staff: string
          perm_items: string
          perm_locations: string
          perm_orders: string
          perm_reports: string
          perm_settlements: string
          perm_special_offers: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          perm_assign_orders?: string
          perm_banners?: string
          perm_categories?: string
          perm_cooks?: string
          perm_delivery_staff?: string
          perm_items?: string
          perm_locations?: string
          perm_orders?: string
          perm_reports?: string
          perm_settlements?: string
          perm_special_offers?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          perm_assign_orders?: string
          perm_banners?: string
          perm_categories?: string
          perm_cooks?: string
          perm_delivery_staff?: string
          perm_items?: string
          perm_locations?: string
          perm_orders?: string
          perm_reports?: string
          perm_settlements?: string
          perm_special_offers?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          display_order: number
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          food_item_id: string
          id: string
          quantity: number
          selected_cook_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_item_id: string
          id?: string
          quantity?: number
          selected_cook_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_item_id?: string
          id?: string
          quantity?: number
          selected_cook_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_selected_cook_id_fkey"
            columns: ["selected_cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_kitchen_slots: {
        Row: {
          created_at: string
          cutoff_hours_before: number
          delivery_charge: number
          display_order: number
          end_time: string
          id: string
          is_active: boolean
          name: string
          slot_type: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cutoff_hours_before?: number
          delivery_charge?: number
          display_order?: number
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          slot_type: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cutoff_hours_before?: number
          delivery_charge?: number
          display_order?: number
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          slot_type?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      combo_food_items: {
        Row: {
          combo_id: string
          created_at: string
          food_item_id: string
          id: string
          quantity: number
        }
        Insert: {
          combo_id: string
          created_at?: string
          food_item_id: string
          id?: string
          quantity?: number
        }
        Update: {
          combo_id?: string
          created_at?: string
          food_item_id?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_food_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combo_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_food_items_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_foods: {
        Row: {
          combo_price: number | null
          cook_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          division_ids: string[]
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          is_vegetarian: boolean
          name: string
          service_types: string[]
          updated_at: string
        }
        Insert: {
          combo_price?: number | null
          cook_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          division_ids?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_vegetarian?: boolean
          name: string
          service_types?: string[]
          updated_at?: string
        }
        Update: {
          combo_price?: number | null
          cook_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          division_ids?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_vegetarian?: boolean
          name?: string
          service_types?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_foods_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          commission_percent: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          max_commission_amount: number | null
          min_order_amount: number | null
          name: string
          service_type: string
          updated_at: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_commission_amount?: number | null
          min_order_amount?: number | null
          name: string
          service_type?: string
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_commission_amount?: number | null
          min_order_amount?: number | null
          name?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cook_combo_request_items: {
        Row: {
          created_at: string
          food_item_id: string
          id: string
          quantity: number
          request_id: string
        }
        Insert: {
          created_at?: string
          food_item_id: string
          id?: string
          quantity?: number
          request_id: string
        }
        Update: {
          created_at?: string
          food_item_id?: string
          id?: string
          quantity?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_combo_request_items_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_combo_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "cook_combo_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_combo_requests: {
        Row: {
          admin_notes: string | null
          combo_description: string | null
          combo_name: string
          combo_price: number | null
          cook_id: string
          created_at: string
          created_combo_id: string | null
          discount_type: string
          discount_value: number
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          combo_description?: string | null
          combo_name: string
          combo_price?: number | null
          cook_id: string
          created_at?: string
          created_combo_id?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          combo_description?: string | null
          combo_name?: string
          combo_price?: number | null
          cook_id?: string
          created_at?: string
          created_combo_id?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_combo_requests_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_combo_requests_created_combo_id_fkey"
            columns: ["created_combo_id"]
            isOneToOne: false
            referencedRelation: "combo_foods"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_dish_features: {
        Row: {
          cook_dish_id: string
          created_at: string
          display_order: number
          feature_text: string
          id: string
        }
        Insert: {
          cook_dish_id: string
          created_at?: string
          display_order?: number
          feature_text: string
          id?: string
        }
        Update: {
          cook_dish_id?: string
          created_at?: string
          display_order?: number
          feature_text?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_dish_features_cook_dish_id_fkey"
            columns: ["cook_dish_id"]
            isOneToOne: false
            referencedRelation: "cook_dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_dish_requests: {
        Row: {
          admin_notes: string | null
          cook_id: string
          created_at: string
          created_food_item_id: string | null
          dish_category_id: string | null
          dish_description: string | null
          dish_is_vegetarian: boolean | null
          dish_name: string | null
          dish_preparation_time_minutes: number | null
          dish_price: number | null
          food_item_id: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          cook_id: string
          created_at?: string
          created_food_item_id?: string | null
          dish_category_id?: string | null
          dish_description?: string | null
          dish_is_vegetarian?: boolean | null
          dish_name?: string | null
          dish_preparation_time_minutes?: number | null
          dish_price?: number | null
          food_item_id?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          cook_id?: string
          created_at?: string
          created_food_item_id?: string | null
          dish_category_id?: string | null
          dish_description?: string | null
          dish_is_vegetarian?: boolean | null
          dish_name?: string | null
          dish_preparation_time_minutes?: number | null
          dish_price?: number | null
          food_item_id?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_dish_requests_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_dish_requests_created_food_item_id_fkey"
            columns: ["created_food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_dish_requests_dish_category_id_fkey"
            columns: ["dish_category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_dish_requests_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_dishes: {
        Row: {
          allocated_at: string
          allocated_by: string | null
          cook_id: string
          created_at: string
          custom_price: number | null
          food_item_id: string
          id: string
          is_coming_soon: boolean
          updated_at: string
        }
        Insert: {
          allocated_at?: string
          allocated_by?: string | null
          cook_id: string
          created_at?: string
          custom_price?: number | null
          food_item_id: string
          id?: string
          is_coming_soon?: boolean
          updated_at?: string
        }
        Update: {
          allocated_at?: string
          allocated_by?: string | null
          cook_id?: string
          created_at?: string
          custom_price?: number | null
          food_item_id?: string
          id?: string
          is_coming_soon?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_dishes_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_dishes_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cooks: {
        Row: {
          allowed_order_types: string[]
          assigned_panchayat_ids: string[]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_available: boolean
          kitchen_name: string
          mobile_number: string
          panchayat_id: string | null
          password_hash: string | null
          rating: number | null
          total_orders: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          allowed_order_types?: string[]
          assigned_panchayat_ids?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_available?: boolean
          kitchen_name: string
          mobile_number: string
          panchayat_id?: string | null
          password_hash?: string | null
          rating?: number | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          allowed_order_types?: string[]
          assigned_panchayat_ids?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_available?: boolean
          kitchen_name?: string
          mobile_number?: string
          panchayat_id?: string | null
          password_hash?: string | null
          rating?: number | null
          total_orders?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cooks_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_label: string | null
          created_at: string
          full_address: string
          id: string
          is_default: boolean
          landmark: string | null
          panchayat_id: string | null
          updated_at: string
          user_id: string
          ward_number: number | null
        }
        Insert: {
          address_label?: string | null
          created_at?: string
          full_address: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          panchayat_id?: string | null
          updated_at?: string
          user_id: string
          ward_number?: number | null
        }
        Update: {
          address_label?: string | null
          created_at?: string
          full_address?: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          panchayat_id?: string | null
          updated_at?: string
          user_id?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "customer_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_credited: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_credited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_credited?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_rules: {
        Row: {
          created_at: string
          free_delivery_above: number | null
          id: string
          is_active: boolean
          max_delivery_charge: number | null
          min_delivery_charge: number
          per_km_charge: number | null
          rule_name: string
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_delivery_above?: number | null
          id?: string
          is_active?: boolean
          max_delivery_charge?: number | null
          min_delivery_charge?: number
          per_km_charge?: number | null
          rule_name: string
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_delivery_above?: number | null
          id?: string
          is_active?: boolean
          max_delivery_charge?: number | null
          min_delivery_charge?: number
          per_km_charge?: number | null
          rule_name?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_staff: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_panchayat_ids: string[] | null
          assigned_wards: number[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_approved: boolean
          is_available: boolean
          mobile_number: string
          name: string
          panchayat_id: string | null
          rating: number | null
          staff_type: string
          total_deliveries: number | null
          updated_at: string
          user_id: string | null
          vehicle_number: string | null
          vehicle_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_panchayat_ids?: string[] | null
          assigned_wards?: number[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_approved?: boolean
          is_available?: boolean
          mobile_number: string
          name: string
          panchayat_id?: string | null
          rating?: number | null
          staff_type?: string
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_panchayat_ids?: string[] | null
          assigned_wards?: number[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_approved?: boolean
          is_available?: boolean
          mobile_number?: string
          name?: string
          panchayat_id?: string | null
          rating?: number | null
          staff_type?: string
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_number?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_staff_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_wallets: {
        Row: {
          collected_amount: number
          created_at: string
          delivery_staff_id: string
          id: string
          job_earnings: number
          total_settled: number
          updated_at: string
        }
        Insert: {
          collected_amount?: number
          created_at?: string
          delivery_staff_id: string
          id?: string
          job_earnings?: number
          total_settled?: number
          updated_at?: string
        }
        Update: {
          collected_amount?: number
          created_at?: string
          delivery_staff_id?: string
          id?: string
          job_earnings?: number
          total_settled?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_wallets_delivery_staff_id_fkey"
            columns: ["delivery_staff_id"]
            isOneToOne: true
            referencedRelation: "delivery_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          service_type: Database["public"]["Enums"]["service_type"] | null
          service_types: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          service_types?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          service_types?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      food_item_images: {
        Row: {
          created_at: string
          display_order: number
          food_item_id: string
          id: string
          image_url: string
          is_primary: boolean
        }
        Insert: {
          created_at?: string
          display_order?: number
          food_item_id: string
          id?: string
          image_url: string
          is_primary?: boolean
        }
        Update: {
          created_at?: string
          display_order?: number
          food_item_id?: string
          id?: string
          image_url?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "food_item_images_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          available_all_panchayats: boolean | null
          available_panchayat_ids: string[] | null
          category_id: string | null
          cloud_kitchen_slot_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_available: boolean
          is_coming_soon: boolean
          is_coming_soon_cloud_kitchen: boolean
          is_coming_soon_home_delivery: boolean
          is_featured: boolean | null
          is_vegetarian: boolean
          max_images: number
          min_images: number
          min_order_sets: number | null
          name: string
          panchayat_id: string | null
          platform_margin_type: string | null
          platform_margin_value: number | null
          preparation_time_minutes: number | null
          price: number
          serves_persons: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          service_types: string[] | null
          set_size: number | null
          updated_at: string
          ward_number: number | null
        }
        Insert: {
          available_all_panchayats?: boolean | null
          available_panchayat_ids?: string[] | null
          category_id?: string | null
          cloud_kitchen_slot_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_available?: boolean
          is_coming_soon?: boolean
          is_coming_soon_cloud_kitchen?: boolean
          is_coming_soon_home_delivery?: boolean
          is_featured?: boolean | null
          is_vegetarian?: boolean
          max_images?: number
          min_images?: number
          min_order_sets?: number | null
          name: string
          panchayat_id?: string | null
          platform_margin_type?: string | null
          platform_margin_value?: number | null
          preparation_time_minutes?: number | null
          price: number
          serves_persons?: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          service_types?: string[] | null
          set_size?: number | null
          updated_at?: string
          ward_number?: number | null
        }
        Update: {
          available_all_panchayats?: boolean | null
          available_panchayat_ids?: string[] | null
          category_id?: string | null
          cloud_kitchen_slot_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_available?: boolean
          is_coming_soon?: boolean
          is_coming_soon_cloud_kitchen?: boolean
          is_coming_soon_home_delivery?: boolean
          is_featured?: boolean | null
          is_vegetarian?: boolean
          max_images?: number
          min_images?: number
          min_order_sets?: number | null
          name?: string
          panchayat_id?: string | null
          platform_margin_type?: string | null
          platform_margin_value?: number | null
          preparation_time_minutes?: number | null
          price?: number
          serves_persons?: number | null
          service_type?: Database["public"]["Enums"]["service_type"]
          service_types?: string[] | null
          set_size?: number | null
          updated_at?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_items_cloud_kitchen_slot_id_fkey"
            columns: ["cloud_kitchen_slot_id"]
            isOneToOne: false
            referencedRelation: "cloud_kitchen_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_items_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      indoor_event_services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          price_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          price_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          price_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      indoor_event_vehicles: {
        Row: {
          created_at: string
          driver_mobile: string
          driver_name: string | null
          id: string
          notes: string | null
          order_id: string
          rent_amount: number | null
          updated_at: string
          vehicle_number: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          driver_mobile: string
          driver_name?: string | null
          id?: string
          notes?: string | null
          order_id: string
          rent_amount?: number | null
          updated_at?: string
          vehicle_number: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          driver_mobile?: string
          driver_name?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          rent_amount?: number | null
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indoor_event_vehicles_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_assigned_cooks: {
        Row: {
          assigned_at: string
          cook_id: string
          cook_status: string
          created_at: string
          id: string
          notes: string | null
          order_id: string
          responded_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          cook_id: string
          cook_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          responded_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          cook_id?: string
          cook_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          responded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_assigned_cooks_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_assigned_cooks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          assigned_cook_id: string | null
          created_at: string
          food_item_id: string
          id: string
          order_id: string
          quantity: number
          special_instructions: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          assigned_cook_id?: string | null
          created_at?: string
          food_item_id: string
          id?: string
          order_id: string
          quantity?: number
          special_instructions?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          assigned_cook_id?: string | null
          created_at?: string
          food_item_id?: string
          id?: string
          order_id?: string
          quantity?: number
          special_instructions?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_assigned_cook_id_fkey"
            columns: ["assigned_cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ratings: {
        Row: {
          cook_id: string | null
          created_at: string
          customer_id: string
          food_item_id: string
          id: string
          order_id: string
          order_item_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          cook_id?: string | null
          created_at?: string
          customer_id: string
          food_item_id: string
          id?: string
          order_id: string
          order_item_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          cook_id?: string | null
          created_at?: string
          customer_id?: string
          food_item_id?: string
          id?: string
          order_id?: string
          order_item_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_payment_received: boolean | null
          advance_payment_required: number | null
          advance_payment_verified_at: string | null
          advance_payment_verified_by: string | null
          assigned_cook_id: string | null
          assigned_delivery_id: string | null
          cloud_kitchen_slot_id: string | null
          cook_assigned_at: string | null
          cook_assignment_status: string | null
          cook_responded_at: string | null
          cook_response_deadline: string | null
          cook_status: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_amount: number | null
          delivery_earnings: number | null
          delivery_eta: string | null
          delivery_instructions: string | null
          delivery_status: string | null
          estimated_delivery_minutes: number | null
          event_date: string | null
          event_details: string | null
          event_type_id: string | null
          guest_count: number | null
          id: string
          order_number: string
          order_type: string | null
          package_id: string | null
          panchayat_id: string
          referral_code: string | null
          referred_by: string | null
          service_charge_amount: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          ward_number: number
        }
        Insert: {
          advance_payment_received?: boolean | null
          advance_payment_required?: number | null
          advance_payment_verified_at?: string | null
          advance_payment_verified_by?: string | null
          assigned_cook_id?: string | null
          assigned_delivery_id?: string | null
          cloud_kitchen_slot_id?: string | null
          cook_assigned_at?: string | null
          cook_assignment_status?: string | null
          cook_responded_at?: string | null
          cook_response_deadline?: string | null
          cook_status?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_amount?: number | null
          delivery_earnings?: number | null
          delivery_eta?: string | null
          delivery_instructions?: string | null
          delivery_status?: string | null
          estimated_delivery_minutes?: number | null
          event_date?: string | null
          event_details?: string | null
          event_type_id?: string | null
          guest_count?: number | null
          id?: string
          order_number: string
          order_type?: string | null
          package_id?: string | null
          panchayat_id: string
          referral_code?: string | null
          referred_by?: string | null
          service_charge_amount?: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
          ward_number: number
        }
        Update: {
          advance_payment_received?: boolean | null
          advance_payment_required?: number | null
          advance_payment_verified_at?: string | null
          advance_payment_verified_by?: string | null
          assigned_cook_id?: string | null
          assigned_delivery_id?: string | null
          cloud_kitchen_slot_id?: string | null
          cook_assigned_at?: string | null
          cook_assignment_status?: string | null
          cook_responded_at?: string | null
          cook_response_deadline?: string | null
          cook_status?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_amount?: number | null
          delivery_earnings?: number | null
          delivery_eta?: string | null
          delivery_instructions?: string | null
          delivery_status?: string | null
          estimated_delivery_minutes?: number | null
          event_date?: string | null
          event_details?: string | null
          event_type_id?: string | null
          guest_count?: number | null
          id?: string
          order_number?: string
          order_type?: string | null
          package_id?: string | null
          panchayat_id?: string
          referral_code?: string | null
          referred_by?: string | null
          service_charge_amount?: number | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          ward_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_cloud_kitchen_slot_id_fkey"
            columns: ["cloud_kitchen_slot_id"]
            isOneToOne: false
            referencedRelation: "cloud_kitchen_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          includes_decoration: boolean
          includes_service_staff: boolean
          includes_venue: boolean
          is_active: boolean
          max_guests: number | null
          min_guests: number | null
          name: string
          service_charge_percent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          includes_decoration?: boolean
          includes_service_staff?: boolean
          includes_venue?: boolean
          is_active?: boolean
          max_guests?: number | null
          min_guests?: number | null
          name: string
          service_charge_percent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          includes_decoration?: boolean
          includes_service_staff?: boolean
          includes_venue?: boolean
          is_active?: boolean
          max_guests?: number | null
          min_guests?: number | null
          name?: string
          service_charge_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      panchayats: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          ward_count: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          ward_count?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          ward_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          mobile_number: string
          name: string
          panchayat_id: string | null
          updated_at: string
          user_id: string
          ward_number: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          mobile_number: string
          name: string
          panchayat_id?: string | null
          updated_at?: string
          user_id: string
          ward_number?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          mobile_number?: string
          name?: string
          panchayat_id?: string | null
          updated_at?: string
          user_id?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_amount: number
          commission_percent: number
          created_at: string
          id: string
          order_id: string
          paid_at: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          order_id: string
          paid_at?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          order_id: string | null
          panchayat_id: string | null
          status: string
          updated_at: string
          user_id: string
          ward_number: number | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          panchayat_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          ward_number?: number | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          panchayat_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_panchayat_id_fkey"
            columns: ["panchayat_id"]
            isOneToOne: false
            referencedRelation: "panchayats"
            referencedColumns: ["id"]
          },
        ]
      }
      special_offers: {
        Row: {
          background_color: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
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
      vehicle_rent_rules: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          minimum_rent: number
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          minimum_rent?: number
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          minimum_rent?: number
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          delivery_staff_id: string
          description: string | null
          id: string
          order_id: string | null
          status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          delivery_staff_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          delivery_staff_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_delivery_staff_id_fkey"
            columns: ["delivery_staff_id"]
            isOneToOne: false
            referencedRelation: "delivery_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_delivery_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      generate_referral_code: { Args: { user_uuid: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cook: { Args: { _user_id: string }; Returns: boolean }
      is_cook_assigned_to_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      is_delivery_staff: { Args: { _user_id: string }; Returns: boolean }
      is_order_assigned_cook: {
        Args: { _cook_id: string; _user_id: string }
        Returns: boolean
      }
      is_order_customer: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "cook" | "delivery_staff" | "customer"
      cook_assignment_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "auto_rejected"
      delivery_staff_type: "fixed_salary" | "registered_partner"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      order_type: "food_only" | "full_event"
      service_type: "indoor_events" | "cloud_kitchen" | "homemade"
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
      app_role: ["super_admin", "admin", "cook", "delivery_staff", "customer"],
      cook_assignment_status: [
        "pending",
        "accepted",
        "rejected",
        "auto_rejected",
      ],
      delivery_staff_type: ["fixed_salary", "registered_partner"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      order_type: ["food_only", "full_event"],
      service_type: ["indoor_events", "cloud_kitchen", "homemade"],
    },
  },
} as const
