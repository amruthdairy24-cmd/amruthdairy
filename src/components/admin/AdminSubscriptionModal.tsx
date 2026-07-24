'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Check } from 'lucide-react'

interface AdminSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId: string
  customerName: string
  hasActiveSub: boolean
}

export function AdminSubscriptionModal({ isOpen, onClose, onSuccess, customerId, customerName, hasActiveSub }: AdminSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Either 'new' or 'renew'
  const actionType = hasActiveSub ? 'renew' : 'new'
  
  const [quantity, setQuantity] = useState<number>(1.0)
  const [startDate, setStartDate] = useState('')
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [markAsPaid, setMarkAsPaid] = useState(true)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/customer-actions/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          action_type: actionType,
          quantity: hasActiveSub ? undefined : quantity,
          start_date: hasActiveSub ? undefined : startDate,
          target_month: hasActiveSub ? targetMonth : undefined,
          mark_as_paid: markAsPaid
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to manage subscription')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
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
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Settings size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {actionType === 'new' ? 'New Subscription' : 'Renew Subscription'}
                </h2>
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

          <div className="p-5">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                {error}
              </div>
            )}
            
            <form id="admin-sub-form" onSubmit={handleSubmit} className="space-y-4">
              
              {actionType === 'new' && (
                <>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Quantity</label>
                    <select 
                      required
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                    >
                      <option value={0.5}>0.5 Litre / Day</option>
                      <option value={1.0}>1.0 Litre / Day</option>
                      <option value={1.5}>1.5 Litres / Day</option>
                      <option value={2.0}>2.0 Litres / Day</option>
                      <option value={2.5}>2.5 Litres / Day</option>
                      <option value={3.0}>3.0 Litres / Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Start Date</label>
                    <input 
                      required
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                    />
                  </div>
                </>
              )}

              {actionType === 'renew' && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Target Month</label>
                  <input 
                    required
                    type="date" 
                    value={targetMonth}
                    onChange={e => setTargetMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Select the 1st of the month you want to renew for.</p>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={markAsPaid}
                      onChange={e => setMarkAsPaid(e.target.checked)}
                    />
                    <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-colors flex items-center justify-center">
                      {markAsPaid && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Mark as Paid</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">Use this if you received payment in-hand.</div>
                  </div>
                </label>
              </div>

            </form>
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
              type="submit"
              form="admin-sub-form"
              disabled={loading}
              className="flex-[2] px-4 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (actionType === 'new' ? 'Start Subscription' : 'Renew Subscription')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
