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
          phone: string | null
          email: string | null
          avatar_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'debtors_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      debts: {
        Row: {
          id: string
          user_id: string
          debtor_id: string
          title: string
          total_amount: number
          remaining_amount: number
          due_date: string
          status: 'pending' | 'partial' | 'paid' | 'overdue'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          debtor_id: string
          title: string
          total_amount: number
          remaining_amount: number
          due_date: string
          status?: 'pending' | 'partial' | 'paid' | 'overdue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          debtor_id?: string
          title?: string
          total_amount?: number
          remaining_amount?: number
          due_date?: string
          status?: 'pending' | 'partial' | 'paid' | 'overdue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'debts_debtor_id_fkey'
            columns: ['debtor_id']
            referencedRelation: 'debtors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'debts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          debt_id: string
          amount: number
          payment_date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          debt_id: string
          amount: number
          payment_date?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          debt_id?: string
          amount?: number
          payment_date?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_debt_id_fkey'
            columns: ['debt_id']
            referencedRelation: 'debts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
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
