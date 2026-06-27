'use client'

import { useState, useEffect } from 'react'
import { SkipForward, CalendarDays, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Info, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface SkipRequest {
  skip_date: string;
  status: string;
  credit_amount: number;
}

// Animation configurations
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

export default function SkipDayPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [upcomingSkips, setUpcomingSkips] = useState<SkipRequest[]>([])
  const [latestPaidMonth, setLatestPaidMonth] = useState<string | null>(null)

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        setSubscription(json.subscription)
        setUpcomingSkips(json.upcoming_skips || [])
        setLatestPaidMonth(json.latest_paid_month || null)
      } else {
        setError(json.message || 'Failed to load details')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 14)
  
  if (latestPaidMonth) {
    const paidMonthDate = new Date(latestPaidMonth);
    const endOfPaidMonth = new Date(paidMonthDate.getFullYear(), paidMonthDate.getMonth() + 1, 0);
    if (maxDate > endOfPaidMonth) {
      maxDate.setTime(endOfPaidMonth.getTime());
    }
  }

  const isCutoffPassed = new Date().getHours() >= 21

  const skipDatesSet = new Set(upcomingSkips.map(s => s.skip_date))

  // Generate 7 days for the date picker based on offset
  const pickerDays = []
  const startDay = new Date(tomorrow)
  startDay.setDate(startDay.getDate() + currentWeekOffset * 7)
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDay)
    d.setDate(d.getDate() + i)
    if (d <= maxDate) {
      pickerDays.push(d)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate) {
      setError('Please select a date to skip')
      return
    }

    const dateStr = selectedDate.toISOString().split('T')[0]
    
    if (skipDatesSet.has(dateStr)) {
      setError('You have already skipped this date')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/skip/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip_date: dateStr })
      })
      const json = await res.json()

      if (json.success) {
        setSuccessMsg(`Successfully skipped delivery for ${selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`)
        setSelectedDate(null)
        await loadData()
      } else {
        setError(json.message || 'Failed to process skip request')
      }
    } catch (err) {
      setError('Network error processing request')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <SkipForward size={22} className="stroke-[2.5]" />
            </div>
            <span>Skip Delivery</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 pl-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-450" />
            <span>Pause your delivery for specific dates and earn statement credits instantly</span>
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
        
        {/* Left Column: Date Selector Form & Skip Day Guide */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Header controls */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-slate-455 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[2px] pl-0.5 select-none">Select Skip Date</label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset(prev => Math.max(0, prev - 1))}
                  disabled={currentWeekOffset === 0}
                  className="w-8 h-8 rounded-lg border border-border dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-slate-900 shadow-3xs"
                  title="Previous Week"
                >
                  <ChevronLeft size={14} className="text-slate-550 dark:text-slate-400 dark:text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset(prev => Math.min(1, prev + 1))}
                  disabled={currentWeekOffset === 1 || pickerDays.length < 7}
                  className="w-8 h-8 rounded-lg border border-border dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-slate-900 shadow-3xs"
                  title="Next Week"
                >
                  <ChevronRight size={14} className="text-slate-555 dark:text-slate-400 dark:text-slate-500" />
                </button>
              </div>
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {pickerDays.map((date) => {
                const dateStr = date.toISOString().split('T')[0]
                const isAlreadySkipped = skipDatesSet.has(dateStr)
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr
                const isTomorrow = date.getTime() === tomorrow.getTime()
                const isDisabled = isAlreadySkipped || (isTomorrow && isCutoffPassed)

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'h-20 sm:h-[84px] rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden select-none',
                      isSelected
                        ? 'border-[#014DA4] dark:border-blue-400 bg-[#014DA4]/5 dark:bg-blue-950/15 ring-1 ring-[#014DA4] dark:ring-blue-400 text-[#014DA4] dark:text-blue-400'
                        : isDisabled
                        ? 'border-border/30 dark:border-slate-800/45 bg-slate-50/75 dark:bg-slate-950/40 text-slate-350 dark:text-slate-600 dark:text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-65'
                        : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-550 dark:text-slate-300 cursor-pointer shadow-3xs'
                    )}
                  >
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider">
                      {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className={cn(
                      "text-xl font-black leading-none",
                      isSelected ? "text-[#014DA4] dark:text-blue-400" : (isDisabled ? "text-slate-300 dark:text-slate-600 dark:text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200")
                    )}>
                      {date.getDate()}
                    </span>
                    
                    {isAlreadySkipped && (
                      <div className="absolute top-0 right-0 w-4 h-4 bg-[#014DA4] rounded-bl-lg flex items-center justify-center">
                        <SkipForward size={8} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Confirmation details */}
            {selectedDate && (
              <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 flex items-center justify-between select-none">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Confirming Skip For</p>
                  <p className="text-[14px] font-black text-slate-800 dark:text-slate-200">
                    {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Statement Credit</p>
                  <p className="text-[14.5px] font-black text-emerald-650 dark:text-emerald-500 font-mono">+₹{subscription?.daily_rate.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Notifications */}
            {error && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-2 pl-1">
                <AlertCircle size={14} className="text-rose-500" /> 
                <span>{error}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-650 font-bold flex items-center gap-2 pl-1">
                <CheckCircle2 size={14} className="text-emerald-500" /> 
                <span>{successMsg}</span>
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedDate}
              className="w-full h-12 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SkipForward size={14} className="stroke-[2.5]" />
                  <span>Confirm Skip Day</span>
                </>
              )}
            </button>
          </form>

          {/* Skip Day Guide Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] pl-0.5 select-none">Skip Day Guide</h3>
            
            <div className="space-y-4 text-left leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">1</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Select Your Date</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Identify which day you want to skip. You have the flexibility to schedule skips up to 14 days in advance, <strong className="text-emerald-600 dark:text-emerald-500 font-bold">within your paid subscription period</strong>.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">2</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Observe the Cut-off</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">To ensure farm operations are adjusted, skips must be submitted before the <strong className="text-rose-500 dark:text-rose-455 font-black">9:00 PM</strong> deadline on the preceding evening.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">3</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Automatic Bill Credit</p>
                  <p className="text-slate-455 dark:text-slate-400 dark:text-slate-500 mt-1">Each skipped day generates a credit equal to your subscription's daily rate of <strong className="text-emerald-650 dark:text-emerald-500 font-extrabold">₹{subscription?.daily_rate.toFixed(2)}</strong>, reducing your next statement.</p>
                </div>
              </div>
            </div>
            
            {isCutoffPassed && (
              <div className="p-3 bg-rose-50/10 dark:bg-rose-950/20 border border-rose-100/40 dark:border-rose-900/30 rounded-xl flex gap-2.5">
                <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">Cut-off Deadline Passed</h4>
                  <p className="text-[10.5px] text-rose-900 dark:text-rose-300 font-semibold leading-normal mt-0.5">It is past 9:00 PM. Skips for tomorrow's morning slot are closed. You can schedule skips for any subsequent dates.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Confirmed Skips */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          
          {/* Confirmed Skips Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-left select-none">
              <h3 className="text-[13px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-wider font-display">Confirmed Skips</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-widest">Upcoming paused slots</p>
            </div>
            
            <div className="p-2">
              {upcomingSkips.length === 0 ? (
                <div className="text-center py-12 px-5">
                  <CalendarDays size={32} className="text-slate-350 dark:text-slate-600 dark:text-slate-400 dark:text-slate-500 mx-auto mb-3 stroke-[1.5]" />
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">
                    No upcoming skipped deliveries. Select a date on the calendar to schedule a skip.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto pr-1">
                  {upcomingSkips.map((skip, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                          <CalendarDays size={15} />
                        </div>
                        <div className="text-left">
                          <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                            {new Date(skip.skip_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Credit applied to next bill</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="inline-flex text-[9px] font-extrabold text-green-700 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200/15">
                          Confirmed
                        </span>
                        <p className="text-sm font-black text-emerald-650 dark:text-emerald-500 font-mono mt-1">+₹{skip.credit_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </motion.div>

      </div>
    </motion.div>
  )
}
