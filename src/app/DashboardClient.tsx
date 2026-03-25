'use client'

import Link from 'next/link'
import { Users, TrendingUp, DollarSign, CreditCard } from 'lucide-react'
import { DashboardStats } from '@/lib/supabase'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function DashboardCard({ title, value, icon, color }: DashboardCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

interface DashboardClientProps {
  stats: DashboardStats
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/debtors/new"
          className="btn-primary"
        >
          Add Debtor
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Debt"
          value={formatCurrency(stats.total_debt)}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <DashboardCard
          title="Debtors"
          value={stats.debtor_count}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <DashboardCard
          title="Total Debts"
          value={stats.debt_count}
          icon={<CreditCard className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <DashboardCard
          title="Paid vs Unpaid"
          value={`${formatCurrency(stats.total_paid)} / ${formatCurrency(stats.total_remaining)}`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/debtors"
            className="btn-secondary"
          >
            View All Debtors
          </Link>
          <Link
            href="/debtors/new"
            className="btn-primary"
          >
            Add New Debtor
          </Link>
        </div>
      </div>
    </div>
  )
}
