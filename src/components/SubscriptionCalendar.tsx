'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDaysInMonth, getAllDatesInMonth } from '@/lib/billing'

interface SubscriptionCalendarProps {
  /** Start date for the subscription (YYYY-MM-DD) */
  startDate: string
  /** Called whenever the excluded dates change */
  onExcludedDatesChange: (excludedDates: string[]) => void
  /** Initial excluded dates */
  initialExcludedDates?: string[]
  /** Maximum months to show ahead (default 1) */
  maxMonthsAhead?: number
  /** Quantity requested */
  quantity?: number
  /** Callback for when month availability status changes (all full or not) */
  onMonthAvailabilityChange?: (isFull: boolean) => void
  /** Callback for when number of delivery days changes */
  onDeliveryDaysChange?: (days: number) => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * SubscriptionCalendar — Interactive calendar for selecting delivery days.
 * 
 * Customers can click dates to toggle between:
 * - ✅ INCLUDED (green) — milk will be delivered, day is billed
 * - ❌ EXCLUDED (red/grey) — no delivery, not billed
 * 
 * Dates before the start date are disabled.
 * The calendar shows the subscription month with clear visual feedback.
 */
export default function SubscriptionCalendar({
  startDate,
  onExcludedDatesChange,
  initialExcludedDates = [],
  maxMonthsAhead = 1,
  quantity = 1,
  onMonthAvailabilityChange,
  onDeliveryDaysChange,
}: SubscriptionCalendarProps) {
  const startDateObj = useMemo(() => new Date(startDate), [startDate])
  
  const [currentYear, setCurrentYear] = useState(startDateObj.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(startDateObj.getMonth() + 1) // 1-indexed
  const [excludedDates, setExcludedDates] = useState<Set<string>>(
    new Set(initialExcludedDates)
  )
  const [capacityMap, setCapacityMap] = useState<Record<string, { has_capacity: boolean }>>({})
  const [loadingCapacity, setLoadingCapacity] = useState(false)

  // Notify parent when excluded dates change
  useEffect(() => {
    onExcludedDatesChange(Array.from(excludedDates))
  }, [excludedDates, onExcludedDatesChange])

  // Calendar grid for the current month
  const calendarDates = useMemo(() => {
    return getAllDatesInMonth(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  // Fetch capacity when month/year/quantity changes
  useEffect(() => {
    async function fetchCapacity() {
      setLoadingCapacity(true)
      try {
        const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
        const res = await fetch(`/api/subscription/capacity-month?month=${monthStr}&litres=${quantity}`)
        const data = await res.json()
        if (data.success) {
          setCapacityMap(data.capacities)
        }
      } catch (err) {
        console.error('Failed to fetch capacity map', err)
      } finally {
        setLoadingCapacity(false)
      }
    }
    fetchCapacity()
  }, [currentYear, currentMonth, quantity])

  useEffect(() => {
    if (loadingCapacity || !onMonthAvailabilityChange) return
    const selectableDates = calendarDates.filter(d => {
      const dObj = new Date(d)
      const sObj = new Date(startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dObj >= sObj && dObj >= today
    })
    
    if (selectableDates.length === 0) return

    const hasAnyAvailableSlot = selectableDates.some(d => capacityMap[d]?.has_capacity !== false)
    onMonthAvailabilityChange(!hasAnyAvailableSlot)
  }, [capacityMap, loadingCapacity, calendarDates, startDate, onMonthAvailabilityChange])

  // First day of month (0 = Sunday)
  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay()
  }, [currentYear, currentMonth])

  // Determine which dates are selectable (>= start date, in current/next month)
  const isDateSelectable = useCallback((dateStr: string): boolean => {
    const d = new Date(dateStr)
    const s = new Date(startDate)
    // Can't select dates before start date
    if (d < s) return false
    // Can't select dates in the past (today or before)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return false
    
    // Check capacity map
    if (capacityMap[dateStr] && capacityMap[dateStr].has_capacity === false) return false

    return true
  }, [startDate, capacityMap])

  const toggleDate = useCallback((dateStr: string) => {
    if (!isDateSelectable(dateStr)) return

    setExcludedDates(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) {
        next.delete(dateStr)
      } else {
        next.add(dateStr)
      }
      return next
    })
  }, [isDateSelectable])

  // Navigation
  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }, [currentMonth])

  // Can navigate back to start month only
  const canGoPrev = useMemo(() => {
    const startM = startDateObj.getMonth() + 1
    const startY = startDateObj.getFullYear()
    return currentYear > startY || (currentYear === startY && currentMonth > startM)
  }, [currentYear, currentMonth, startDateObj])

  // Can navigate forward up to maxMonthsAhead
  const canGoNext = useMemo(() => {
    const startM = startDateObj.getMonth() + 1
    const startY = startDateObj.getFullYear()
    const maxDate = new Date(startY, startM - 1 + maxMonthsAhead, 1)
    const currentDate = new Date(currentYear, currentMonth - 1, 1)
    return currentDate < maxDate
  }, [currentYear, currentMonth, startDateObj, maxMonthsAhead])

  // Stats
  const totalDaysInMonth = getDaysInMonth(currentYear, currentMonth)
  const selectableDates = calendarDates.filter(d => isDateSelectable(d))
  const excludedInMonth = calendarDates.filter(d => excludedDates.has(d))
  const deliveryDays = selectableDates.length - excludedInMonth.length

  // Notify parent of delivery days
  useEffect(() => {
    if (onDeliveryDaysChange) {
      onDeliveryDaysChange(deliveryDays)
    }
  }, [deliveryDays, onDeliveryDaysChange])

  // Select all / Deselect all
  const selectAllDays = useCallback(() => {
    setExcludedDates(prev => {
      const next = new Set(prev)
      calendarDates.forEach(d => next.delete(d))
      return next
    })
  }, [calendarDates])

  const clearAllDays = useCallback(() => {
    setExcludedDates(prev => {
      const next = new Set(prev)
      calendarDates.forEach(d => {
        if (isDateSelectable(d)) next.add(d)
      })
      return next
    })
  }, [calendarDates, isDateSelectable])

  const excludeDaysOfWeek = useCallback((dayIndex: number) => {
    setExcludedDates(prev => {
      const next = new Set(prev)
      calendarDates.forEach(d => {
        if (isDateSelectable(d)) {
          const dateObj = new Date(d)
          if (dateObj.getDay() === dayIndex) {
            next.add(d)
          }
        }
      })
      return next
    })
  }, [calendarDates, isDateSelectable])


  return (
    <div className="p-6 rounded-brand-2xl border border-border/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-[0_4px_20px_var(--shadow)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 dark:border-slate-800/40 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">Select Delivery Days</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Click dates to exclude days you don't need milk delivery
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/30 font-bold uppercase tracking-[0.5px] text-[10px]">
            <Check size={12} strokeWidth={3} /> {deliveryDays} delivery days
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/30 font-bold uppercase tracking-[0.5px] text-[10px]">
            <X size={12} strokeWidth={3} /> {excludedInMonth.length} excluded
          </span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:border-brand-secondary dark:hover:border-brand-secondary/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-secondary dark:hover:text-white hover:bg-blue-50/30 dark:hover:bg-blue-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 min-w-36 text-center font-display flex items-center justify-center gap-2">
          {loadingCapacity && <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />}
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 hover:border-brand-secondary dark:hover:border-brand-secondary/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-secondary dark:hover:text-white hover:bg-blue-50/30 dark:hover:bg-blue-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before the first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-xl border border-transparent bg-transparent" />
        ))}

        {/* Date cells */}
        {calendarDates.map(dateStr => {
          const day = parseInt(dateStr.split('-')[2], 10)
          const selectable = isDateSelectable(dateStr)
          const isFull = capacityMap[dateStr]?.has_capacity === false;
          const disabledReason = !isDateSelectable(dateStr) && !isFull ? 'past' : isFull ? 'full' : null;
          const excluded = excludedDates.has(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => toggleDate(dateStr)}
              disabled={!selectable}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all text-xs font-bold font-display cursor-pointer',
                !selectable && !isFull && 'border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/20 text-slate-300 dark:text-slate-700 opacity-60 cursor-not-allowed',
                isFull && 'border-rose-100 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-900/20 text-rose-300 dark:text-rose-700 opacity-70 cursor-not-allowed',
                selectable && !excluded && 'border-green-200/60 dark:border-green-800/30 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-green-100/40 dark:hover:bg-green-900/30 shadow-[0_2px_8px_rgba(34,197,94,0.05)]',
                selectable && excluded && 'border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
              )}
              title={
                disabledReason === 'past'
                  ? 'Past date'
                  : disabledReason === 'full'
                  ? 'No slots available'
                  : excluded
                  ? `Click to include ${dateStr}`
                  : `Click to exclude ${dateStr}`
              }
            >
              <span className="text-[15px]">{day}</span>
              {selectable && !excluded && (
                <span className="absolute bottom-1 right-1 text-green-500 dark:text-green-400">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              {selectable && excluded && (
                <span className="absolute bottom-1 right-1 text-slate-400 dark:text-slate-500">
                  <X size={11} strokeWidth={3} />
                </span>
              )}
              {isFull && (
                <span className="absolute bottom-1 right-1 text-rose-400 text-[8px] uppercase font-black">
                  Full
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border/30 dark:border-slate-800/40 pt-4">
        <button 
          type="button"
          onClick={selectAllDays} 
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-green-200/60 dark:border-green-800/40 bg-green-50/40 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-all cursor-pointer"
        >
          <Check size={12} /> Include all
        </button>
        <button 
          type="button"
          onClick={clearAllDays} 
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
        >
          <X size={12} /> Exclude all
        </button>
        <button 
          type="button"
          onClick={() => excludeDaysOfWeek(0)} 
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-orange-200 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100/80 dark:hover:bg-orange-900/40 transition-all cursor-pointer"
        >
          <X size={12} /> Exclude Sundays
        </button>
        <button 
          type="button"
          onClick={() => excludeDaysOfWeek(6)} 
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-orange-200 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100/80 dark:hover:bg-orange-900/40 transition-all cursor-pointer"
        >
          <X size={12} /> Exclude Saturdays
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t border-border/20 dark:border-slate-800/30 pt-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-green-300 dark:border-green-800/80 bg-green-200 dark:bg-green-900" />
          <span>Delivery day (billed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800" />
          <span>Excluded (not billed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-900/50" />
          <span>Past / unavailable</span>
        </div>
      </div>
    </div>
  )
}

