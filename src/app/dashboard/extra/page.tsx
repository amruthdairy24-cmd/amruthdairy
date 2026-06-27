'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Calendar, ShieldAlert, CheckCircle, Info, ChevronRight, Milk } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

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

export default function ExtraMilkPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [dailyRate, setDailyRate] = useState(82.6667)
  const [baseQty, setBaseQty] = useState(1.0)
  
  const [orderDate, setOrderDate] = useState('')
  const [extraLitres, setExtraLitres] = useState<number>(0.5)
  const [estimatedCharge, setEstimatedCharge] = useState(0)

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success && json.subscription) {
        setDailyRate(json.subscription.daily_rate)
        setBaseQty(json.subscription.quantity_litres || 1.0)
      } else {
        setError(json.message || 'Failed to retrieve subscription details')
      }
    } catch (err) {
      setError('Network error loading page data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setOrderDate(tomorrow.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (baseQty <= 0) return
    const charge = Math.round((dailyRate * (extraLitres / baseQty)) * 100) / 100
    setEstimatedCharge(charge)
  }, [extraLitres, dailyRate, baseQty])

  async function handleExtraSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderDate || extraLitres === undefined) return setError('Please choose a date and quantity.')

    const selected = new Date(orderDate)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0,0,0,0)

    if (selected < tomorrow) return setError('Order date must be tomorrow or later.')

    setError(''); setSuccessMsg(''); setLoading(true)

    try {
      const res = await fetch('/api/extra-milk/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_date: orderDate, extra_litres: extraLitres })
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message || `Confirmed extra ${extraLitres}L for ${orderDate}!`)
      } else {
        setError(json.message || 'Failed to request extra milk')
      }
    } catch (err) {
      setError('Network error submitting request')
    } finally {
      setLoading(false)
    }
  }

  const isCutoffPassed = new Date().getHours() >= 21

  if (pageLoading) {
    return (
      <div className="max-w-5xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[380px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
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
      className="max-w-5xl space-y-8 relative"
    >
      {/* Header section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <PlusCircle size={22} className="stroke-[2.2]" />
            </div>
            <span>Order Extra Milk</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 pl-1 flex items-center gap-1.5">
            <Milk size={14} className="text-slate-400 dark:text-slate-500" />
            <span>Need more milk tomorrow? Add a one-time extra order to your delivery</span>
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
        
        {/* Left Column: Form Card */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-5">
          <form onSubmit={handleExtraSubmit} className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white tracking-tight">One-Time Order</h2>
              <span className="text-[11px] font-extrabold text-[#014DA4] dark:text-blue-400 bg-sky-500/10 dark:bg-blue-950/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Base Quantity: {baseQty} L
              </span>
            </div>

            {/* Delivery Date Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-extrabold text-slate-450 uppercase tracking-[2px] pl-0.5">Select Delivery Date</label>
              <div className="flex items-center h-12 rounded-xl border border-border dark:border-slate-850 bg-white dark:bg-slate-950 px-3.5 gap-2.5 focus-within:ring-2 focus-within:ring-[#014DA4]/20 focus-within:border-[#014DA4] transition-all">
                <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                <input
                  type="date"
                  required
                  value={orderDate}
                  min={(() => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    return tomorrow.toISOString().split('T')[0]
                  })()}
                  onChange={(e) => { setOrderDate(e.target.value); setError(''); setSuccessMsg('') }}
                  className="flex-1 h-full bg-transparent text-[13.5px] font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Extra Litre Options */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-extrabold text-slate-455 uppercase tracking-[2px] pl-0.5">Choose Extra Litres</label>
              <div className="grid grid-cols-3 gap-3.5">
                {[0.5, 1.0, 1.5].map((litres) => {
                  const isSelected = extraLitres === litres
                  return (
                    <button
                      key={litres}
                      type="button"
                      onClick={() => { setExtraLitres(litres); setError(''); setSuccessMsg('') }}
                      className={cn(
                        'h-24 rounded-2xl border flex flex-col items-center justify-center p-3 gap-1.5 transition-all select-none',
                        isSelected
                          ? 'border-[#014DA4] dark:border-blue-400 bg-[#014DA4]/5 dark:bg-blue-950/15 ring-1 ring-[#014DA4] dark:ring-blue-400 text-[#014DA4] dark:text-blue-400 font-bold shadow-3xs'
                          : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400 dark:text-slate-500 cursor-pointer shadow-3xs'
                      )}
                    >
                      <span className={cn(
                        "text-[22px] font-black leading-none",
                        isSelected ? "text-[#014DA4] dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                      )}>
                        +{litres}L
                      </span>
                      <span className="text-[10px] font-bold text-inherit opacity-75">Extra Portion</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Details Preview */}
            {extraLitres > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 text-[13.5px] font-bold text-slate-650 dark:text-slate-400 dark:text-slate-500 shadow-3xs"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-455">Your Regular Delivery:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{baseQty} Litres</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-455">Selected Extra Quantity:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">+{extraLitres} Litres</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-455">Tomorrow's Total Delivery:</span>
                  <span className="font-extrabold text-[#014DA4] dark:text-blue-400 font-mono">{(baseQty + extraLitres)} Litres</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-455 flex items-center gap-1.5">
                    <Info size={14} className="text-slate-450" /> 
                    <span>Estimated Extra Charge:</span>
                  </span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-base">₹{estimatedCharge.toFixed(2)}</span>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {error && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-2 pl-1">
                <ShieldAlert size={14} className="text-rose-500" /> 
                <span>{error}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-650 font-bold flex items-center gap-2 pl-1">
                <CheckCircle size={14} className="text-emerald-500" /> 
                <span>{successMsg}</span>
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !orderDate}
              className="w-full h-12 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle size={14} className="stroke-[2.5]" />
                  <span>Confirm Extra Order</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Right Column: Rules & Guidelines */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          
          {/* Rules Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] pl-0.5 select-none">Order Rules</h3>
            
            <div className="space-y-4 text-left leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-emerald-650 dark:text-emerald-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">1</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">9:00 PM Cut-off Time</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Extra orders for tomorrow morning must be placed before 9:00 PM tonight. Later orders cannot be processed.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-emerald-650 dark:text-emerald-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">2</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Farm Capacity Limit</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Order confirmations are subject to milk capacity and availability. Early bookings secure allocation.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-emerald-650 dark:text-emerald-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">3</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">One-Time Billing Charge</p>
                  <p className="text-slate-455 dark:text-slate-400 dark:text-slate-500 mt-1">This order will only affect the selected day. The charge will be added directly to your monthly statement balance.</p>
                </div>
              </div>
            </div>

            {isCutoffPassed && (
              <div className="p-3.5 bg-rose-50/10 dark:bg-rose-950/20 border border-rose-100/40 dark:border-rose-900/30 rounded-xl flex gap-2.5">
                <ShieldAlert className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">Cut-off Deadline Passed</h4>
                  <p className="text-[10.5px] text-rose-900 dark:text-rose-305 font-semibold leading-normal mt-0.5">It is past 9:00 PM. Extra orders for tomorrow morning's slot are closed. You can schedule extra milk for any subsequent dates.</p>
                </div>
              </div>
            )}
          </div>

        </motion.div>

      </div>
    </motion.div>
  )
}
