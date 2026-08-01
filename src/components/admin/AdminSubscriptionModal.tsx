'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDeliveryAreas } from '@/hooks/useDeliveryAreas'

interface AdminSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId: string
  customerName: string
}

export function AdminSubscriptionModal({ isOpen, onClose, onSuccess, customerId, customerName }: AdminSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Allow admin to toggle between New or Renew.
  const [actionType, setActionType] = useState<'new' | 'renew'>('new')
  
  const [quantity, setQuantity] = useState<number>(1.0)
  const [startDate, setStartDate] = useState('')
  const { areas: DELIVERY_AREAS, loading: areasLoading } = useDeliveryAreas()
  const [area, setArea] = useState<string>('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [floorNotes, setFloorNotes] = useState('')
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
          quantity: actionType === 'renew' ? undefined : quantity,
          start_date: actionType === 'renew' ? undefined : startDate,
          area: actionType === 'renew' ? undefined : area,
          address: actionType === 'renew' ? undefined : address,
          landmark: actionType === 'renew' ? undefined : landmark,
          floor_notes: actionType === 'renew' ? undefined : floorNotes,
          target_month: actionType === 'renew' ? targetMonth : undefined,
          mark_as_paid: markAsPaid
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to manage subscription')
      }

      toast.success(actionType === 'renew' ? 'Subscription renewed successfully' : 'Subscription updated successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || 'Failed to manage subscription')
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
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
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
              
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setActionType('new')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${actionType === 'new' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  New Subscription
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('renew')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${actionType === 'renew' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Renew Existing
                </button>
              </div>

              {actionType === 'new' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Quantity</label>
                      <div className="relative">
                        <select 
                          required
                          value={quantity}
                          onChange={e => setQuantity(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all appearance-none pr-10"
                        >
                          <option value={0.5}>0.5 Litre / Day</option>
                          <option value={1.0}>1.0 Litre / Day</option>
                          <option value={1.5}>1.5 Litres / Day</option>
                          <option value={2.0}>2.0 Litres / Day</option>
                          <option value={2.5}>2.5 Litres / Day</option>
                          <option value={3.0}>3.0 Litres / Day</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Delivery Area / Pin</label>
                      <div className="relative">
                        <select
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full h-11 pl-4 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-slate-800 dark:text-slate-100"
                          required={actionType === 'new'}
                        >
                          <option value="">Select area</option>
                          {areasLoading ? (
                            <option value="" disabled>Loading areas...</option>
                          ) : (
                            DELIVERY_AREAS.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))
                          )}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Landmark (Optional)</label>
                      <input 
                        type="text" 
                        value={landmark}
                        onChange={e => setLandmark(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                        placeholder="E.g. Opposite Central Park"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Delivery Street Address</label>
                    <textarea 
                      required
                      rows={2}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all resize-none"
                      placeholder="House No 12-B, Rose Villa, 2nd Cross road..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Floor / Delivery Instructions (Optional)</label>
                    <input 
                      type="text" 
                      value={floorNotes}
                      onChange={e => setFloorNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                      placeholder="E.g. 2nd Floor, leave bag on door handle"
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
