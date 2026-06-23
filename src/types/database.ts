export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string
          address: string | null
          area: string | null
          landmark: string | null
          floor_notes: string | null
          role: string | null
          is_active: boolean | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name: string
          phone: string
          address?: string | null
          area?: string | null
          landmark?: string | null
          floor_notes?: string | null
          role?: string | null
          is_active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          address?: string | null
          area?: string | null
          landmark?: string | null
          floor_notes?: string | null
          role?: string | null
          is_active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      milk_capacity: {
        Row: {
          id: string
          date: string
          total_capacity_litres: number
          booked_litres: number | null
          is_accepting_orders: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          date: string
          total_capacity_litres?: number
          booked_litres?: number | null
          is_accepting_orders?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          date?: string
          total_capacity_litres?: number
          booked_litres?: number | null
          is_accepting_orders?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          quantity_litres: number
          price_per_month: number
          price_per_day: number | null
          is_active: boolean | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          quantity_litres: number
          price_per_month: number
          price_per_day?: number | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          quantity_litres?: number
          price_per_month?: number
          price_per_day?: number | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          customer_id: string
          plan_id: string
          start_date: string
          end_date: string | null
          status: string | null
          quantity_litres: number
          next_month_quantity: number | null
          monthly_amount: number
          daily_rate: number | null
          balance: number | null
          razorpay_subscription_id: string | null
          delivery_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          plan_id: string
          start_date: string
          end_date?: string | null
          status?: string | null
          quantity_litres: number
          next_month_quantity?: number | null
          monthly_amount: number
          daily_rate?: number | null
          balance?: number | null
          razorpay_subscription_id?: string | null
          delivery_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          plan_id?: string
          start_date?: string
          end_date?: string | null
          status?: string | null
          quantity_litres?: number
          next_month_quantity?: number | null
          monthly_amount?: number
          daily_rate?: number | null
          balance?: number | null
          razorpay_subscription_id?: string | null
          delivery_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      // NOTE: Other tables have similar structures. For brevity and initial testing, defining the key ones.
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type MilkCapacity = Database['public']['Tables']['milk_capacity']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
