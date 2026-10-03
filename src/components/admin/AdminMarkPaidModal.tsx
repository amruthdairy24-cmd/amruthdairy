'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, CreditCard, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface MonthOption {
  billing_month: string
  net_due?: number
  monthly_amount?: number
  amount_paid?: number
  payment_status?: string
}

interface AdminMarkPaidModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId: string
  customerName: string
  defaultAmount?: number
  billingMonth?: string
  availableMonths?: MonthOption[]
}

export function AdminMarkPaidModal({
  isOpen,
  onClose,
  onSuccess,
  customerId,
  customerName,
  defaultAmount = 1200,
  billingMonth,
  availableMonths: propAvailableMonths
}: AdminMarkPaidModalProps) {
  const [monthsList, setMonthsList] = useState<MonthOption[]>(propAvailableMonths || [])
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (billingMonth) return billingMonth
    if (propAvailableMonths && propAvailableMonths.length > 0) {
      const pending = propAvailableMonths
        .filter(m => m.payment_status === 'pending' || ((m.net_due || 0) > 0 && (m.amount_paid || 0) < (m.net_due || 0)))
        .sort((a, b) => a.billing_month.localeCompare(b.billing_month))[0]
      if (pending) return pending.billing_month
    }
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  })

  const [amount, setAmount] = useState<number>(defaultAmount || 1200)
  const [paymentType, setPaymentType] = useState<'upi' | 'cash' | 'bank_transfer'>('upi')
  const [notes, setNotes] = useState<string>('Payment confirmed by Admin')
  const [loading, setLoading] = useState(false)

  // Sync when propAvailableMonths or billingMonth updates
  useEffect(() => {
    if (propAvailableMonths && propAvailableMonths.length > 0) {
      setMonthsList(propAvailableMonths)
    } else if (customerId && isOpen) {
      // Auto-fetch if not provided
      fetch(`/api/admin/customers/${customerId}/history`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.billing_months)) {
            setMonthsList(data.billing_months)
            if (!billingMonth) {
              const pending = data.billing_months
                .filter((m: any) => m.payment_status === 'pending' || ((m.net_due || 0) > 0 && (m.amount_paid || 0) < (m.net_due || 0)))
                .sort((a: any, b: any) => a.billing_month.localeCompare(b.billing_month))[0]
              if (pending) {
                setSelectedMonth(pending.billing_month)
                const due = pending.payment_status === 'paid' ? 0 : Math.max(0, (pending.net_due || pending.monthly_amount || 0) - (pending.amount_paid || 0))
                if (due > 0) setAmount(due)
              }
            }
          }
        })
        .catch(() => {})
    }
  }, [propAvailableMonths, customerId, isOpen, billingMonth])

  useEffect(() => {
    if (billingMonth) {
      setSelectedMonth(billingMonth)
    }
  }, [billingMonth])

  if (!isOpen) return null

  const monthLabel = new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    const target = monthsList.find(m => m.billing_month === newMonth)
    if (target) {
      const due = target.payment_status === 'paid' ? 0 : Math.max(0, (target.net_due || target.monthly_amount || 0) - (target.amount_paid || 0))
      if (due > 0) setAmount(due)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/billing/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          amount,
          paymentType,
          billingMonth: selectedMonth,
          notes
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Payment recorded for ${monthLabel}!`)
        onSuccess()
        onClose()
      } else {
        toast.error(data.message || 'Failed to record payment')
      }
    } catch (err: unknown) {
      toast.error('Network error while recording payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !loading && onClose()}
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Mark as Paid
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {customerName} • {monthLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {monthsList.length > 0 ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Target Billing Month</span>
                <span className="text-[10px] text-emerald-600 font-semibold lowercase">selected</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {monthsList.map((m) => {
                  const label = new Date(m.billing_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                  const remDue = m.payment_status === 'paid' ? 0 : Math.max(0, (m.net_due || m.monthly_amount || 0) - (m.amount_paid || 0))
                  const statusText = m.payment_status === 'paid' ? '• Paid' : `• Due: ₹${remDue}`
                  return (
                    <option key={m.billing_month} value={m.billing_month}>
                      {label} ({statusText})
                    </option>
                  )
                })}
              </select>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-medium">
              Target Month: <span className="font-bold text-slate-900 dark:text-white">{monthLabel}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Amount Received (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm / Razorpay)</option>
              <option value="cash">Cash Received</option>
              <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reference / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Received via GPay, confirmed by phone"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              This will mark {monthLabel} bill as <strong>PAID</strong>, set net due to <strong>₹0</strong>, activate the subscription, and enable daily milk deliveries.
            </span>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Confirm & Mark Paid
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
