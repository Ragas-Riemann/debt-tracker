import { User } from '@supabase/supabase-js'

export type Profile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Debtor = {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export type DebtStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export type Debt = {
  id: string
  debtor_id: string
  title: string
  total_amount: number
  remaining_amount: number
  due_date: string
  status: DebtStatus
  created_at: string
  updated_at: string
}

export type Payment = {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  note: string | null
  created_at: string
}

export type DebtWithPayments = Debt & {
  payments: Payment[]
  total_paid: number
}

export type DebtorWithDebts = Debtor & {
  debts: DebtWithPayments[]
  total_debt: number
  total_paid: number
  total_remaining: number
}

export type DashboardStats = {
  total_debt: number          // Sum of all original amounts
  total_paid: number          // Sum of all payments
  total_remaining: number     // total_debt - total_paid
  debtor_count: number
  debt_count: number
  paid_count: number
  unpaid_count: number
  partial_count: number
  overdue_count: number
}
