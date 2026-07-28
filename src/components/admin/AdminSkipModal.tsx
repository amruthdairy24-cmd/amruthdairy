'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SkipForward, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AdminSkipModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  customerId: string
  customerName: string
}

interface SkipRequestItem {
  skip_date: string
}

interface CustomerSubscription {
  daily_rate?: number
  skip_requests?: SkipRequestItem[]
}

interface CustomerRecord {
  id: string
  subscription?: CustomerSubscription
}

interface CustomerSearchResponse {
  customers?: CustomerRecord[]
}

const getLocalISODate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const parseLocalISODate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getDateRange = (startDate: string, endDate: string) => {
  const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate]
  const dates: string[] = []
  const cursor = parseLocalISODate(from)
  const last = parseLocalISODate(to)

  while (cursor <= last) {
    dates.push(getLocalISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const formatRangeLabel = (startDate: string | null, endDate: string | null) => {
  if (!startDate) return 'No dates selected'
  const start = parseLocalISODate(startDate)

  if (!endDate) {
    return start.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const end = parseLocalISODate(endDate)
  return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function AdminSkipModal({ isOpen, onClose, onSuccess, customerId, customerName }: AdminSkipModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  const [subscription, setSubscription] = useState<CustomerSubscription | null>(null)
  const [existingSkips, setExistingSkips] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!isOpen || !customerId) return

    async function fetchData() {
      setLoadingData(true)
      setError(null)
      try {
        const subRes = await fetch(`/api/admin/customers?search=${customerId}`)
        if (subRes.ok) {
          const subData = (await subRes.json()) as CustomerSearchResponse
          const customer = subData.customers?.find((c) => c.id === customerId)
          if (customer?.subscription) {
            setSubscription(customer.subscription)
            const skips = customer.subscription.skip_requests || []
            setExistingSkips(skips.map((s) => s.skip_date))
          } else {
            setSubscription(null)
            setExistingSkips([])
          }
        }
      } catch {
        // If the lookup fails, keep the modal usable and let submission surface API errors.
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [isOpen, customerId])

  if (!isOpen) return null

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  maxDate.setHours(0, 0, 0, 0)

  const pickerDays: Date[] = []
  const startDay = new Date(tomorrow)
  startDay.setDate(startDay.getDate() + currentWeekOffset * 7)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDay)
    d.setDate(d.getDate() + i)
    if (d <= maxDate) pickerDays.push(d)
  }

  const skipDatesSet = new Set(existingSkips)
  const selectedDates = rangeStart ? getDateRange(rangeStart, rangeEnd ?? rangeStart) : []
  const totalCredit = selectedDates.length * (subscription?.daily_rate ?? 0)
  const selectedLabel = formatRangeLabel(rangeStart, rangeEnd)

  const handleDateClick = (dateStr: string) => {
    setError(null)
    setSuccessMsg(null)

    if (!rangeStart || rangeEnd) {
      setRangeStart(dateStr)
      setRangeEnd(null)
      return
    }

    if (dateStr < rangeStart) {
      setRangeStart(dateStr)
      setRangeEnd(null)
      return
    }

    setRangeEnd(dateStr)
  }

  const handleSubmit = async () => {
    if (!rangeStart) {
      setError('Please select at least one date to skip')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    const results: string[] = []
    const errors: string[] = []

    for (const dateStr of selectedDates) {
      try {
        const res = await fetch('/api/admin/customer-actions/skip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: customerId, skip_date: dateStr })
        })
        const data = await res.json()
        if (res.ok && data.success) {
          results.push(dateStr)
        } else {
          errors.push(`${dateStr}: ${data.message || 'Failed'}`)
        }
      } catch {
        errors.push(`${dateStr}: Network error`)
      }
    }

    setLoading(false)

    if (results.length > 0) {
      setSuccessMsg(`${results.length} skip${results.length > 1 ? 's' : ''} marked successfully!`)
      setRangeStart(null)
      setRangeEnd(null)
      setExistingSkips(prev => [...prev, ...results])
      toast.success(`Successfully added ${results.length} skip date(s)`)
      onSuccess()
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
      toast.error(errors[0])
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <SkipForward size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Mark Skip</h2>
                <p className="text-[11px] font-bold text-slate-500">{customerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-400">
                SELECT SKIP RANGE
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset(prev => Math.max(0, prev - 1))}
                  disabled={currentWeekOffset === 0}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-slate-900"
                >
                  <ChevronLeft size={13} className="text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset(prev => Math.min(3, prev + 1))}
                  disabled={pickerDays.length < 7}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-slate-900"
                >
                  <ChevronRight size={13} className="text-slate-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {pickerDays.map((date) => {
                const dateStr = getLocalISODate(date)
                const isAlreadySkipped = skipDatesSet.has(dateStr)
                const isPast = date < tomorrow
                const isDisabled = isAlreadySkipped || isPast
                const isRangeStart = rangeStart === dateStr
                const isRangeEnd = rangeEnd === dateStr
                const isInRange = rangeStart && rangeEnd ? dateStr > rangeStart && dateStr < rangeEnd : false

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDateClick(dateStr)}
                    className={cn(
                      'h-[76px] rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden select-none',
                      isRangeStart || isRangeEnd
                        ? 'border-[#014DA4] dark:border-blue-400 bg-[#014DA4]/5 dark:bg-blue-950/15 ring-1 ring-[#014DA4] dark:ring-blue-400 text-[#014DA4] dark:text-blue-400'
                        : isInRange
                          ? 'border-[#014DA4]/20 dark:border-blue-800/40 bg-[#014DA4]/5 dark:bg-blue-950/10 text-[#014DA4] dark:text-blue-400'
                          : isDisabled
                            ? 'border-slate-200/40 dark:border-slate-800/40 bg-slate-50/60 dark:bg-slate-950/30 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-55'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm'
                    )}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-wide">
                      {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className={cn(
                      'text-[18px] font-black leading-none',
                      isRangeStart || isRangeEnd || isInRange
                        ? 'text-[#014DA4] dark:text-blue-400'
                        : isDisabled
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-800 dark:text-slate-200'
                    )}>
                      {date.getDate()}
                    </span>
                    {isRangeStart && (
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#014DA4] rounded-bl-lg flex items-center justify-center">
                        <CheckCircle2 size={7} className="text-white" />
                      </div>
                    )}
                    {isRangeEnd && rangeEnd !== rangeStart && (
                      <div className="absolute top-0 left-0 w-3.5 h-3.5 bg-[#014DA4] rounded-br-lg flex items-center justify-center">
                        <CheckCircle2 size={7} className="text-white" />
                      </div>
                    )}
                    {isAlreadySkipped && (
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#014DA4] rounded-bl-lg flex items-center justify-center">
                        <SkipForward size={7} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedDates.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">
                    {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    {selectedLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">Credit</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +₹{totalCredit.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
              <CalendarDays size={12} />
              Click once to start a skip range, then click again to end it. Admin bypasses the 9 PM cutoff.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30 flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 flex gap-2">
                <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                {successMsg}
              </div>
            )}

            {loadingData && (
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Loading customer skip history...
              </p>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {successMsg ? 'Done' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !rangeStart}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : (
                  <>
                    <SkipForward size={14} />
                    {selectedDates.length > 0 ? `Confirm ${selectedDates.length} Skip${selectedDates.length > 1 ? 's' : ''}` : 'Confirm Skip'}
                  </>
                )
              }
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
