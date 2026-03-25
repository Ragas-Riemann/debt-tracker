'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DashboardStats } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

function DashboardCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle 
}: { 
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusCard({ 
  label, 
  count, 
  color 
}: { 
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{count}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    total_debt: 0,
    total_paid: 0,
    total_remaining: 0,
    debtor_count: 0,
    debt_count: 0,
    paid_count: 0,
    unpaid_count: 0,
    partial_count: 0,
    overdue_count: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [recentDebtors, setRecentDebtors] = useState<any[]>([])

  useEffect(() => {
    console.log('[Dashboard] Auth state:', { user: user?.email, authLoading })
    if (user && !authLoading) {
      fetchDashboardData()
    } else if (!authLoading && !user) {
      console.log('[Dashboard] No user, stopping data loading')
      setDataLoading(false)
    }
  }, [user, authLoading])

  async function fetchDashboardData() {
    try {
      console.log('[Dashboard] Fetching data...')
      setDataLoading(true)

      // Fetch all payments for total paid calculation
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')

      if (paymentsError) {
        console.error('[Dashboard] Payments error:', paymentsError)
        throw paymentsError
      }

      // Fetch all debts
      const { data: debts, error: debtsError } = await supabase
        .from('debts')
        .select('*, debtor:debtors(*)')

      if (debtsError) {
        console.error('[Dashboard] Debts error:', debtsError)
        throw debtsError
      }

      // Fetch debtor count
      const { count: debtorCount, error: debtorError } = await supabase
        .from('debtors')
        .select('*', { count: 'exact', head: true })

      if (debtorError) {
        console.error('[Dashboard] Debtor count error:', debtorError)
        throw debtorError
      }

      // Calculate statistics using new schema (total_amount and remaining_amount)
      const totalDebt = debts?.reduce((sum, debt) => sum + (debt.total_amount || 0), 0) || 0
      const totalRemaining = debts?.reduce((sum, debt) => sum + (debt.remaining_amount || 0), 0) || 0
      const totalPaid = totalDebt - totalRemaining

      const paidCount = debts?.filter(d => d.status === 'paid').length || 0
      const pendingCount = debts?.filter(d => d.status === 'pending').length || 0
      const partialCount = debts?.filter(d => d.status === 'partial').length || 0
      const overdueCount = debts?.filter(d => d.status === 'overdue').length || 0

      setStats({
        total_debt: totalDebt,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        debtor_count: debtorCount || 0,
        debt_count: debts?.length || 0,
        paid_count: paidCount,
        unpaid_count: pendingCount,
        partial_count: partialCount,
        overdue_count: overdueCount,
      })

      // Fetch recent debtors
      const { data: recent, error: recentError } = await supabase
        .from('debtors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) {
        console.error('[Dashboard] Recent debtors error:', recentError)
        throw recentError
      }

      // Calculate totals for each debtor
      const debtorsWithTotals = await Promise.all(
        (recent || []).map(async (debtor) => {
          const { data: debtorDebts } = await supabase
            .from('debts')
            .select('id, total_amount, remaining_amount, status')
            .eq('debtor_id', debtor.id)

          const totalOwed = debtorDebts?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0
          const totalRemainingForDebtor = debtorDebts?.reduce((sum, d) => sum + (d.remaining_amount || 0), 0) || 0

          return {
            ...debtor,
            total_owed: totalOwed,
            total_remaining: totalRemainingForDebtor,
          }
        })
      )

      setRecentDebtors(debtorsWithTotals)
      console.log('[Dashboard] Data fetched successfully:', { debtorCount, debtCount: debts?.length })
    } catch (error) {
      console.error('[Dashboard] Error fetching dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const loading = authLoading || dataLoading

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name || 'User'}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome, {profile?.name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-gray-600 mt-1">Overview of your debt tracking</p>
          </div>
        </div>
        <Link
          href="/debtors/new"
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
        >
          Add Debtor
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <DashboardCard
          title="Total Debt"
          value={formatCurrency(stats.total_debt)}
          subtitle={`${stats.debt_count} debts total`}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="bg-blue-500"
        />
        <DashboardCard
          title="Total Paid"
          value={formatCurrency(stats.total_paid)}
          subtitle="All time payments"
          icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="bg-green-500"
        />
        <DashboardCard
          title="Remaining"
          value={formatCurrency(stats.total_remaining)}
          subtitle="Outstanding balance"
          icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="bg-red-500"
        />
        <DashboardCard
          title="Debtors"
          value={stats.debtor_count}
          subtitle="Active debtors"
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Debt Status Breakdown</h2>
          <div className="space-y-3">
            <StatusCard 
              label="Paid" 
              count={stats.paid_count} 
              color="text-green-600" 
            />
            <StatusCard 
              label="Partial Payment" 
              count={stats.partial_count} 
              color="text-yellow-600" 
            />
            <StatusCard 
              label="Pending" 
              count={stats.unpaid_count} 
              color="text-gray-600" 
            />
            <StatusCard 
              label="Overdue" 
              count={stats.overdue_count} 
              color="text-red-600" 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/debtors"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-700">View All Debtors</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/debtors/new"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium text-blue-700">Add New Debtor</span>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Debtors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Debtors</h2>
        </div>
        {recentDebtors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No debtors yet</p>
            <Link href="/debtors/new" className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
              Add your first debtor
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentDebtors.map((debtor) => (
              <Link
                key={debtor.id}
                href={`/debtors/${debtor.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {debtor.avatar_url ? (
                      <img
                        src={debtor.avatar_url}
                        alt={debtor.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{debtor.name}</p>
                    <p className="text-sm text-gray-500">
                      {debtor.email || debtor.phone || 'No contact info'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(debtor.total_remaining)}
                  </p>
                  <p className="text-xs text-gray-500">remaining</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/debtors"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center"
          >
            View all debtors
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
