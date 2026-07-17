'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PlusCircle, Calendar, ShieldAlert, CheckCircle, Info, ChevronRight, ChevronLeft, Milk, Edit2, Trash2, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Modal } from '@/components/ui'
import { useDashboardData } from '@/contexts/DashboardDataContext'

const getLocalISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
} as const

export default function ExtraMilkPage() {
  const { data, loading: contextLoading, refetch } = useDashboardData()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [dailyRate, setDailyRate] = useState(82.6667)
  const [baseQty, setBaseQty] = useState(1.0)

  const [orderDate, setOrderDate] = useState('')
  const [extraLitres, setExtraLitres] = useState<number>(0.5)
  const [estimatedCharge, setEstimatedCharge] = useState(0)

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [upcomingExtras, setUpcomingExtras] = useState<any[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // Credit calculation states
  const [totalMonthCredits, setTotalMonthCredits] = useState(0)
  const [creditsUsedByOthers, setCreditsUsedByOthers] = useState(0)
  const [availableCredit, setAvailableCredit] = useState(0)
  const [creditApplied, setCreditApplied] = useState(0)
  const [netCharge, setNetCharge] = useState(0)

  // Raw data from dashboard
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Hybrid Date Picker states and configurations
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const tomorrowStr = useMemo(() => getLocalISODate(tomorrow), [tomorrow])

  const [calendarYear, setCalendarYear] = useState(tomorrow.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(tomorrow.getMonth() + 1) // 1-indexed

  const MONTH_NAMES = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], [])
  const DAY_NAMES = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], [])

  const [capacityMap, setCapacityMap] = useState<Record<string, { has_capacity: boolean }>>({})
  const [loadingCalendarCapacity, setLoadingCalendarCapacity] = useState(false)

  // Pre-fetch capacities for current month and next month to cover the quick picker dates
  useEffect(() => {
    if (!dashboardData?.subscription) return

    async function prefetchCapacities() {
      try {
        const d1 = new Date(tomorrow)
        const month1 = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}`

        const d2 = new Date(tomorrow)
        d2.setMonth(d2.getMonth() + 1)
        const month2 = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`

        const [res1, res2] = await Promise.all([
          fetch(`/api/subscription/capacity-month?month=${month1}&litres=${extraLitres}`),
          fetch(`/api/subscription/capacity-month?month=${month2}&litres=${extraLitres}`)
        ])

        const [data1, data2] = await Promise.all([res1.json(), res2.json()])

        setCapacityMap(prev => ({
          ...prev,
          ...(data1.success ? data1.capacities : {}),
          ...(data2.success ? data2.capacities : {})
        }))
      } catch (err) {
        console.error('Failed to prefetch capacities', err)
      }
    }
    prefetchCapacities()
  }, [dashboardData, extraLitres, tomorrow])

  // Fetch capacity map for the currently viewed calendar month
  useEffect(() => {
    if (!dashboardData?.subscription) return

    async function fetchCalendarCapacity() {
      setLoadingCalendarCapacity(true)
      try {
        const monthStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}`
        const res = await fetch(`/api/subscription/capacity-month?month=${monthStr}&litres=${extraLitres}`)
        const data = await res.json()
        if (data.success) {
          setCapacityMap(prev => ({
            ...prev,
            ...data.capacities
          }))
        }
      } catch (err) {
        console.error('Failed to fetch calendar capacities', err)
      } finally {
        setLoadingCalendarCapacity(false)
      }
    }
    fetchCalendarCapacity()
  }, [calendarYear, calendarMonth, dashboardData, extraLitres])

  const getEndOfMonth = useCallback((monthStr: string | null) => {
    if (!monthStr) return null
    const parts = monthStr.split('-')
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    return new Date(year, month, 0, 23, 59, 59, 999)
  }, [])

  const subscriptionStart = useMemo(() => {
    return dashboardData?.subscription ? new Date(dashboardData.subscription.start_date) : tomorrow
  }, [dashboardData, tomorrow])

  const latestPaidMonth = useMemo(() => {
    return dashboardData?.latest_paid_month || null
  }, [dashboardData])

  const latestPaidMonthEnd = useMemo(() => {
    return getEndOfMonth(latestPaidMonth)
  }, [latestPaidMonth, getEndOfMonth])

  // Get the next 7 valid delivery dates within the active subscription period
  const quickDates = useMemo(() => {
    if (!dashboardData?.subscription || !latestPaidMonth) return []
    const endOfPaid = latestPaidMonthEnd
    if (!endOfPaid) return []

    const dates = []
    const cur = new Date(tomorrow)
    const startObj = subscriptionStart

    // Scan up to 60 days ahead
    for (let i = 0; i < 60; i++) {
      const isWithinSub = cur >= startObj && cur <= endOfPaid
      if (isWithinSub) {
        dates.push(new Date(cur))
      }
      if (dates.length >= 7) break
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }, [dashboardData, latestPaidMonth, latestPaidMonthEnd, tomorrow, subscriptionStart])

  // Memoized sets for quick lookup
  const existingExtraDatesSet = useMemo(() => new Set(upcomingExtras.map(e => e.order_date)), [upcomingExtras])
  const skippedDatesSet = useMemo(() => new Set((dashboardData?.upcoming_skips || []).map((s: any) => s.skip_date)), [dashboardData])
  const vacation = dashboardData?.active_vacation

  const isWithinVacation = useCallback((dateStr: string) => {
    if (!vacation) return false
    return dateStr >= vacation.pause_start && dateStr <= vacation.pause_end
  }, [vacation])

  const getAllDatesInMonth = useCallback((year: number, month: number) => {
    const date = new Date(year, month - 1, 1)
    const dates = []
    while (date.getMonth() === month - 1) {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
      date.setDate(date.getDate() + 1)
    }
    return dates
  }, [])

  const calendarDates = useMemo(() => {
    return getAllDatesInMonth(calendarYear, calendarMonth)
  }, [calendarYear, calendarMonth, getAllDatesInMonth])

  const firstDayOfWeek = useMemo(() => {
    return new Date(calendarYear, calendarMonth - 1, 1).getDay()
  }, [calendarYear, calendarMonth])

  const goToPrevCalendarMonth = useCallback(() => {
    if (calendarMonth === 1) {
      setCalendarMonth(12)
      setCalendarYear(y => y - 1)
    } else {
      setCalendarMonth(m => m - 1)
    }
  }, [calendarMonth])

  const goToNextCalendarMonth = useCallback(() => {
    if (calendarMonth === 12) {
      setCalendarMonth(1)
      setCalendarYear(y => y + 1)
    } else {
      setCalendarMonth(m => m + 1)
    }
  }, [calendarMonth])

  const canGoPrevCalendar = useMemo(() => {
    const startM = tomorrow.getMonth() + 1
    const startY = tomorrow.getFullYear()
    return calendarYear > startY || (calendarYear === startY && calendarMonth > startM)
  }, [calendarYear, calendarMonth, tomorrow])

  const canGoNextCalendar = useMemo(() => {
    const startM = tomorrow.getMonth() + 1
    const startY = tomorrow.getFullYear()
    const maxDate = new Date(startY, startM - 1 + 3, 1) // 3 months ahead
    const currentDate = new Date(calendarYear, calendarMonth - 1, 1)
    return currentDate < maxDate
  }, [calendarYear, calendarMonth, tomorrow])

  const isViewMonthAfterPaid = useMemo(() => {
    if (!latestPaidMonth) return false
    const viewMonthStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-01`
    const paidMonthStr = `${latestPaidMonth.substring(0, 7)}-01`
    return viewMonthStr > paidMonthStr
  }, [calendarYear, calendarMonth, latestPaidMonth])

  const viewMonthName = MONTH_NAMES[calendarMonth - 1]

  // Group available credits by month
  const creditsByMonth = useMemo(() => {
    const credits: { [month: string]: number } = {}
    if (dashboardData && !editingOrderId) {
      const adjustments = dashboardData.upcoming_adjustments || []
      const existingExtras = dashboardData.upcoming_extras || []

      adjustments.forEach((a: any) => {
        if (a.adjustment_type === 'skip_credit' || a.adjustment_type === 'vacation_credit') {
          credits[a.target_month] = (credits[a.target_month] || 0) + Number(a.amount)
        }
      })

      existingExtras.forEach((e: any) => {
        const eDate = new Date(e.order_date)
        eDate.setMonth(eDate.getMonth() + 1)
        eDate.setDate(1)
        const eMonth = eDate.toISOString().split('T')[0]
        credits[eMonth] = Math.max(0, (credits[eMonth] || 0) - Number(e.skip_credit_applied || 0))
      })
    }
    return credits
  }, [dashboardData, editingOrderId])

  // Calculate breakdown for selected bulk dates
  const datesBreakdown = useMemo(() => {
    const creditsCopy = { ...creditsByMonth }
    return selectedDates.map(dateStr => {
      const charge = extraLitres > 0 ? Math.round((dailyRate * (extraLitres / baseQty)) * 100) / 100 : 0

      const chargeDateObj = new Date(dateStr)
      chargeDateObj.setMonth(chargeDateObj.getMonth() + 1)
      chargeDateObj.setDate(1)
      const chargeMonth = chargeDateObj.toISOString().split('T')[0]

      const available = creditsCopy[chargeMonth] || 0
      const applied = Math.min(charge, available)

      creditsCopy[chargeMonth] = Math.max(0, available - applied)
      const net = charge - applied

      return { dateStr, charge, applied, net }
    })
  }, [selectedDates, extraLitres, dailyRate, baseQty, creditsByMonth])

  const totalCharge = useMemo(() => datesBreakdown.reduce((sum, d) => sum + d.charge, 0), [datesBreakdown])
  const totalApplied = useMemo(() => datesBreakdown.reduce((sum, d) => sum + d.applied, 0), [datesBreakdown])
  const totalNet = useMemo(() => datesBreakdown.reduce((sum, d) => sum + d.net, 0), [datesBreakdown])

  useEffect(() => {
    if (data && data.subscription) {
      setDailyRate(data.subscription.daily_rate)
      setBaseQty(data.subscription.quantity_litres || 1.0)
      setUpcomingExtras(data.upcoming_extras || [])
      setDashboardData(data)
      setPageLoading(false)
    } else if (!contextLoading) {
      setPageLoading(false)
    }
  }, [data, contextLoading])

  async function loadData(silent = false) {
    await refetch()
  }

  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setOrderDate(tomorrow.toISOString().split('T')[0])
  }, [])

  // Recalculate charges and credits whenever date, quantity, or edit mode changes
  useEffect(() => {
    if (baseQty <= 0 || !orderDate) return

    const charge = extraLitres > 0 ? Math.round((dailyRate * (extraLitres / baseQty)) * 100) / 100 : 0
    setEstimatedCharge(charge)

    if (dashboardData) {
      const chargeDateObj = new Date(orderDate)
      chargeDateObj.setMonth(chargeDateObj.getMonth() + 1)
      chargeDateObj.setDate(1)
      const chargeMonth = chargeDateObj.toISOString().split('T')[0]

      const adjustments = dashboardData.upcoming_adjustments || []
      const monthCredits = adjustments
        .filter((a: any) => (a.adjustment_type === 'skip_credit' || a.adjustment_type === 'vacation_credit') && a.target_month === chargeMonth)
        .reduce((sum: number, a: any) => sum + Number(a.amount), 0)

      const usedCredits = (dashboardData.upcoming_extras || [])
        .filter((e: any) => {
          const eDate = new Date(e.order_date)
          eDate.setMonth(eDate.getMonth() + 1)
          eDate.setDate(1)
          const eMonth = eDate.toISOString().split('T')[0]
          return eMonth === chargeMonth && e.id !== editingOrderId
        })
        .reduce((sum: number, e: any) => sum + Number(e.skip_credit_applied || 0), 0)

      setTotalMonthCredits(monthCredits)
      setCreditsUsedByOthers(usedCredits)

      const available = Math.max(0, monthCredits - usedCredits)
      setAvailableCredit(available)

      const applied = Math.min(charge, available)
      setCreditApplied(applied)
      setNetCharge(charge - applied)
    }
  }, [extraLitres, dailyRate, baseQty, orderDate, dashboardData, editingOrderId])

  function handleFormSubmit(e: React.FormEvent) {
    if (e) e.preventDefault()

    if (editingOrderId) {
      if (!orderDate) return setError('Please choose a date.')
    } else {
      if (selectedDates.length === 0) {
        setError('Please select at least one date on the calendar.')
        return
      }
    }

    setError('')
    setSuccessMsg('')
    setIsConfirmOpen(true)
  }

  async function executeSubmit() {
    setIsConfirmOpen(false)
    setError(''); setSuccessMsg(''); setLoading(true)

    if (editingOrderId) {
      if (!orderDate || (extraLitres === undefined)) return setError('Please choose a date and quantity.')

      try {
        const res = await fetch('/api/extra-milk/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: editingOrderId,
            order_date: orderDate,
            extra_litres: extraLitres
          })
        })
        const json = await res.json()
        if (json.success) {
          setSuccessMsg(json.message)
          await loadData(true)
          setEditingOrderId(null)
          setExtraLitres(0.5)
        } else {
          setError(json.message || 'Failed to update extra milk')
        }
      } catch (err) {
        setError('Network error submitting request')
      } finally {
        setLoading(false)
      }
      return
    }

    // BULK MODE
    try {
      let successCount = 0
      let lastError = ''

      for (const dateStr of selectedDates) {
        const res = await fetch('/api/extra-milk/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_date: dateStr,
            extra_litres: extraLitres
          })
        })
        const json = await res.json()
        if (json.success) {
          successCount++
        } else {
          lastError = json.message || `Failed for ${dateStr}`
        }
      }

      if (successCount === selectedDates.length) {
        setSuccessMsg(`Successfully ordered extra milk for ${successCount} date(s).`)
        setSelectedDates([])
        await loadData(true)
      } else if (successCount > 0) {
        setError(`Ordered for ${successCount} date(s), but failed for some: ${lastError}`)
        await loadData(true)
      } else {
        setError(`Failed to place orders: ${lastError}`)
      }
    } catch (err) {
      setError('Network error submitting request')
    } finally {
      setLoading(false)
    }
  }

  async function executeCancelOrder() {
    if (!editingOrderId || !orderDate) return
    setIsCancelConfirmOpen(false)
    setError(''); setSuccessMsg(''); setLoading(true)
    try {
      const res = await fetch('/api/extra-milk/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: editingOrderId,
          order_date: orderDate,
          extra_litres: 0
        })
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message)
        await loadData(true)
        setEditingOrderId(null)
        setExtraLitres(0.5)
      } else {
        setError(json.message || 'Failed to cancel order')
      }
    } catch (err) {
      setError('Network error submitting cancellation request')
    } finally {
      setLoading(false)
    }
  }

  const isCutoffPassed = new Date().getHours() >= 21

  if (pageLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
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
      className="w-full space-y-8 relative"
    >
      {/* Header section with Premium Gradient Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-[#014DA4] to-indigo-650 p-6 sm:p-8 text-white shadow-lg border border-blue-600/20"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[10.5px] font-extrabold uppercase tracking-wider backdrop-blur-md">
              <Milk size={12} className="text-blue-200 animate-pulse" /> Extra Milk Service
            </span>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-none">
              {editingOrderId ? 'Edit Extra Order' : 'Schedule Extra Milk'}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-blue-105/90 max-w-xl">
              Need extra milk for hosting guests, making desserts, or everyday use? Easily schedule one-time extra portions with automatic billing skip-credits offset.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 h-11 rounded-xl bg-white text-slate-800 hover:bg-slate-50 font-black text-xs shadow-sm transition-all duration-200 cursor-pointer self-start md:self-center hover:scale-[1.03] active:scale-[0.98]"
          >
            Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column: Form Card */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-5">
          {upcomingExtras.length > 0 && !editingOrderId && (
            <div className="bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-950/40 border border-slate-205/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 select-none uppercase tracking-wider">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Calendar size={15} />
                </div>
                Upcoming Scheduled Extra Milk
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {upcomingExtras.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm shadow-3xs hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-205">
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                        {new Date(order.order_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5">
                        <Milk size={12} />
                        <span>+{order.extra_litres}L Order</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          (₹{Number(order.net_charge_amount || 0).toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingOrderId(order.id)
                        setOrderDate(order.order_date)
                        setExtraLitres(order.extra_litres)
                        setError(''); setSuccessMsg('')
                      }}
                      className="px-3.5 h-8 rounded-lg bg-[#014DA4]/5 hover:bg-[#014DA4]/10 text-[#014DA4] dark:text-blue-450 text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} className="stroke-[2.5]" /> Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            {editingOrderId && (
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/50" />
            )}

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-[16px] font-bold text-slate-850 dark:text-white tracking-tight flex items-center gap-2">
                {editingOrderId ? <><Edit2 size={16} className="text-amber-500" /> Editing Order</> : 'One-Time Order'}
              </h2>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-md">
                Base Quantity: {baseQty} L
              </span>
            </div>

            {/* Delivery Date Selection */}
            {editingOrderId ? (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-slate-450 uppercase tracking-[2.5px] pl-0.5 select-none">Editing Order Date</label>
                <div className="flex items-center h-12 rounded-xl border border-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-3.5 gap-2.5 font-bold text-slate-705 dark:text-slate-300">
                  <Calendar size={16} />
                  <span>{new Date(orderDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pl-0.5">
                  <label className="text-[11px] font-extrabold text-slate-455 uppercase tracking-[2px] select-none">Choose Delivery Dates</label>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(true)}
                    className="text-xs font-black text-[#014DA4] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer select-none"
                  >
                    <CalendarDays size={14} />
                    <span>Choose Another Date</span>
                  </button>
                </div>

                {/* Quick Date Picker: Next 7 valid dates */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {quickDates.map((date) => {
                    const dateStr = getLocalISODate(date)
                    const isSelected = selectedDates.includes(dateStr)

                    const isAlreadyOrdered = existingExtraDatesSet.has(dateStr)
                    const isSkipped = skippedDatesSet.has(dateStr)
                    const isVacation = isWithinVacation(dateStr)
                    const isTomorrow = dateStr === tomorrowStr
                    const isCutoff = isTomorrow && isCutoffPassed
                    const isFull = capacityMap[dateStr]?.has_capacity === false

                    const isDisabled = isAlreadyOrdered || isSkipped || isVacation || isCutoff || isFull

                    let statusText = ""
                    let badgeColor = ""
                    if (isAlreadyOrdered) { statusText = "Ordered"; badgeColor = "bg-emerald-500 text-white" }
                    else if (isFull) { statusText = "Full"; badgeColor = "bg-rose-500 text-white" }
                    else if (isSkipped) { statusText = "Skipped"; badgeColor = "bg-rose-500 text-white" }
                    else if (isVacation) { statusText = "Vacation"; badgeColor = "bg-amber-500 text-white" }
                    else if (isCutoff) { statusText = "Closed"; badgeColor = "bg-slate-400 text-white" }

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedDates(prev =>
                            prev.includes(dateStr)
                              ? prev.filter(d => d !== dateStr)
                              : [...prev, dateStr]
                          )
                          setError('')
                          setSuccessMsg('')
                        }}
                        className={cn(
                          'h-20 sm:h-[84px] rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 relative overflow-hidden select-none hover:scale-[1.03] active:scale-[0.97]',
                          isSelected
                            ? 'border-[#014DA4] dark:border-blue-450 bg-[#014DA4]/5 dark:bg-blue-955/20 ring-2 ring-[#014DA4]/50 dark:ring-blue-400/50 text-[#014DA4] dark:text-blue-450 shadow-md shadow-blue-500/5'
                            : isDisabled
                              ? 'border-border/30 dark:border-slate-800/45 bg-slate-50/75 dark:bg-slate-950/40 text-slate-355 dark:text-slate-650 cursor-not-allowed opacity-65'
                              : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 text-slate-550 dark:text-slate-305 cursor-pointer shadow-3xs'
                        )}
                      >
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider opacity-75">
                          {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                        <span className={cn(
                          "text-xl font-black leading-none",
                          isSelected ? "text-[#014DA4] dark:text-blue-450" : (isDisabled ? "text-slate-300 dark:text-slate-650" : "text-slate-800 dark:text-slate-205")
                        )}>
                          {date.getDate()}
                        </span>

                        {statusText && (
                          <span className={cn("absolute bottom-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md scale-90", badgeColor)}>
                            {statusText}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Selected Dates Chips for review */}
                {selectedDates.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest pl-0.5">Selected Dates Summary ({selectedDates.length})</span>
                    <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-1">
                      {selectedDates.map(dateStr => {
                        const dateObj = new Date(dateStr)
                        return (
                          <div
                            key={dateStr}
                            className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/50"
                          >
                            <span>{dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedDates(prev => prev.filter(d => d !== dateStr))}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-650 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extra Litre Options */}
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-extrabold text-slate-455 uppercase tracking-[2px] pl-0.5 select-none">Choose Extra Litres</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  {
                    qty: 0.5, label: "Single Cup", desc: "For tea/coffee", icon: (
                      <div className="w-8 h-10 border-2 border-current rounded-b-lg rounded-t-sm flex items-end justify-center p-0.5">
                        <div className="w-full h-1/2 bg-current rounded-b-[4px] opacity-60" />
                      </div>
                    )
                  },
                  {
                    qty: 1.0, label: "Daily Bottle", desc: "For small families", icon: (
                      <div className="w-7 h-12 border-2 border-current rounded-lg flex flex-col items-center justify-end p-0.5 relative">
                        <div className="w-3.5 h-1.5 border-b-2 border-current" />
                        <div className="w-full h-2/3 bg-current rounded-b-[4px] opacity-70" />
                      </div>
                    )
                  },
                  {
                    qty: 1.5, label: "Medium Pack", desc: "For desserts & baking", icon: (
                      <div className="w-8 h-11 border-2 border-current rounded-md flex items-end p-0.5 relative">
                        <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-4 h-1 bg-current" />
                        <div className="w-full h-3/4 bg-current rounded-[2px] opacity-80" />
                      </div>
                    )
                  },
                  {
                    qty: 2.0, label: "Family Jug", desc: "Large daily needs", icon: (
                      <div className="w-10 h-12 border-2 border-current rounded-lg flex items-end justify-center p-0.5 relative">
                        <div className="absolute top-[-3px] w-4 h-1.5 bg-current rounded-t-sm" />
                        <div className="absolute right-[-4px] top-3 w-2.5 h-6 border-2 border-current rounded-r-md border-l-0" />
                        <div className="w-full h-4/5 bg-current rounded-[4px] opacity-90" />
                      </div>
                    )
                  }
                ].map(({ qty, label, desc, icon }) => {
                  const isSelected = extraLitres === qty
                  return (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => { setExtraLitres(qty); setError(''); setSuccessMsg('') }}
                      className={cn(
                        'h-[110px] rounded-3xl border flex flex-col items-center justify-between p-3.5 transition-all select-none hover:scale-[1.03] active:scale-[0.97] cursor-pointer text-center relative overflow-hidden',
                        isSelected
                          ? 'border-[#014DA4] dark:border-blue-400 bg-[#014DA4]/5 dark:bg-blue-950/15 ring-2 ring-[#014DA4] dark:ring-blue-400 text-[#014DA4] dark:text-blue-450 font-bold shadow-md shadow-blue-500/5'
                          : 'border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 shadow-3xs'
                      )}
                    >
                      <div className={cn(
                        "transition-colors",
                        isSelected ? "text-[#014DA4] dark:text-blue-450" : "text-slate-400 dark:text-slate-555"
                      )}>
                        {icon}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className={cn(
                          "text-base font-black leading-none",
                          isSelected ? "text-[#014DA4] dark:text-blue-450" : "text-slate-800 dark:text-slate-200"
                        )}>
                          +{qty}L
                        </span>
                        <span className="text-[9px] font-extrabold uppercase opacity-85">{label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Details Preview */}
            {extraLitres > 0 && (
              editingOrderId ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 text-[13.5px] font-bold text-slate-655 dark:text-slate-455 shadow-3xs"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Your Regular Delivery:</span>
                    <span className="font-extrabold text-slate-805 dark:text-slate-200">{baseQty} Litres</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-550 font-semibold">Selected Extra Quantity:</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">+{extraLitres} Litres</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-550 flex items-center gap-1.5 font-semibold">
                      <Info size={14} className="text-slate-455" /> Estimated Extra Charge:
                    </span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono font-black">₹{estimatedCharge.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-550 flex items-center gap-1.5 font-semibold">
                      <CheckCircle size={14} className="text-emerald-505" /> Available Skip Credit:
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-450 font-mono font-black">-₹{creditApplied.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 dark:text-slate-202 font-black">Net Additional Charge:</span>
                    <span className="font-extrabold text-[#014DA4] dark:text-blue-400 font-mono text-base font-black">₹{netCharge.toFixed(2)}</span>
                  </div>
                </motion.div>
              ) : (
                selectedDates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 dark:bg-slate-950/30 border border-slate-105 dark:border-slate-800/80 rounded-2xl p-5 space-y-3.5 text-[13.5px] font-bold text-slate-655 dark:text-slate-455 shadow-3xs"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-555 font-semibold">Selected Dates:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-205 text-right">{selectedDates.length} Days Selected</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-555 font-semibold">Extra Quantity (per day):</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">+{extraLitres} Litres</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-555 font-semibold">Total Gross Charge:</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono font-black">₹{totalCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                        <CheckCircle size={14} className="text-emerald-500" /> Total Skip Credit Offset:
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-450 font-mono font-black">-₹{totalApplied.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-850 dark:text-slate-202 font-black">Total Net Charge:</span>
                      <span className="font-extrabold text-[#014DA4] dark:text-blue-400 font-mono text-base font-black">₹{totalNet.toFixed(2)}</span>
                    </div>

                    {/* Visual date breakdown list */}
                    <div className="pt-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 select-none">Cost breakdown per date</p>
                      <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                        {datesBreakdown.map(d => (
                          <div key={d.dateStr} className="flex justify-between text-xs font-semibold py-1 border-b border-slate-100 dark:border-slate-900/60">
                            <span className="text-slate-555 dark:text-slate-450">
                              {new Date(d.dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              ₹{d.charge.toFixed(2)} {d.applied > 0 && <span className="text-emerald-650 text-[10px]">(-₹{d.applied.toFixed(2)})</span>} = <span className="font-bold">₹{d.net.toFixed(2)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              )
            )}

            {/* Notifications */}
            {error && (
              <p className="text-xs text-rose-605 font-bold flex items-center gap-2 pl-1">
                <ShieldAlert size={14} className="text-rose-500" />
                <span>{error}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-650 font-bold flex items-center gap-2 pl-1">
                <CheckCircle size={14} className="text-emerald-505" />
                <span>{successMsg}</span>
              </p>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || (editingOrderId ? !orderDate : selectedDates.length === 0)}
                className="flex-1 h-12 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] duration-150"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {editingOrderId ? <Edit2 size={14} className="stroke-[2.5]" /> : <PlusCircle size={14} className="stroke-[2.5]" />}
                    <span>{editingOrderId ? 'Update Order' : `Confirm Extra Order (${selectedDates.length} Days)`}</span>
                  </>
                )}
              </button>

              {editingOrderId && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsCancelConfirmOpen(true)}
                  className="h-12 px-5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-455 font-extrabold text-xs shadow-sm transition-all border border-rose-100 dark:border-rose-900/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Trash2 size={16} />
                  <span>Cancel Order</span>
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Right Column: Rules & Guidelines */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">

          {/* Rules Card */}
          <div className="bg-gradient-to-br from-white to-slate-50/40 dark:from-slate-900 dark:to-slate-950/40 border border-slate-205/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-[2.5px] pl-0.5 select-none">Order Rules & Guidelines</h3>

            <div className="space-y-4 text-left leading-relaxed">
              <div className="flex gap-3.5 p-3 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800/45 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-all duration-200">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-mono font-black text-xs flex-shrink-0 select-none">1</div>
                <div>
                  <p className="font-extrabold text-slate-850 dark:text-slate-205 text-sm">9:00 PM Cut-off Time</p>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-normal font-semibold">Extra orders for tomorrow morning must be placed or edited before 9:00 PM tonight.</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800/45 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-all duration-200">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-650 flex items-center justify-center font-mono font-black text-xs flex-shrink-0 select-none">2</div>
                <div>
                  <p className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Skip Credit Integration</p>
                  <p className="text-xs text-slate-505 dark:text-slate-400 mt-1 leading-normal font-semibold">If you have any skip credits for the month, extra milk charges will be automatically offset, saving you money!</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800/45 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-all duration-200">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-650 flex items-center justify-center font-mono font-black text-xs flex-shrink-0 select-none">3</div>
                <div>
                  <p className="font-extrabold text-slate-855 dark:text-slate-202 text-sm">Farm Capacity Limit</p>
                  <p className="text-xs text-slate-505 dark:text-slate-400 mt-1 leading-normal font-semibold">Order confirmations are subject to milk capacity and availability. Early bookings secure allocation.</p>
                </div>
              </div>
            </div>

            {isCutoffPassed && (
              <div className="p-4 bg-rose-500/5 dark:bg-rose-955/20 border border-rose-100/55 dark:border-rose-900/30 rounded-2xl flex gap-3 shadow-3xs">
                <ShieldAlert className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-rose-700 dark:text-rose-455 uppercase tracking-wider">Cut-off Deadline Passed</h4>
                  <p className="text-[11px] text-rose-905 dark:text-rose-300 font-semibold leading-normal mt-1">It is past 9:00 PM. Extra orders for tomorrow morning's slot are closed. You can schedule extra milk for any subsequent dates.</p>
                </div>
              </div>
            )}
          </div>

        </motion.div>

      </div>

      <Modal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={editingOrderId ? "Confirm Order Update" : "Confirm Extra Milk Order"}
        size="md"
      >
        <div className="space-y-6 pt-2">
          {editingOrderId ? (
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-955/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-emerald-505/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={24} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1.5">
                  Delivery Date
                </p>
                <p className="text-base font-black text-slate-805 dark:text-slate-200">
                  {new Date(orderDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-955/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-805/80">
              <div className="w-12 h-12 rounded-xl bg-emerald-550/10 text-emerald-605 flex items-center justify-center flex-shrink-0">
                <CalendarDays size={24} className="stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1.5">
                  Delivery Dates
                </p>
                <p className="text-base font-black text-slate-800 dark:text-slate-205">
                  {selectedDates.length} Days Selected
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3.5 bg-slate-50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 text-[13.5px] font-bold text-slate-655 dark:text-slate-400 shadow-3xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
              <span className="text-slate-555">Extra Quantity (per day):</span>
              <span className="font-extrabold text-slate-805 dark:text-slate-200">+{extraLitres} Litres</span>
            </div>

            {editingOrderId ? (
              <>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Gross Charge:</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono">₹{estimatedCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-555 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-505" /> Skip Credit Offset:
                  </span>
                  <span className="font-extrabold text-emerald-650 dark:text-emerald-450 font-mono">-₹{creditApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-805 dark:text-slate-202 font-black">Net Charge:</span>
                  <span className="font-extrabold text-[#014DA4] dark:text-blue-400 font-mono text-base font-black">₹{netCharge.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Total Gross Charge:</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono">₹{totalCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-555 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-500" /> Total Credit Offset:
                  </span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">-₹{totalApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-850 dark:text-slate-202 font-black">Total Net Charge:</span>
                  <span className="font-extrabold text-[#014DA4] dark:text-blue-400 font-mono text-base font-black">₹{totalNet.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {!editingOrderId && selectedDates.length > 1 && (
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Cost breakdown per date</p>
              <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-1">
                {datesBreakdown.map(d => (
                  <div key={d.dateStr} className="flex justify-between text-xs font-semibold py-1 border-b border-slate-105 dark:border-slate-900/60">
                    <span className="text-slate-555 dark:text-slate-455">
                      {new Date(d.dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                      ₹{d.charge.toFixed(2)} {d.applied > 0 && <span className="text-emerald-650 text-[10px]">(-₹{d.applied.toFixed(2)})</span>} = <span className="font-bold">₹{d.net.toFixed(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-505 dark:text-slate-405 font-semibold text-center leading-relaxed max-w-sm mx-auto">
            Please note: confirmed extra milk orders will be delivered along with your regular milk portion. Additional charges will be settled on your next statement.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="px-5 h-11 rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeSubmit}
              disabled={loading}
              className="px-6 h-11 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle size={14} className="stroke-[2.5]" />
                  <span>Confirm Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title="Cancel Extra Milk Order"
        size="md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-4 bg-rose-50 dark:bg-rose-955/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Trash2 size={24} className="stroke-[2.5]" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-rose-505 dark:text-rose-455 uppercase tracking-widest leading-none mb-1.5">
                Confirm Cancellation
              </p>
              <p className="text-sm font-extrabold text-slate-855 dark:text-slate-205">
                Are you sure you want to cancel the extra milk order for {new Date(orderDate || Date.now()).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}?
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            This action will release the booked delivery capacity and remove the additional charge from your billing statement.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsCancelConfirmOpen(false)}
              className="px-5 h-11 rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              No, Keep Order
            </button>
            <button
              type="button"
              onClick={executeCancelOrder}
              disabled={loading}
              className="px-6 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={14} className="stroke-[2.5]" />
                  <span>Yes, Cancel Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Calendar Selection Modal */}
      <Modal
        open={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        title="Choose Delivery Dates"
        size="md"
      >
        <div className="space-y-6 pt-2">
          {/* Calendar Header with Prev/Next month navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevCalendarMonth}
              disabled={!canGoPrevCalendar}
              className="w-9 h-9 rounded-xl border border-slate-205 dark:border-slate-800 hover:border-[#014DA4] dark:hover:border-blue-500 flex items-center justify-center text-slate-550 dark:text-slate-400 hover:text-[#014DA4] dark:hover:text-white hover:bg-blue-50/30 dark:hover:bg-blue-955/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-base"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-205 min-w-36 text-center font-display flex items-center justify-center gap-2 select-none">
              {loadingCalendarCapacity && <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />}
              {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
            </span>
            <button
              type="button"
              onClick={goToNextCalendarMonth}
              disabled={!canGoNextCalendar}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#014DA4] dark:hover:border-blue-500 flex items-center justify-center text-slate-555 dark:text-slate-450 hover:text-[#014DA4] dark:hover:text-white hover:bg-blue-50/30 dark:hover:bg-blue-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-base"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Subscription warning message */}
          {isViewMonthAfterPaid && (
            <div className="p-3.5 bg-rose-500/5 dark:bg-rose-955/20 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl flex gap-3 shadow-3xs">
              <ShieldAlert className="text-rose-505 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-left">
                <p className="text-xs text-rose-700 dark:text-rose-455 font-bold leading-normal">
                  Renew your {viewMonthName} subscription to order Extra Milk for {viewMonthName} deliveries.
                </p>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-555 pb-1 border-b border-slate-100 dark:border-slate-900/60 select-none">
              {DAY_NAMES.map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells before the 1st of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-transparent rounded-xl border border-transparent" />
              ))}

              {/* Days in Month */}
              {calendarDates.map((dateStr) => {
                const dateObj = new Date(dateStr)
                const day = dateObj.getDate()
                const isSelected = selectedDates.includes(dateStr)

                const isAlreadyOrdered = existingExtraDatesSet.has(dateStr)
                const isSkipped = skippedDatesSet.has(dateStr)
                const isVacation = isWithinVacation(dateStr)
                const isTomorrow = dateStr === tomorrowStr
                const isCutoff = isTomorrow && isCutoffPassed
                const isFull = capacityMap[dateStr]?.has_capacity === false

                // Active subscription bounds check
                const isPast = dateObj < tomorrow
                const isOutsideSub = latestPaidMonthEnd && dateObj > latestPaidMonthEnd
                const isBeforeSubStart = dateObj < subscriptionStart

                const isDisabled = isPast || isOutsideSub || isBeforeSubStart || isAlreadyOrdered || isSkipped || isVacation || isCutoff || isFull

                let badgeText = ""
                let badgeColor = ""
                if (isAlreadyOrdered) { badgeText = "ORDERED"; badgeColor = "bg-emerald-500 text-white" }
                else if (isFull) { badgeText = "FULL"; badgeColor = "bg-rose-500 text-white" }
                else if (isSkipped) { badgeText = "SKIPPED"; badgeColor = "bg-rose-500 text-white" }
                else if (isVacation) { badgeText = "VACATION"; badgeColor = "bg-amber-400 text-white" }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedDates(prev =>
                        prev.includes(dateStr)
                          ? prev.filter(d => d !== dateStr)
                          : [...prev, dateStr]
                      )
                      setError('')
                      setSuccessMsg('')
                    }}
                    className={cn(
                      'aspect-square rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all select-none relative hover:scale-[1.05] active:scale-[0.95]',
                      isSelected
                        ? 'border-[#014DA4] dark:border-blue-450 bg-[#014DA4]/5 dark:bg-blue-955/20 ring-2 ring-[#014DA4]/50 dark:ring-blue-400/50 text-[#014DA4] dark:text-blue-450 font-black shadow-md'
                        : isDisabled
                          ? 'border-border/30 dark:border-slate-800/40 bg-slate-55/60 dark:bg-slate-950/30 text-slate-350 dark:text-slate-700 cursor-not-allowed opacity-55'
                          : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 text-slate-705 dark:text-slate-300 font-bold cursor-pointer shadow-3xs'
                    )}
                  >
                    <span className="text-sm">{day}</span>
                    {badgeText && (
                      <span className={cn('absolute bottom-1 text-[6.5px] font-black uppercase px-1 rounded-sm tracking-tight scale-90', badgeColor)}>
                        {badgeText}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="px-5 h-11 rounded-xl bg-[#014DA4] text-white hover:bg-[#014DA4]/90 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Done Selecting ({selectedDates.length})
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
