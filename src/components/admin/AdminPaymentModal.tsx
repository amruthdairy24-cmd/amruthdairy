'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AdminPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId: string
  customerName: string
  defaultAmount?: number
  targetMonth?: string
}

export function AdminPaymentModal({ isOpen, onClose, onSuccess, customerId, customerName, defaultAmount, targetMonth }: AdminPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : '')
  const [paymentType, setPaymentType] = useState<string>('cash')

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount ? String(defaultAmount) : '')
      setPaymentType('cash')
      setError(null)
    }
  }, [isOpen, defaultAmount])

  if (!isOpen) return null

  const handleSubmit = async () => {
    const numAmount = Number(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/billing/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId, 
          amount: numAmount, 
          paymentType,
          billingMonth: targetMonth
        })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success(`Successfully recorded ₹${numAmount} payment!`)
        onSuccess()
        onClose()
      } else {
        setError(data.message || 'Failed to record payment')
        toast.error(data.message || 'Payment failed')
      }
    } catch {
      setError('Network error recording payment')
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Record Payment</h2>
                <p className="text-[11px] font-bold text-slate-500">{customerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-400 mb-2">
                Amount (₹)
              </label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-black text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-400 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'bank_transfer'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={cn(
                      "py-2.5 rounded-xl border text-[11px] font-bold transition-all capitalize",
                      paymentType === type 
                        ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30 flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{error}</span>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !amount}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirm Payment
                  </>
                )
              }
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
