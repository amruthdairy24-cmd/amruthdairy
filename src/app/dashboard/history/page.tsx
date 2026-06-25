'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Milk, ChevronLeft, ChevronRight, Truck, SkipForward, Palmtree, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
      <div className="max-w-5xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-[450px] bg-slate-200 rounded-3xl" />
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
          <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 font-display tracking-tight leading-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#014DA4]/10 text-[#014DA4] flex items-center justify-center">
              <CalendarDays size={22} />
            </div>
            <span>Delivery History</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 mt-2 pl-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            <span>Interactive calendar tracking your raw milk delivery journal</span>
          </p>
        </div>
        
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl border border-border bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer self-start sm:self-center"
        >
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Stats Cards Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Delivered */}
        <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Delivered</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-none font-mono">
              {summary.delivered} Days
            </p>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1.5 truncate">
              Completed milk drops
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Truck size={20} />
          </div>
        </div>

        {/* Card 2: Skipped */}
        <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Skipped</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-none font-mono">
              {summary.skipped} Days
            </p>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1.5 truncate">
              User requested skips
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <SkipForward size={20} />
          </div>
        </div>

        {/* Card 3: Vacation */}
        <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacation Pause</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-none font-mono">
              {summary.paused} Days
            </p>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1.5 truncate">
              Subscription pauses
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-550 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Palmtree size={20} />
          </div>
        </div>

        {/* Card 4: Total Volume */}
        <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-none font-mono">
              {summary.totalLitres.toFixed(1)}L
            </p>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1.5 truncate">
              Litres consumed this month
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Milk size={20} />
          </div>
        </div>
      </motion.div>

      {/* Main Calendar Card */}
      <motion.div variants={itemVariants} className="bg-white border border-border/50 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Calendar Controller Header */}
        <div className="p-5 sm:px-6 border-b border-border/50 flex items-center justify-between bg-slate-50/60 backdrop-blur-xs select-none">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 rounded-xl border border-border bg-white flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft size={18} className="text-slate-650" />
          </button>
          
          <h2 className="text-base sm:text-[20px] font-black text-[#014DA4] font-display tracking-tight leading-none">
            {monthName}
          </h2>
          
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="w-10 h-10 rounded-xl border border-border bg-white flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
            title="Next Month"
          >
            <ChevronRight size={18} className="text-slate-650" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-slate-50/40 border-b border-border/40 text-center py-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[2.5px]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid (Crisp mathematically aligned grid via gap-px & background coloring) */}
        <div className="grid grid-cols-7 gap-px bg-slate-150">
          {calendarCells.map((cell, idx) => {
            if (cell.day === null) {
              return (
                <div 
                  key={`empty-${idx}`} 
                  className="h-20 sm:h-28 bg-slate-50/20" 
                />
              )
            }

            const isToday = isCurrentMonth && cell.day === today
            const status = cell.record?.delivery_status
            const isFuture = isCurrentMonth && cell.day > today

            let cardBg = 'bg-white'
            let statusIcon = null
            let statusLabel = ''
            let statusColorClass = ''

            if (status === 'delivered') {
              cardBg = 'bg-emerald-500/3 hover:bg-emerald-500/5'
              statusIcon = <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
              statusLabel = 'Delivered'
              statusColorClass = 'text-emerald-700'
            } else if (status === 'skipped') {
              cardBg = 'bg-rose-500/3 hover:bg-rose-500/5'
              statusIcon = <SkipForward size={13} className="text-rose-500 flex-shrink-0" />
              statusLabel = 'Skipped'
              statusColorClass = 'text-rose-650'
            } else if (status === 'paused' || status === 'vacation') {
              cardBg = 'bg-blue-500/3 hover:bg-blue-500/5'
              statusIcon = <Palmtree size={13} className="text-blue-550 flex-shrink-0" />
              statusLabel = 'Vacation'
              statusColorClass = 'text-blue-700'
            } else if (status === 'pending') {
              cardBg = 'bg-amber-500/3 hover:bg-amber-500/5 animate-pulse'
              statusIcon = <Clock size={13} className="text-amber-600 flex-shrink-0" />
              statusLabel = 'Pending'
              statusColorClass = 'text-amber-705'
            }

            return (
              <div
                key={cell.day}
                className={cn(
                  'h-20 sm:h-28 p-2.5 sm:p-3.5 flex flex-col justify-between transition-all duration-200 relative group/cell select-none',
                  cardBg,
                  isToday && 'ring-2 ring-inset ring-[#014DA4] z-10 bg-[#014DA4]/2',
                  isFuture && !status && 'opacity-40 bg-slate-50/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs sm:text-sm font-black font-sans leading-none',
                    isToday ? 'text-[#014DA4]' : 'text-slate-800'
                  )}>
                    {cell.day}
                  </span>
                  
                  {isToday && (
                    <span className="text-[8px] font-extrabold bg-[#014DA4] text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90 sm:scale-100 origin-top-right shadow-3xs">
                      Today
                    </span>
                  )}
                </div>

                {status ? (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      {statusIcon}
                      <span className={cn('hidden sm:inline text-[9.5px] font-black uppercase tracking-wider', statusColorClass)}>
                        {statusLabel}
                      </span>
                    </div>
                    
                    {cell.record && cell.record.total_litres > 0 && status === 'delivered' && (
                      <span className="inline-flex text-[9px] sm:text-[11px] font-black text-emerald-700 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/15 max-w-fit">
                        {cell.record.total_litres}L
                      </span>
                    )}
                  </div>
                ) : (
                  !isFuture && (
                    <div className="text-[9.5px] font-bold text-slate-350 italic text-left leading-none mt-auto">
                      No entry
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Legend Card */}
      <motion.div variants={itemVariants} className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-between gap-4 md:px-2 text-slate-600">
          
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={12} className="text-emerald-600" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-wide">Delivered Daily Drop</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-rose-500/10 border border-rose-500/15 flex items-center justify-center flex-shrink-0">
              <SkipForward size={11} className="text-rose-500" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-wide">Skipped Delivery</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
              <Palmtree size={12} className="text-blue-550" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-wide">Vacation Pause</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock size={11} className="text-amber-600" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold tracking-wide">Pending Allocation</span>
          </div>

        </div>
      </motion.div>
    </motion.div>
  )
}
