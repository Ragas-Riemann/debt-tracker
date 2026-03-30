'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  X,
  Bell,
  Phone,
  Mail,
  User,
  Calendar,
  Edit,
  AlertCircle,
  DollarSign,
  History,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Debtor, Debt, Payment } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

interface DebtWithPayments extends Debt {
  payments: Payment[]
  total_paid: number
  remaining: number
}

export default function DebtorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [debtor, setDebtor] = useState<Debtor | null>(null)
  const [debts, setDebts] = useState<DebtWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDebt, setShowAddDebt] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null)
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null)
  const [debtForm, setDebtForm] = useState({
    title: '',
    amount: '',
    due_date: '',
    notes: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    notes: '',
  })
  const [addingDebt, setAddingDebt] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && params.id) {
      fetchDebtorData()
    }
  }, [user, authLoading, params.id, router])

  async function fetchDebtorData() {
    try {
      setLoading(true)
      
      // Fetch debtor
      const { data: debtorData, error: debtorError } = await supabase
        .from('debtors')
        .select('*')
        .eq('id', params.id)
        .single()

      if (debtorError) throw debtorError

      // Fetch debts with payments
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('debtor_id', params.id)
        .order('due_date', { ascending: true })

      if (debtsError) throw debtsError

      // Fetch payments for each debt
      const debtsWithPayments = await Promise.all(
        (debtsData || []).map(async (debt) => {
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('debt_id', debt.id)
            .order('payment_date', { ascending: false })

          const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

          return {
            ...debt,
            payments: payments || [],
            total_paid: totalPaid,
            remaining: debt.total_amount - totalPaid,
          }
        })
      )

      setDebtor(debtorData)
      setDebts(debtsWithPayments)
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/debtors')
    } finally {
      setLoading(false)
    }
  }

  async function addDebt(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    
    setAddingDebt(true)

    try {
      const { error } = await supabase
        .from('debts')
        .insert([
          {
            debtor_id: params.id,
            title: debtForm.title,
            total_amount: parseFloat(debtForm.amount),
            remaining_amount: parseFloat(debtForm.amount),
            due_date: debtForm.due_date,
            status: 'pending',
          },
        ])

      if (error) throw error

      setDebtForm({ title: '', amount: '', due_date: '', notes: '' })
      setShowAddDebt(false)
      fetchDebtorData()
    } catch (error) {
      console.error('Error adding debt:', error)
      alert('Failed to add debt')
    } finally {
      setAddingDebt(false)
    }
  }

  async function addPayment(e: React.FormEvent, debtId: string) {
    e.preventDefault()
    if (!user) return
    
    setAddingPayment(true)

    try {
      const paymentAmount = parseFloat(paymentForm.amount)
      
      // First, get current debt to calculate new remaining
      const { data: currentDebt } = await supabase
        .from('debts')
        .select('remaining_amount')
        .eq('id', debtId)
        .single()
      
      if (!currentDebt) throw new Error('Debt not found')
      
      const newRemaining = currentDebt.remaining_amount - paymentAmount
      
      // Insert payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            debt_id: debtId,
            amount: paymentAmount,
            note: paymentForm.notes || null,
            payment_date: new Date().toISOString(),
          },
        ])

      if (paymentError) throw paymentError

      // Update debt remaining_amount and status
      let newStatus: string
      if (newRemaining <= 0) {
        newStatus = 'paid'
      } else if (newRemaining < currentDebt.remaining_amount) {
        newStatus = 'partial'
      } else {
        newStatus = 'pending'
      }
      
      const { error: updateError } = await supabase
        .from('debts')
        .update({ remaining_amount: newRemaining, status: newStatus })
        .eq('id', debtId)
        
      if (updateError) throw updateError

      setPaymentForm({ amount: '', notes: '' })
      setShowAddPayment(null)
      fetchDebtorData()
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('Failed to add payment')
    } finally {
      setAddingPayment(false)
    }
  }

  async function deletePayment(paymentId: string) {
    if (!confirm('Are you sure you want to delete this payment?')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

      fetchDebtorData()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment')
    }
  }

  async function deleteDebt(debtId: string) {
    if (!confirm('Are you sure you want to delete this debt? All payments will also be deleted.')) return

    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId)

      if (error) throw error

      setDebts(debts.filter(d => d.id !== debtId))
    } catch (error) {
      console.error('Error deleting debt:', error)
      alert('Failed to delete debt')
    }
  }

  function getReminderLink(debt: DebtWithPayments) {
    if (!debtor) return null
    
    const message = `Hi ${debtor.name}, this is a reminder about your '${debt.title}' worth ₱${debt.remaining}, due on ${new Date(debt.due_date).toLocaleDateString()}. Please settle soon. Thank you!`

    if (debtor?.phone) {
      return `sms:${debtor.phone}?body=${encodeURIComponent(message)}`
    }

    if (debtor?.email) {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(debtor.email)}&su=${encodeURIComponent(`Reminder: ${debt.title} payment`)}&body=${encodeURIComponent(message)}`
    }

    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.total_amount, 0)
  const totalPaid = debts.reduce((sum, d) => sum + d.total_paid, 0)
  const totalRemaining = debts.reduce((sum, d) => sum + d.remaining_amount, 0)
  const paidDebts = debts.filter(d => d.status === 'paid').length
  const unpaidDebts = debts.filter(d => d.status !== 'paid').length

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!debtor) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/debtors" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Debtors
        </Link>
      </div>

      {/* Debtor Info Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {debtor.avatar_url ? (
                <img src={debtor.avatar_url} alt={debtor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{debtor.name}</h1>
              <div className="mt-2 space-y-1">
                {debtor.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {debtor.phone}
                  </div>
                )}
                {debtor.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {debtor.email}
                  </div>
                )}
              </div>
              {debtor.notes && (
                <p className="mt-3 text-gray-600">{debtor.notes}</p>
              )}
            </div>
            <Link
              href={`/debtors/${debtor.id}/edit`}
              className="btn-secondary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-600">Total Debt</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600">Remaining</p>
          <p className={`text-2xl font-bold ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Debts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Debts & Payments</h2>
          <button
            onClick={() => setShowAddDebt(!showAddDebt)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Debt
          </button>
        </div>

        {showAddDebt && (
          <form onSubmit={addDebt} className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={debtForm.title}
                  onChange={(e) => setDebtForm({ ...debtForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Lunch, Loan, Rent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={debtForm.amount}
                  onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={debtForm.due_date}
                  onChange={(e) => setDebtForm({ ...debtForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Add notes..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddDebt(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingDebt}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {addingDebt ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Add Debt
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {debts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No debts found</p>
              <p className="text-sm text-gray-500 mt-1">Add a debt to get started</p>
            </div>
          ) : (
            debts.map((debt) => {
              const reminderLink = getReminderLink(debt)
              const isExpanded = expandedDebt === debt.id
              const isAddingPayment = showAddPayment === debt.id

              return (
                <div key={debt.id} className="p-4 sm:p-6">
                  {/* Debt Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">{debt.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                          {debt.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Amount Summary */}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 block">Original</span>
                          <span className="font-medium">{formatCurrency(debt.total_amount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(debt.total_paid)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Remaining</span>
                          <span className={`font-bold ${debt.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(debt.remaining_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due: {new Date(debt.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {debt.remaining_amount > 0 && (
                        <button
                          onClick={() => setShowAddPayment(isAddingPayment ? null : debt.id)}
                          className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Add Payment
                        </button>
                      )}
                      
                      {reminderLink && debt.remaining_amount > 0 && (
                        <a
                          href={reminderLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center"
                        >
                          <Bell className="w-4 h-4 mr-1" />
                          Remind
                        </a>
                      )}
                      
                      {debt.payments.length > 0 && (
                        <button
                          onClick={() => setExpandedDebt(isExpanded ? null : debt.id)}
                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
                        >
                          <History className="w-4 h-4 mr-1" />
                          History
                          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteDebt(debt.id)}
                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add Payment Form */}
                  {isAddingPayment && (
                    <form onSubmit={(e) => addPayment(e, debt.id)} className="mt-4 p-4 bg-green-50 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₱) *</label>
                          <input
                            type="number"
                            required
                            min="0.01"
                            max={debt.remaining_amount}
                            step="0.01"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            placeholder={`Max: ${formatCurrency(debt.remaining_amount)}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <input
                            type="text"
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            placeholder="Payment notes..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddPayment(null)}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addingPayment}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {addingPayment ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Record Payment
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Payment History */}
                  {isExpanded && debt.payments.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                        <History className="w-4 h-4 mr-2" />
                        Payment History
                      </h4>
                      <div className="space-y-2">
                        {debt.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                            <div>
                              <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                              {payment.note && (
                                <p className="text-sm text-gray-500">{payment.note}</p>
                              )}
                              <p className="text-xs text-gray-400">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => deletePayment(payment.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
