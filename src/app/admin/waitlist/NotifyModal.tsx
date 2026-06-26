'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Calendar, Milk } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotifyModalProps {
  isOpen: boolean
  onClose: () => void
  waitlistEntry: {
    id: string
    quantity_litres: number
    requested_start_date: string
    profiles: {
      full_name: string
      phone?: string
    }
  } | null
  onSuccess: () => void
}

export function NotifyModal({ isOpen, onClose, waitlistEntry, onSuccess }: NotifyModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Start date defaults to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  
  const [availableFrom, setAvailableFrom] = useState(tomorrowStr)
  const [approvedQuantity, setApprovedQuantity] = useState(waitlistEntry?.quantity_litres || 1.0)

  // Update state when waitlistEntry changes
  useState(() => {
    if (waitlistEntry) {
      setApprovedQuantity(waitlistEntry.quantity_litres)
    }
  })

  if (!isOpen || !waitlistEntry) return null

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/waitlist/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitlist_id: waitlistEntry.id,
          allocation_date: availableFrom,
          allocated_quantity: approvedQuantity,
        })
      })

      const data = await res.json()

      if (data.success) {
        // Construct WhatsApp link
        const phone = waitlistEntry.profiles.phone || ''
        const cleanPhone = phone.replace(/\D/g, '')
        const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
        
        // Base URL for the platform
        const baseUrl = window.location.origin
        const onboardingLink = `${baseUrl}/onboarding?min_date=${availableFrom}&quantity=${approvedQuantity}`
        
        const message = `Hello ${waitlistEntry.profiles.full_name},\n\nGreat news! A slot for ${approvedQuantity}L daily milk is now available starting from ${new Date(availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.\n\nPlease click the link below to complete your subscription and start your deliveries:\n${onboardingLink}`
        
        const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
        
        onSuccess()
        onClose()
      } else {
        setError(data.message || 'Failed to update waitlist status')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageCircle size={18} className="text-emerald-500" />
              Notify Customer
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleNotify} className="p-6 space-y-5">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Customer Details</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{waitlistEntry.profiles.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Requested: {waitlistEntry.quantity_litres}L daily</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Slot Available From</label>
                <div className="relative flex items-center">
                  <Calendar size={14} className="absolute left-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={availableFrom}
                    min={tomorrowStr}
                    onChange={e => setAvailableFrom(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Approved Quantity</label>
                <div className="relative flex items-center">
                  <Milk size={14} className="absolute left-4 text-slate-400 pointer-events-none" />
                  <select
                    value={approvedQuantity}
                    onChange={e => setApprovedQuantity(Number(e.target.value))}
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {[0.5, 1.0, 1.5, 2.0].map(q => (
                      <option key={q} value={q}>{q} Litres</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl">
                {error}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle size={16} />
                    <span>Send WhatsApp Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
