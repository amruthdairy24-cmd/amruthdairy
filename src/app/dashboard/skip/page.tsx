'use client'

import { useState, useEffect } from 'react'
import { SkipForward, CalendarDays, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkipRequest {
  skip_date: string;
  status: string;
  credit_amount: number;
}

export default function SkipDayPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [upcomingSkips, setUpcomingSkips] = useState<SkipRequest[]>([])

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        setSubscription(json.subscription)
        setUpcomingSkips(json.upcoming_skips || [])
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
      <div className="max-w-2xl space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-[22px] font-black text-slate-900 dark:text-white font-display tracking-tight mb-1 flex items-center gap-2">
          <SkipForward size={24} className="text-rose-600 dark:text-rose-500" /> Skip Delivery
        </h1>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-450">Pause delivery for a specific day and earn credit.</p>
      </div>

      <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black text-[12px] flex-shrink-0 border border-border/50 dark:border-slate-800/85">1</div>
          <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            <p className="text-slate-900 dark:text-white font-black mb-0.5">Select a date</p>
            <p>You can skip up to 14 days in advance. Select the date below.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black text-[12px] flex-shrink-0 border border-border/50 dark:border-slate-800/85">2</div>
          <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            <p className="text-slate-900 dark:text-white font-black mb-0.5">Cut-off time</p>
            <p>Requests must be made before <strong>9:00 PM</strong> for next-day skips.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black text-[12px] flex-shrink-0 border border-border/50 dark:border-slate-800/85">3</div>
          <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            <p className="text-slate-900 dark:text-white font-black mb-0.5">Earn credit</p>
            <p>Credit worth <strong className="text-emerald-600 dark:text-emerald-400">₹{subscription?.daily_rate.toFixed(2)}</strong> will be applied to your monthly bill automatically.</p>
          </div>
        </div>
      </div>

      {isCutoffPassed && (
        <div className="bg-rose-500/10 dark:bg-rose-550/15 border border-rose-200/30 dark:border-rose-900/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-605 dark:text-rose-450 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-[11px] font-black text-rose-800 dark:text-rose-350 uppercase tracking-wider">Cut-off Passed</h4>
            <p className="text-[12px] font-semibold text-rose-900 dark:text-rose-200/85 mt-0.5">It is past 9:00 PM. Skips for tomorrow are no longer accepted.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Select Date</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset(prev => Math.max(0, prev - 1))}
                disabled={currentWeekOffset === 0}
                className="w-7 h-7 rounded-lg border border-border/50 dark:border-slate-800/80 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
              >
                <ChevronLeft size={14} className="text-slate-500 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentWeekOffset(prev => Math.min(1, prev + 1))}
                disabled={currentWeekOffset === 1 || pickerDays.length < 7}
                className="w-7 h-7 rounded-lg border border-border/50 dark:border-slate-800/80 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
              >
                <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
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
                    'h-[72px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden',
                    isSelected
                      ? 'border-brand-secondary bg-blue-500/10 dark:bg-blue-550/20 ring-1 ring-brand-secondary text-blue-850 dark:text-blue-400'
                      : isDisabled
                      ? 'border-border/40 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/35 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                      : 'border-border/50 dark:border-slate-800/80 bg-white dark:bg-cream-100 hover:border-slate-400/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-550 dark:text-slate-400 cursor-pointer'
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className={cn(
                    "text-[18px] font-black leading-none",
                    isSelected ? "text-blue-850 dark:text-blue-400" : (isDisabled ? "text-slate-400 dark:text-slate-600" : "text-slate-900 dark:text-white")
                  )}>
                    {date.getDate()}
                  </span>
                  
                  {isAlreadySkipped && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-rose-600 rounded-bl-lg flex items-center justify-center">
                      <SkipForward size={8} className="text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-border/50 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between animate-fade-in">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Confirming Skip For</p>
              <p className="text-[14px] font-black text-slate-900 dark:text-white">
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Credit Earned</p>
              <p className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 font-mono">+₹{subscription?.daily_rate.toFixed(2)}</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-rose-650 dark:text-rose-400 font-bold flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        {successMsg && (
          <p className="text-[12px] text-emerald-650 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 size={14} /> {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !selectedDate}
          className="w-full h-11 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <SkipForward size={14} strokeWidth={2.5} />
              <span>Confirm Skip Day</span>
            </>
          )}
        </button>
      </form>

      {upcomingSkips.length > 0 && (
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 dark:border-slate-800/80">
            <h3 className="text-[13px] font-black text-slate-900 dark:text-white">Upcoming Confirmed Skips</h3>
          </div>
          <div className="divide-y divide-border/50 dark:divide-slate-800/80">
            {upcomingSkips.map((skip, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-450 flex items-center justify-center">
                    <CalendarDays size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-900 dark:text-white">
                      {new Date(skip.skip_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Credit applied to bill</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30 px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                  <p className="text-[12px] font-black text-emerald-650 dark:text-emerald-400 font-mono mt-1">+₹{skip.credit_amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
