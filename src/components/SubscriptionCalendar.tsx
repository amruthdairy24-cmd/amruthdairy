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
}: SubscriptionCalendarProps) {
  const startDateObj = useMemo(() => new Date(startDate), [startDate])
  
  const [currentYear, setCurrentYear] = useState(startDateObj.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(startDateObj.getMonth() + 1) // 1-indexed
  const [excludedDates, setExcludedDates] = useState<Set<string>>(
    new Set(initialExcludedDates)
  )

  // Notify parent when excluded dates change
  useEffect(() => {
    onExcludedDatesChange(Array.from(excludedDates))
  }, [excludedDates, onExcludedDatesChange])

  // Calendar grid for the current month
  const calendarDates = useMemo(() => {
    return getAllDatesInMonth(currentYear, currentMonth)
  }, [currentYear, currentMonth])

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
    return true
  }, [startDate])

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

  return (
    <div className="sub-calendar-root">
      {/* Header */}
      <div className="sub-cal-header">
        <div className="sub-cal-header-left">
          <h3 className="sub-cal-title">Select Delivery Days</h3>
          <p className="sub-cal-subtitle">
            Click dates to exclude days you don't need milk delivery
          </p>
        </div>
        <div className="sub-cal-stats">
          <span className="sub-cal-stat-delivery">
            <Check size={12} strokeWidth={3} /> {deliveryDays} delivery days
          </span>
          <span className="sub-cal-stat-excluded">
            <X size={12} strokeWidth={3} /> {excludedInMonth.length} excluded
          </span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="sub-cal-nav">
        <button
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className="sub-cal-nav-btn"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="sub-cal-month-label">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </span>
        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className="sub-cal-nav-btn"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day names header */}
      <div className="sub-cal-daynames">
        {DAY_NAMES.map(d => (
          <div key={d} className="sub-cal-dayname">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="sub-cal-grid">
        {/* Empty cells for days before the first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="sub-cal-cell sub-cal-cell-empty" />
        ))}

        {/* Date cells */}
        {calendarDates.map(dateStr => {
          const day = parseInt(dateStr.split('-')[2], 10)
          const selectable = isDateSelectable(dateStr)
          const excluded = excludedDates.has(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => toggleDate(dateStr)}
              disabled={!selectable}
              className={cn(
                'sub-cal-cell',
                !selectable && 'sub-cal-cell-disabled',
                selectable && !excluded && 'sub-cal-cell-included',
                selectable && excluded && 'sub-cal-cell-excluded',
              )}
              title={
                !selectable
                  ? 'Past date'
                  : excluded
                  ? `Click to include ${dateStr}`
                  : `Click to exclude ${dateStr}`
              }
            >
              <span className="sub-cal-day-num">{day}</span>
              {selectable && !excluded && (
                <span className="sub-cal-day-check">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
              {selectable && excluded && (
                <span className="sub-cal-day-x">
                  <X size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="sub-cal-actions">
        <button onClick={selectAllDays} className="sub-cal-action-btn sub-cal-action-include">
          <Check size={12} /> Include all days
        </button>
        <button onClick={clearAllDays} className="sub-cal-action-btn sub-cal-action-exclude">
          <X size={12} /> Exclude all days
        </button>
      </div>

      {/* Legend */}
      <div className="sub-cal-legend">
        <div className="sub-cal-legend-item">
          <span className="sub-cal-legend-dot sub-cal-legend-included" />
          <span>Delivery day (billed)</span>
        </div>
        <div className="sub-cal-legend-item">
          <span className="sub-cal-legend-dot sub-cal-legend-excluded" />
          <span>Excluded (not billed)</span>
        </div>
        <div className="sub-cal-legend-item">
          <span className="sub-cal-legend-dot sub-cal-legend-disabled" />
          <span>Past / unavailable</span>
        </div>
      </div>
    </div>
  )
}
