'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, Milk, AlertTriangle, CheckCircle, Info, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

const QUANTITY_OPTIONS = [
  { litres: 0.5, label: '½ L', description: 'Perfect for 1-2 people' },
  { litres: 1.0, label: '1 L', description: 'Most popular choice' },
  { litres: 1.5, label: '1.5 L', description: 'Great for families' },
  { litres: 2.0, label: '2 L', description: 'Large household plan' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24
    }
  },
} as const

export default function QuantityChangePage() {
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const [currentQty, setCurrentQty] = useState(1.0)
  const [currentDailyRate, setCurrentDailyRate] = useState(0)
  const [currentMonthly, setCurrentMonthly] = useState(0)
  const [selectedQty, setSelectedQty] = useState<number | null>(null)
  const [pendingChange, setPendingChange] = useState<{ quantity: number; amount: number } | null>(null)

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success && json.subscription) {
        setCurrentQty(json.subscription.quantity_litres)
        setCurrentDailyRate(json.subscription.daily_rate)
        setCurrentMonthly(json.subscription.monthly_amount)
        if (json.next_month_change) setPendingChange(json.next_month_change)
      } else {
        setError(json.message || 'Failed to load subscription details')
      }
    } catch (err) {
      setError('Network error loading data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedQty || selectedQty === currentQty) return setError('Please select a different quantity than your current plan.')

    setError(''); setSuccessMsg(''); setLoading(true)

    try {
      const res = await fetch('/api/quantity/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_quantity: selectedQty })
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message || 'Quantity change confirmed!')
        setSelectedQty(null)
        await loadData()
      } else {
        setError(json.message || 'Failed to submit change request')
      }
    } catch (err) {
      setError('Network error submitting request')
    } finally {
      setLoading(false)
    }
  }

  const effectiveDate = new Date()
  effectiveDate.setMonth(effectiveDate.getMonth() + 1)
  effectiveDate.setDate(1)
  const effectiveMonthStr = effectiveDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  if (pageLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[420px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="lg:col-span-2 h-[350px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full space-y-8 relative"
    >
      {/* Header section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <ArrowLeftRight size={22} className="stroke-[2.2]" />
            </div>
            <span>Change Plan Quantity</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 pl-1 flex items-center gap-1.5">
            <Milk size={14} className="text-slate-400 dark:text-slate-500" />
            <span>Upgrade or downgrade your daily milk delivery amount</span>
          </p>
        </div>
        
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer self-start sm:self-center"
        >
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Form & Current Plan details */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
          
          {/* Current Plan Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <p className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-[2px] font-extrabold mb-1">Active Subscription Plan</p>
                <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white leading-tight">
                  {currentQty === 0.5 ? '½' : currentQty} Litre / Day
                </h3>
                <p className="text-[13.5px] text-[#014DA4] dark:text-blue-400 font-bold mt-1.5">
                  ₹{currentDailyRate.toFixed(2)}/day · ₹{currentMonthly.toFixed(2)}/month
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-blue-950/20 text-[#014DA4] dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-3xs border border-sky-500/5">
                <Milk size={28} className="stroke-[2]" />
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">Select Quantity</h2>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-green-500/10 dark:bg-emerald-500/10 border border-green-200/15 dark:border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Flexible Tiers
              </span>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUANTITY_OPTIONS.map((opt) => {
                const isCurrent = opt.litres === currentQty
                const isSelected = opt.litres === selectedQty
                
                return (
                  <button
                    key={opt.litres}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => { setSelectedQty(opt.litres); setError(''); setSuccessMsg('') }}
                    className={cn(
                      'h-[96px] rounded-2xl border flex flex-col items-center justify-center p-4 gap-1.5 transition-all relative select-none',
                      isSelected
                        ? 'border-[#014DA4] dark:border-blue-500 bg-[#014DA4]/5 dark:bg-blue-950/35 ring-1 ring-[#014DA4] dark:ring-blue-500 text-[#014DA4] dark:text-blue-400'
                        : isCurrent
                        ? 'border-green-500/30 dark:border-emerald-500/30 bg-green-500/5 dark:bg-emerald-500/5 text-green-700 dark:text-emerald-400 cursor-not-allowed opacity-80'
                        : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 dark:text-slate-500 cursor-pointer shadow-3xs'
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute top-2.5 right-3 text-[8.5px] font-black text-green-700 dark:text-emerald-400 bg-white dark:bg-slate-950 border border-green-200/30 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                        CURRENT PLAN
                      </span>
                    )}
                    {opt.litres === 1.0 && !isCurrent && (
                      <span className="absolute top-2.5 right-3 text-[8.5px] font-black text-[#014DA4] dark:text-blue-400 bg-sky-500/10 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                        POPULAR
                      </span>
                    )}
                    
                    <span className={cn(
                      "text-[22px] font-black leading-none mt-1",
                      isSelected ? "text-[#014DA4] dark:text-blue-400" : (isCurrent ? "text-green-700" : "text-slate-800 dark:text-slate-200")
                    )}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-bold text-inherit opacity-75">{opt.description}</span>
                  </button>
                )
              })}
            </div>

            {/* Selection preview */}
            {selectedQty && selectedQty !== currentQty && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 text-[13.5px] font-bold text-slate-655 dark:text-slate-400 dark:text-slate-500 shadow-3xs"
              >
                <div className="flex items-center justify-center gap-6 pb-3 border-b border-slate-200/50 dark:border-slate-800 select-none">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mb-1 uppercase tracking-wider">Current Quantity</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-200">{currentQty === 0.5 ? '½' : currentQty}L</p>
                  </div>
                  <ArrowRight size={20} className="text-[#014DA4] dark:text-blue-400 stroke-[2.5]" />
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mb-1 uppercase tracking-wider">New Quantity</p>
                    <p className="text-xl font-black text-[#014DA4] dark:text-blue-400">{selectedQty === 0.5 ? '½' : selectedQty}L</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-455">Effective Date:</span>
                  <span className="font-extrabold text-[#014DA4] dark:text-blue-400">1st {effectiveMonthStr}</span>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2 pl-1">
                <AlertTriangle size={14} className="text-rose-500 dark:text-rose-400" /> 
                <span>{error}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-650 dark:text-emerald-450 font-bold flex items-center gap-2 pl-1">
                <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-450" /> 
                <span>{successMsg}</span>
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedQty || selectedQty === currentQty}
              className="w-full h-12 rounded-xl bg-[#014DA4] dark:bg-blue-600 hover:bg-[#014DA4]/95 dark:hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowLeftRight size={14} className="stroke-[2.5]" />
                  <span>Confirm Quantity Change</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Right Column: Information & Policies */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          
          {/* Pending changes card if present */}
          {pendingChange && (
            <div className="bg-white dark:bg-slate-900 border border-blue-200/50 dark:border-blue-900/30 rounded-3xl p-5 shadow-sm flex items-start gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
              <Info className="text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-left relative z-10">
                <h4 className="text-[11px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-wider">Pending Change Confirmed</h4>
                <p className="text-[12px] font-semibold text-slate-655 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Your plan is scheduled to change to <strong className="text-slate-800 dark:text-slate-100">{pendingChange.quantity}L/day</strong> starting <strong className="text-[#014DA4] dark:text-blue-450">{effectiveMonthStr}</strong>.
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold mt-1">
                  New Monthly Estimate: <strong className="text-slate-800 dark:text-slate-100">₹{pendingChange.amount?.toFixed(2) || '—'}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Policy Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <h3 className="text-[11px] font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-[2.5px] pl-0.5 select-none">Change Policy</h3>
            
            <div className="space-y-4 text-left leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">1</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Next Month Renewal Policy</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">All subscription changes are scheduled for the 1st day of the next billing month: <strong>1st {effectiveMonthStr}</strong>. The current month is unaffected.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">2</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Strict Billing Cut-off</p>
                  <p className="text-slate-455 dark:text-slate-400 dark:text-slate-500 mt-1">Billing and deliveries for the active month are locked to protect current statement calculations.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">3</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Capacity Allocations</p>
                  <p className="text-slate-455 dark:text-slate-400 dark:text-slate-500 mt-1">If the dairy farm reaches maximum capacity, subscription increases may temporarily be placed on a waiting list.</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/5 border border-amber-200/30 dark:border-amber-500/20 rounded-xl flex gap-2.5 mt-2">
              <AlertTriangle className="text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-left">
                <h4 className="text-[10px] font-black text-amber-855 dark:text-amber-500 uppercase tracking-wide">Important Reminder</h4>
                <p className="text-[10.5px] text-amber-900/85 dark:text-amber-250 font-semibold leading-normal mt-0.5">
                  Confirming a new quantity registers the change on our servers for next month. You can only request one change per billing cycle.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
