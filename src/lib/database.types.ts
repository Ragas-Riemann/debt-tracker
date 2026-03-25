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
      debtors: {
        Row: {
          id: string
          user_id: string
          name: string
          avatar_url: string | null
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debtors_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      debts: {
        Row: {
          id: string
          user_id: string
          debtor_id: string
          title: string
          amount: number
          due_date: string
          status: 'unpaid' | 'partial' | 'paid' | 'near_due' | 'overdue'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          debtor_id: string
          title: string
          amount: number
          due_date: string
          status?: 'unpaid' | 'partial' | 'paid' | 'near_due' | 'overdue'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          debtor_id?: string
          title?: string
          amount?: number
          due_date?: string
          status?: 'unpaid' | 'partial' | 'paid' | 'near_due' | 'overdue'
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_debtor_id_fkey"
            columns: ["debtor_id"]
            referencedRelation: "debtors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          debt_id: string
          amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          debt_id: string
          amount: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          debt_id?: string
          amount?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_debt_id_fkey"
            columns: ["debt_id"]
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
