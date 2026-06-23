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
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-80 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-20 bg-slate-200 rounded-2xl" />
          <div className="h-20 bg-slate-200 rounded-2xl" />
          <div className="h-20 bg-slate-200 rounded-2xl" />
          <div className="h-20 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      <div>
        <h1 className="text-[22px] font-black text-[#0f172a] font-display tracking-tight mb-1 flex items-center gap-2">
          <CalendarDays size={24} className="text-[#64748b]" /> Delivery History
        </h1>
        <p className="text-[13px] font-semibold text-[#64748b]">Calendar view of your milk delivery records.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e8edf5] rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
          <div className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mx-auto mb-2 border border-[#bbf7d0]">
            <Truck size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-[#0f172a] font-mono leading-none">{summary.delivered}</p>
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Delivered</p>
        </div>
        <div className="bg-white border border-[#e8edf5] rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
          <div className="w-8 h-8 rounded-lg bg-[#fee2e2] text-[#ef4444] flex items-center justify-center mx-auto mb-2 border border-[#fecaca]">
            <SkipForward size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-[#0f172a] font-mono leading-none">{summary.skipped}</p>
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Skipped</p>
        </div>
        <div className="bg-white border border-[#e8edf5] rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
          <div className="w-8 h-8 rounded-lg bg-[#dbeafe] text-[#2563eb] flex items-center justify-center mx-auto mb-2 border border-[#bfdbfe]">
            <Palmtree size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-[#0f172a] font-mono leading-none">{summary.paused}</p>
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Vacation</p>
        </div>
        <div className="bg-white border border-[#e8edf5] rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
          <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center mx-auto mb-2 border border-[#fde68a]">
            <Milk size={14} strokeWidth={2.5} />
          </div>
          <p className="text-[20px] font-black text-[#0f172a] font-mono leading-none">{summary.totalLitres.toFixed(1)}L</p>
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Total Milk</p>
        </div>
      </div>

      <div className="bg-white border border-[#e8edf5] rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden">
        
        <div className="p-5 border-b border-[#e8edf5] flex items-center justify-between bg-[#f8fafc]">
          <button
            onClick={goToPreviousMonth}
            className="w-9 h-9 rounded-xl border border-[#e8edf5] bg-white flex items-center justify-center hover:bg-[#e2e8f0] transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={16} className="text-[#64748b]" />
          </button>
          <h2 className="text-[15px] font-black text-[#0f172a] font-display">{monthName}</h2>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-xl border border-[#e8edf5] bg-white flex items-center justify-center hover:bg-[#e2e8f0] transition-all cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} className="text-[#64748b]" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-[#e8edf5] bg-[#f8fafc]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2.5 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarCells.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} className="h-16 md:h-24 border-b border-r border-[#e8edf5]/60 bg-slate-50/50" />
            }

            const isToday = isCurrentMonth && cell.day === today
            const status = cell.record?.delivery_status
            const isFuture = isCurrentMonth && cell.day > today

            let bgColor = 'bg-white'
            let statusIcon = null

            if (status === 'delivered') {
              bgColor = 'bg-[#f0fdf4]'
              statusIcon = <CheckCircle2 size={12} className="text-[#16a34a]" />
            } else if (status === 'skipped') {
              bgColor = 'bg-[#fef2f2]'
              statusIcon = <SkipForward size={12} className="text-[#ef4444]" />
            } else if (status === 'paused' || status === 'vacation') {
              bgColor = 'bg-[#eff6ff]'
              statusIcon = <Palmtree size={12} className="text-[#2563eb]" />
            } else if (status === 'pending') {
              bgColor = 'bg-[#fffbeb]'
            }

            return (
              <div
                key={cell.day}
                className={cn(
                  'h-16 md:h-24 border-b border-r border-[#e8edf5] p-2 md:p-3 flex flex-col transition-colors relative',
                  bgColor,
                  isToday && 'ring-2 ring-inset ring-[#2563eb] z-10 rounded-lg shadow-sm',
                  isFuture && !status && 'opacity-40 bg-[#f8fafc]'
                )}
              >
                <span className={cn(
                  'text-[12px] md:text-[14px] font-black leading-none',
                  isToday ? 'text-[#2563eb]' : 'text-[#0f172a]'
                )}>
                  {cell.day}
                </span>
                {status && (
                  <div className="flex-1 flex items-end justify-between mt-1">
                    {statusIcon}
                    {cell.record && cell.record.total_litres > 0 && status === 'delivered' && (
                      <span className="text-[9px] md:text-[11px] font-black text-[#16a34a] font-mono bg-[#dcfce7] px-1 rounded border border-[#bbf7d0]">
                        {cell.record.total_litres}L
                      </span>
                    )}
                  </div>
                )}
                {isToday && (
                  <div className="absolute top-2 right-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-[#e8edf5] rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-[#64748b]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#dcfce7] border border-[#bbf7d0]" />
            <span>Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#fee2e2] border border-[#fecaca]" />
            <span>Skipped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#dbeafe] border border-[#bfdbfe]" />
            <span>Vacation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#fef3c7] border border-[#fde68a]" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb] animate-pulse" />
            <span>Today</span>
          </div>
        </div>
      </div>

    </div>
  )
}
