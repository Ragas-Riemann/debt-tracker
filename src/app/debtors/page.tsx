'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Eye, Edit, Trash2, User, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { getErrorMessage, showErrorWarning } from '@/lib/error-utils'

interface DebtorWithTotal {
  id: string
  name: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  total_debt: number
  total_paid: number
  total_remaining: number
}

import { useRouter } from 'next/navigation'

export default function DebtorsList() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [debtors, setDebtors] = useState<DebtorWithTotal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchDebtors()
    }
  }, [user, authLoading, router])

  async function fetchDebtors() {
    try {
      setLoading(true)

      if (!user) return
      
      const { data: debtorsData, error: debtorsError } = await supabase
        .from('debtors')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (debtorsError) throw debtorsError

      // Calculate totals for each debtor using new schema fields
      const debtorsWithTotals = await Promise.all(
        (debtorsData || []).map(async (debtor) => {
          // Get all debts for this debtor
          const { data: debts } = await supabase
            .from('debts')
            .select('id, total_amount, remaining_amount')
            .eq('debtor_id', debtor.id)
            .eq('user_id', user.id)

          const totalDebt = debts?.reduce((sum, debt) => sum + (debt.total_amount || 0), 0) || 0
          const totalRemaining = debts?.reduce((sum, debt) => sum + (debt.remaining_amount || 0), 0) || 0
          const totalPaid = totalDebt - totalRemaining

          return {
            ...debtor,
            total_debt: totalDebt,
            total_paid: totalPaid,
            total_remaining: totalRemaining,
          }
        })
      )

      setDebtors(debtorsWithTotals)
      setError('')
    } catch (error) {
      console.error('Error fetching debtors:', error)
      const message = getErrorMessage(error, 'Unable to load debtors right now.')
      setError(message)
      showErrorWarning(message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteDebtor(id: string) {
    if (!confirm('Are you sure you want to delete this debtor and all their debts?')) {
      return
    }
    if (!user) return

    setDeleting(id)
    setError('')
    try {
      const { error } = await supabase
        .from('debtors')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setDebtors(debtors.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting debtor:', error)
      const message = getErrorMessage(error, 'Failed to delete debtor.')
      setError(message)
      showErrorWarning(message)
    } finally {
      setDeleting(null)
    }
  }

  const filteredDebtors = debtors.filter(debtor =>
    debtor.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Debtors</h1>
          <p className="text-gray-600 mt-1">Manage people who owe you money</p>
        </div>
        <Link 
          href="/debtors/new" 
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Debtor
        </Link>
      </div>

      {/* Search */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Debtors Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      ) : filteredDebtors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No debtors found' : 'No debtors yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first debtor'}
          </p>
          {!searchTerm && (
            <Link 
              href="/debtors/new" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Debtor
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDebtors.map((debtor) => (
            <div key={debtor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                {/* Avatar and Name */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {debtor.avatar_url ? (
                      <img
                        src={debtor.avatar_url}
                        alt={debtor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {debtor.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {debtor.phone && <span className="block truncate">{debtor.phone}</span>}
                      {debtor.email && <span className="block truncate text-xs">{debtor.email}</span>}
                    </p>
                  </div>
                </div>

                {/* Debt Summary */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Debt:</span>
                    <span className="font-medium">{formatCurrency(debtor.total_debt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(debtor.total_paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">Remaining:</span>
                    <span className={`font-bold ${debtor.total_remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(debtor.total_remaining)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/debtors/${debtor.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/debtors/${debtor.id}/edit`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteDebtor(debtor.id)}
                    disabled={deleting === debtor.id}
                    className="bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {deleting === debtor.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
