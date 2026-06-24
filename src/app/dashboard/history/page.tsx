'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Milk, ChevronLeft, ChevronRight, Truck, SkipForward, Palmtree, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeliveryRecord {
  delivery_date: string
  total_litres: number
  delivery_status: string
}

interface MonthSummary {
  delivered: number
  skipped: number
  paused: number
  pending: number
  totalLitres: number
}

export default function DeliveryHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [subQty, setSubQty] = useState(1.0)

  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())

  async function loadData() {
    try {
      setLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        if (json.subscription) setSubQty(json.subscription.quantity_litres)
        setDeliveries(json.recent_deliveries || [])
      } else {
        setError(json.message || 'Failed to load delivery history')
      }
    } catch (err) {
      setError('Network error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const deliveryMap = new Map<string, DeliveryRecord>()
  deliveries.forEach(d => { deliveryMap.set(d.delivery_date, d) })

  const calendarCells: Array<{ day: number | null; record?: DeliveryRecord }> = []
  for (let i = 0; i < firstDayOfWeek; i++) { calendarCells.push({ day: null }) }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, record: deliveryMap.get(dateStr) })
  }

  const summary: MonthSummary = { delivered: 0, skipped: 0, paused: 0, pending: 0, totalLitres: 0 }
  calendarCells.forEach(cell => {
    if (cell.day && cell.record) {
      switch (cell.record.delivery_status) {
        case 'delivered':
          summary.delivered++; summary.totalLitres += cell.record.total_litres; break
        case 'skipped':
          summary.skipped++; break
        case 'paused':
        case 'vacation':
          summary.paused++; break
        default:
          summary.pending++; break
      }
    }
  })

  function goToPreviousMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else { setViewMonth(viewMonth - 1) }
  }

  function goToNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else { setViewMonth(viewMonth + 1) }
  }

  const isCurrentMonth = viewYear === new Date().getFullYear() && viewMonth === new Date().getMonth()
  const today = new Date().getDate()

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      <div>
        <h1 className="text-[22px] font-black text-slate-900 dark:text-white font-display tracking-tight mb-1 flex items-center gap-2">
          <CalendarDays size={24} className="text-slate-450 dark:text-slate-500" /> Delivery History
        </h1>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Calendar view of your milk delivery records.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 border border-green-200/30 dark:border-green-900/30">
            <Truck size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-slate-900 dark:text-white font-mono leading-none">{summary.delivered}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Delivered</p>
        </div>
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center mx-auto mb-2 border border-rose-200/30 dark:border-rose-900/30">
            <SkipForward size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-slate-900 dark:text-white font-mono leading-none">{summary.skipped}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Skipped</p>
        </div>
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-200/30 dark:border-blue-900/30">
            <Palmtree size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-slate-900 dark:text-white font-mono leading-none">{summary.paused}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Vacation</p>
        </div>
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-750 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-200/30 dark:border-amber-900/30">
            <Milk size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-slate-900 dark:text-white font-mono leading-none">{summary.totalLitres.toFixed(1)}L</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total Milk</p>
        </div>
      </div>

      <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
        
        <div className="p-5 border-b border-border/50 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/35">
          <button
            onClick={goToPreviousMonth}
            className="w-9 h-9 rounded-xl border border-border/50 dark:border-slate-800/85 bg-white dark:bg-cream-100 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={16} className="text-slate-500 dark:text-slate-400" />
          </button>
          <h2 className="text-[15px] font-black text-slate-900 dark:text-white font-display">{monthName}</h2>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-xl border border-border/50 dark:border-slate-800/85 bg-white dark:bg-cream-100 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/35">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarCells.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} className="h-16 md:h-24 border-b border-r border-border/40 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10" />
            }

            const isToday = isCurrentMonth && cell.day === today
            const status = cell.record?.delivery_status
            const isFuture = isCurrentMonth && cell.day > today

            let bgColor = 'bg-white dark:bg-cream-100'
            let statusIcon = null

            if (status === 'delivered') {
              bgColor = 'bg-green-500/5 dark:bg-green-950/10'
              statusIcon = <CheckCircle2 size={12} className="text-emerald-655 dark:text-emerald-400" />
            } else if (status === 'skipped') {
              bgColor = 'bg-rose-500/5 dark:bg-rose-950/10'
              statusIcon = <SkipForward size={12} className="text-rose-650 dark:text-rose-400" />
            } else if (status === 'paused' || status === 'vacation') {
              bgColor = 'bg-blue-500/5 dark:bg-blue-950/10'
              statusIcon = <Palmtree size={12} className="text-blue-650 dark:text-blue-400" />
            } else if (status === 'pending') {
              bgColor = 'bg-amber-500/5 dark:bg-amber-950/10'
            }

            return (
              <div
                key={cell.day}
                className={cn(
                  'h-16 md:h-24 border-b border-r border-border/50 dark:border-slate-800/80 p-2 md:p-3 flex flex-col transition-colors relative',
                  bgColor,
                  isToday && 'ring-2 ring-inset ring-brand-secondary z-10 rounded-lg shadow-sm',
                  isFuture && !status && 'opacity-40 bg-slate-50 dark:bg-slate-900/30'
                )}
              >
                <span className={cn(
                  'text-[12px] md:text-[14px] font-black leading-none',
                  isToday ? 'text-brand-secondary' : 'text-slate-900 dark:text-white'
                )}>
                  {cell.day}
                </span>
                {status && (
                  <div className="flex-1 flex items-end justify-between mt-1">
                    {statusIcon}
                    {cell.record && cell.record.total_litres > 0 && status === 'delivered' && (
                      <span className="text-[9px] md:text-[11px] font-black text-green-750 dark:text-green-400 font-mono bg-green-500/10 dark:bg-green-500/25 px-1 rounded border border-green-250/20 dark:border-green-900/20">
                        {cell.record.total_litres}L
                      </span>
                    )}
                  </div>
                )}
                {isToday && (
                  <div className="absolute top-2 right-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/10 dark:bg-green-500/25 border border-green-200/30 dark:border-green-900/30" />
            <span>Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500/10 dark:bg-rose-500/25 border border-rose-200/30 dark:border-rose-900/30" />
            <span>Skipped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500/10 dark:bg-blue-500/25 border border-blue-200/30 dark:border-blue-900/30" />
            <span>Vacation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/10 dark:bg-amber-500/25 border border-amber-200/30 dark:border-amber-900/30" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary animate-pulse" />
            <span>Today</span>
          </div>
        </div>
      </div>

    </div>
  )
}
