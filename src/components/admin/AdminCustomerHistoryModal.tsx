'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, History, Calendar, CreditCard, Truck, AlertCircle,
  FileText, CheckCircle2, Clock, Milk, Gift, ChevronRight,
  ArrowUpRight, RefreshCw, Layers, Phone, MapPin, UserCheck,
  MessageCircle, SkipForward, AlertTriangle, ChevronLeft, CalendarDays,
  Settings, Droplets
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminMarkPaidModal } from './AdminMarkPaidModal'
import { AdminSubscriptionModal } from './AdminSubscriptionModal'
import { AdminSkipModal } from './AdminSkipModal'
import { AdminExtraMilkModal } from './AdminExtraMilkModal'

interface AdminCustomerHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
  customerName: string
  initialTab?: 'subscription' | 'deliveries' | 'bills' | 'payments' | 'adjustments'
}

export function AdminCustomerHistoryModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  initialTab = 'subscription'
}: AdminCustomerHistoryModalProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'subscription' | 'deliveries' | 'bills' | 'payments' | 'adjustments'>(initialTab || 'subscription')
  const [historyData, setHistoryData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSubActionModal, setActiveSubActionModal] = useState<'subscription' | 'skip' | 'extra' | null>(null)

  // Delivery view month filter
  const [selectedDeliveryMonth, setSelectedDeliveryMonth] = useState<string>('')
  const [showMarkPaid, setShowMarkPaid] = useState(false)
  const [markPaidTargetMonth, setMarkPaidTargetMonth] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab, isOpen])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/customers/${customerId}/history`)
      const data = await res.json()
      if (data.success) {
        setHistoryData(data)
        const now = new Date()
        const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        setSelectedDeliveryMonth((prev) => prev || curMonthStr)
      } else {
        setError(data.message || 'Failed to load customer history')
      }
    } catch (err: unknown) {
      setError('Network error loading customer history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !customerId) return
    fetchHistory()
  }, [isOpen, customerId])

  const profile = historyData?.profile
  const subscriptions = historyData?.subscriptions || []
  const billingMonths = historyData?.billing_months || []
  const payments = historyData?.payments || []
  const deliveries = historyData?.deliveries || []
  const skips = historyData?.skips || []
  const adjustments = historyData?.adjustments || []
  const paymentOverview = historyData?.payment_overview
  const deliverySummary = historyData?.delivery_summary || { total_delivered_days: 0, total_skipped_days: 0, total_litres_delivered: 0 }
  const paymentSummary = historyData?.payment_summary || { total_paid: 0, total_transactions: 0 }

  // Joined Date format
  const joinedDateStr = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown'

  const joinedDaysAgo = profile?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // WhatsApp Link
  const phoneDigits = (profile?.phone || '').replace(/\D/g, '')
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits}` : null

  // Current Subscription
  const activeSub = subscriptions.find((s: any) => ['active', 'pending_payment', 'paused'].includes(s.status)) || subscriptions[0] || null

  // Deliveries for selected month
  const availableDeliveryMonths = useMemo(() => {
    const monthsSet = new Set<string>()
    const now = new Date()
    monthsSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)

    if (profile?.created_at) {
      const startDate = new Date(profile.created_at)
      if (!isNaN(startDate.getTime())) {
        const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 1)
        while (cur <= end) {
          monthsSet.add(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`)
          cur.setMonth(cur.getMonth() + 1)
        }
      }
    }

    billingMonths.forEach((bm: any) => {
      if (bm.billing_month) monthsSet.add(bm.billing_month)
    })
    deliveries.forEach((d: any) => {
      if (d.delivery_date) {
        const parts = d.delivery_date.split('-')
        if (parts.length >= 2) monthsSet.add(`${parts[0]}-${parts[1]}-01`)
      }
    })
    return Array.from(monthsSet).sort().reverse()
  }, [profile, billingMonths, deliveries])

  const filteredDeliveries = useMemo(() => {
    if (!selectedDeliveryMonth) return deliveries
    const [y, m] = selectedDeliveryMonth.split('-')
    const prefix = `${y}-${m}`
    return deliveries.filter((d: any) => d.delivery_date && d.delivery_date.startsWith(prefix))
  }, [deliveries, selectedDeliveryMonth])

  // Generate complete calendar days for the selected delivery month
  const monthCalendarDays = useMemo(() => {
    if (!selectedDeliveryMonth) return []
    const [y, m] = selectedDeliveryMonth.split('-')
    const year = parseInt(y, 10)
    const month = parseInt(m, 10)
    const daysCount = new Date(year, month, 0).getDate()

    const map = new Map<string, any>()
    deliveries.forEach((d: any) => {
      if (d.delivery_date) map.set(d.delivery_date, d)
    })

    const skipsSet = new Set<string>()
    skips.forEach((s: any) => {
      if (s.skip_date && s.status === 'confirmed') skipsSet.add(s.skip_date)
    })

    const days = []
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const rec = map.get(dateStr)
      const isSkipConfirmed = skipsSet.has(dateStr)
      const dateObj = new Date(year, month - 1, day)
      const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' })

      let status = 'upcoming'
      if (rec) {
        status = rec.delivery_status
      } else if (isSkipConfirmed) {
        status = 'skipped'
      } else {
        const todayStr = new Date().toISOString().split('T')[0]
        if (dateStr < todayStr) {
          status = 'no_delivery'
        }
      }

      days.push({
        day,
        dateStr,
        dayName,
        record: rec,
        status,
        litres: rec?.total_litres ?? activeSub?.quantity_litres ?? 1,
        time: rec?.delivered_at ? new Date(rec.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null,
        notes: rec?.notes || null
      })
    }
    return days
  }, [selectedDeliveryMonth, deliveries, skips, activeSub])

  const monthStats = useMemo(() => {
    let delivered = 0
    let skipped = 0
    let litres = 0
    monthCalendarDays.forEach((d) => {
      if (d.status === 'delivered') {
        delivered++
        litres += Number(d.litres) || 0
      } else if (d.status === 'skipped') {
        skipped++
      }
    })
    return {
      delivered,
      skipped,
      litres,
      totalDays: monthCalendarDays.length
    }
  }, [monthCalendarDays])

  if (!isOpen) return null

  const isCurrentPaid = paymentOverview?.is_current_paid ?? false
  const totalDue = paymentOverview?.total_due ?? 0
  const latestPaidMonthName = paymentOverview?.latest_paid_month
    ? new Date(paymentOverview.latest_paid_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'None'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 max-h-[94vh]"
      >
        {/* Header with Customer Overview */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-sky-50/50 dark:from-slate-850 dark:to-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#014DA4] text-white flex items-center justify-center shadow-md shadow-blue-900/20 flex-shrink-0">
                <History size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
                    {customerName}
                  </h2>
                  
                  {/* Paid / Pending Status Pill */}
                  {isCurrentPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 size={13} />
                      PAID (Active)
                    </span>
                  ) : totalDue > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 animate-pulse">
                      <AlertTriangle size={13} />
                      PENDING DUE: ₹{totalDue.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      UNPAID / NO DUES
                    </span>
                  )}

                  {/* Joined Date Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100/70 dark:bg-blue-950/50 text-[#014DA4] dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                    <Calendar size={12} />
                    Joined: {joinedDateStr} ({joinedDaysAgo}d ago)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                  <span>Phone: <strong className="text-slate-800 dark:text-slate-200">{profile?.phone || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Area: <strong className="text-slate-800 dark:text-slate-200">{profile?.area || 'Padil'}</strong></span>
                  {profile?.address && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-xs">{profile.address}</span>
                    </>
                  )}
                  {whatsappUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                      >
                        <MessageCircle size={12} />
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="self-start sm:self-center w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 4 Core Inspection Cards: Joined, Paid Status, Plan, Deliveries */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800">
          {/* Card 1: Payment Status & Dues */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Payment Status</span>
              {isCurrentPaid ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </p>
            <p className={cn(
              "text-lg sm:text-xl font-black font-mono tracking-tight mt-1.5",
              isCurrentPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {isCurrentPaid ? "Paid in Full" : `₹${totalDue.toLocaleString('en-IN')} Due`}
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {isCurrentPaid ? "All bills cleared" : `Last paid: ${latestPaidMonthName}`}
            </p>
            {!isCurrentPaid && (
              <button
                type="button"
                onClick={() => {
                  setMarkPaidTargetMonth(undefined)
                  setShowMarkPaid(true)
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs border-none"
              >
                <CheckCircle2 size={12} />
                Mark as Paid
              </button>
            )}
          </div>

          {/* Card 2: Total Lifetime Paid */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Lifetime Paid</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
              ₹{paymentSummary.total_paid.toLocaleString('en-IN')}
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
              {paymentSummary.total_transactions} payment transaction{paymentSummary.total_transactions !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Card 3: Days Delivered & Litres */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Delivered</p>
            <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1.5">
              {deliverySummary.total_litres_delivered} Litres
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
              {deliverySummary.total_delivered_days} days delivered ({deliverySummary.total_skipped_days} skipped)
            </p>
          </div>

          {/* Card 4: Active Plan */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Milk Plan</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1.5 truncate">
              {activeSub ? `${activeSub.quantity_litres}L / Day` : 'No Plan'}
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
              {activeSub?.daily_rate ? `₹${activeSub.daily_rate}/day • ` : ''}
              <span className="font-extrabold uppercase text-[#014DA4] dark:text-blue-400">
                {activeSub?.status || 'inactive'}
              </span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-white dark:bg-slate-900 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('subscription')}
            className={cn(
              'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'subscription'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Milk size={15} />
            <span>Plan & Subscription ({activeSub ? `${activeSub.quantity_litres}L` : 'None'})</span>
          </button>

          <button
            onClick={() => setActiveTab('deliveries')}
            className={cn(
              'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'deliveries'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Truck size={15} />
            <span>Daily Delivery Journal ({deliveries.length} days)</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={cn(
              'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'bills'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <FileText size={15} />
            <span>Monthly Bills & Invoices ({billingMonths.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={cn(
              'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'payments'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <CreditCard size={15} />
            <span>Payment Ledger ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('adjustments')}
            className={cn(
              'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'adjustments'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Gift size={15} />
            <span>Credits & Skips ({adjustments.length + skips.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw className="animate-spin text-[#014DA4]" size={36} />
              <p className="text-xs font-bold">Loading detailed customer inspection records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* ─── TAB 0: PLAN & SUBSCRIPTION FULL INSPECTION ─── */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {!activeSub ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                      <Milk size={38} className="mx-auto text-slate-400 mb-2" />
                      <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">No Active Subscription</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">This customer currently does not have an active milk plan.</p>
                      <button
                        type="button"
                        onClick={() => setActiveSubActionModal('subscription')}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#014DA4] hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-sm border-none"
                      >
                        Create New Subscription
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Hero Subscription Card */}
                      <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-850 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-blue-100 dark:border-slate-800">
                          <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#014DA4] to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 flex-shrink-0">
                              <Milk size={28} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display">
                                  {activeSub.plan_type === 'trial' ? '3-Day Trial Plan' : 'Standard Monthly Subscription'}
                                </h3>
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider",
                                  activeSub.status === 'active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800" :
                                  activeSub.status === 'pending_payment' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800" :
                                  activeSub.status === 'paused' ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800" :
                                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                )}>
                                  ● {activeSub.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Started: <strong>{activeSub.start_date ? new Date(activeSub.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</strong>
                                {activeSub.end_date ? ` • Ends: ${new Date(activeSub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' • Ongoing Daily Delivery'}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveSubActionModal('subscription')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Settings size={13} className="text-blue-600" />
                              Manage Plan
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubActionModal('skip')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors cursor-pointer"
                            >
                              <SkipForward size={13} className="text-amber-500" />
                              Mark Skip
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveSubActionModal('extra')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Droplets size={13} className="text-cyan-500" />
                              Add Extra
                            </button>
                            {!isCurrentPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMarkPaidTargetMonth(undefined)
                                  setShowMarkPaid(true)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors cursor-pointer border-none"
                              >
                                <CheckCircle2 size={13} />
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 4 Metric Stats Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-100/80 dark:border-slate-800 shadow-3xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Milk Volume</span>
                            <p className="text-2xl font-black text-[#014DA4] dark:text-blue-400 font-mono mt-1">
                              {activeSub.quantity_litres} <span className="text-xs font-bold text-slate-500">L / day</span>
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-100/80 dark:border-slate-800 shadow-3xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Rate</span>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
                              ₹{activeSub.daily_rate || 80} <span className="text-xs font-bold text-slate-500">/ Litre</span>
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-100/80 dark:border-slate-800 shadow-3xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Base Bill</span>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
                              ₹{Number(activeSub.monthly_amount || (activeSub.quantity_litres * (activeSub.daily_rate || 80) * 30)).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-100/80 dark:border-slate-800 shadow-3xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Dues</span>
                            <p className={cn("text-2xl font-black font-mono mt-1", isCurrentPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                              {isCurrentPaid ? "₹0 (Paid)" : `₹${totalDue.toLocaleString('en-IN')}`}
                            </p>
                          </div>
                        </div>

                        {/* Scheduled Quantity Change Alert */}
                        {activeSub.next_month_quantity && activeSub.next_month_quantity !== activeSub.quantity_litres && (
                          <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                            <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                                Scheduled Quantity Change for Next Month
                              </h4>
                              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium mt-0.5">
                                Customer has scheduled daily milk to change to <strong>{activeSub.next_month_quantity} Litres / Day</strong> starting on next monthly renewal.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Delivery Instructions & Route */}
                        <div className="mt-4 pt-4 border-t border-blue-100/70 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                            <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-200">Delivery Address: </span>
                              <span>{profile?.address || 'No specific address'} ({profile?.area || 'Padil'})</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                            <FileText size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-200">Delivery Instructions: </span>
                              <span>{activeSub.delivery_notes || 'Standard morning doorstep drop'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* All Past Subscriptions History Table */}
                      {subscriptions.length > 1 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            All Subscriptions & Plans History ({subscriptions.length})
                          </h4>
                          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                                  <th className="p-3">Plan Type</th>
                                  <th className="p-3">Volume</th>
                                  <th className="p-3">Rate</th>
                                  <th className="p-3">Start Date</th>
                                  <th className="p-3">End Date</th>
                                  <th className="p-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {subscriptions.map((s: any) => (
                                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                    <td className="p-3 font-bold text-slate-800 dark:text-white capitalize">
                                      {s.plan_type === 'trial' ? '3-Day Trial' : 'Monthly Plan'}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-blue-600">
                                      {s.quantity_litres}L / day
                                    </td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                                      ₹{s.daily_rate || 80}/L
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">
                                      {s.start_date || 'N/A'}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">
                                      {s.end_date || 'Ongoing'}
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                        s.status === 'active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" :
                                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                      )}>
                                        {s.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── TAB 1: ALL DAYS DELIVERY JOURNAL (DETAILED INSPECTION) ─── */}
              {activeTab === 'deliveries' && (
                <div className="space-y-6">
                  {/* Month Filter Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <CalendarDays size={18} className="text-[#014DA4] dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Inspect Month:
                      </span>
                      <select
                        value={selectedDeliveryMonth}
                        onChange={(e) => setSelectedDeliveryMonth(e.target.value)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs focus:ring-2 focus:ring-[#014DA4]"
                      >
                        {availableDeliveryMonths.map((mStr) => {
                          const [yr, mo] = mStr.split('-')
                          const label = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                          return (
                            <option key={mStr} value={mStr}>
                              {label}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    {/* Month delivery statistics pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        {monthStats.delivered} Delivered ({monthStats.litres}L)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                        <SkipForward size={12} className="text-amber-600" />
                        {monthStats.skipped} Skipped
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        {monthStats.totalDays} Days in Month
                      </span>
                    </div>
                  </div>

                  {/* Visual Calendar Grid for the Selected Month */}
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        Monthly Calendar Overview
                      </h4>
                      <div className="flex items-center gap-3 text-[10.5px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Delivered</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Skipped</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Upcoming / Not Delivered</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-750">
                      {monthCalendarDays.map((dItem) => {
                        const isDelivered = dItem.status === 'delivered'
                        const isSkipped = dItem.status === 'skipped'
                        return (
                          <div
                            key={dItem.dateStr}
                            className={cn(
                              "p-2 rounded-xl text-center flex flex-col items-center justify-between min-h-[58px] transition-all",
                              isDelivered
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 shadow-xs"
                                : isSkipped
                                  ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300"
                                  : "bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
                            )}
                          >
                            <div className="flex items-center justify-between w-full text-[10px] font-extrabold opacity-70">
                              <span>{dItem.dayName}</span>
                              <span className="font-mono text-xs">{dItem.day}</span>
                            </div>
                            <div className="text-[11px] font-black mt-1 font-mono">
                              {isDelivered ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{dItem.litres}L ✓</span>
                              ) : isSkipped ? (
                                <span className="text-amber-600 dark:text-amber-400 font-extrabold">SKIP ⏭</span>
                              ) : (
                                <span className="text-slate-400 text-[9px] font-medium">—</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Detailed Day-by-Day Table */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
                      Day-by-Day Detailed Delivery Log
                    </h4>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Date</th>
                            <th className="p-3.5">Quantity</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Time of Delivery</th>
                            <th className="p-3.5 text-right">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {monthCalendarDays.map((dItem) => {
                            const isDelivered = dItem.status === 'delivered'
                            const isSkipped = dItem.status === 'skipped'
                            return (
                              <tr key={`table-${dItem.dateStr}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 font-bold text-slate-800 dark:text-white">
                                  {dItem.dateStr} ({dItem.dayName})
                                </td>
                                <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                                  {dItem.litres} Litre{dItem.litres > 1 ? 's' : ''}
                                </td>
                                <td className="p-3.5">
                                  <span
                                    className={cn(
                                      'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                      isDelivered
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : isSkipped
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    )}
                                  >
                                    {isDelivered ? 'Delivered' : isSkipped ? 'Skipped' : 'Scheduled / None'}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                                  {dItem.time || '—'}
                                </td>
                                <td className="p-3.5 text-right text-slate-400 italic">
                                  {dItem.notes || '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: MONTHLY BILLS & INVOICES ─── */}
              {activeTab === 'bills' && (
                <div className="space-y-4">
                  {billingMonths.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                      No monthly billing records found for this customer.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Billing Month</th>
                            <th className="p-3.5">Plan Details</th>
                            <th className="p-3.5">Delivered / Skips</th>
                            <th className="p-3.5">Total Amount</th>
                            <th className="p-3.5">Amount Paid</th>
                            <th className="p-3.5">Net Due</th>
                            <th className="p-3.5 text-right">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {billingMonths.map((bm: any) => {
                            const monthDate = new Date(bm.billing_month)
                            const monthStr = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                            const isPaid = bm.payment_status === 'paid' || (Number(bm.amount_paid) > 0 && Number(bm.amount_paid) >= Number(bm.net_due))
                            return (
                              <tr key={bm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 font-bold text-slate-800 dark:text-white">
                                  {monthStr}
                                </td>
                                <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono">
                                  {bm.quantity_litres || 1}L • ₹{bm.daily_rate || 80}/day
                                </td>
                                <td className="p-3.5 text-slate-600 dark:text-slate-300">
                                  <span className="text-emerald-600 font-bold">{bm.days_delivered || 0} del</span>
                                  {' / '}
                                  <span className="text-amber-600 font-bold">{bm.days_skipped || 0} skip</span>
                                </td>
                                <td className="p-3.5 font-bold font-mono text-slate-800 dark:text-white">
                                  ₹{Number(bm.monthly_amount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  ₹{Number(bm.amount_paid || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                                  ₹{Number(bm.net_due || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span
                                      className={cn(
                                        'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                        isPaid
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                      )}
                                    >
                                      {isPaid ? 'Paid' : 'Pending'}
                                    </span>
                                    {!isPaid && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMarkPaidTargetMonth(bm.billing_month)
                                          setShowMarkPaid(true)
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-3xs border-none"
                                        title="Mark this bill as paid"
                                      >
                                        <CheckCircle2 size={10} />
                                        Mark Paid
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 3: PAYMENT TRANSACTIONS LEDGER ─── */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                      No payment transactions recorded for this customer yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Payment Date</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Method</th>
                            <th className="p-3.5">Transaction ID / Razorpay Order</th>
                            <th className="p-3.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {payments.map((p: any) => {
                            const dateStr = p.paid_at || p.created_at
                            const formatted = dateStr ? new Date(dateStr).toLocaleString('en-IN') : 'N/A'
                            const isSuccess = p.status === 'success' || p.status === 'paid'
                            return (
                              <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                                  {formatted}
                                </td>
                                <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                                  ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 uppercase font-bold text-slate-600 dark:text-slate-300">
                                  {p.method || 'UPI'}
                                </td>
                                <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">
                                  {p.razorpay_payment_id || p.razorpay_order_id || p.id.slice(0, 16)}
                                </td>
                                <td className="p-3.5 text-right">
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                      isSuccess
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    )}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 4: CREDITS, SKIPS & ADJUSTMENTS ─── */}
              {activeTab === 'adjustments' && (
                <div className="space-y-6">
                  {/* Skips Section */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                      Customer Skip Requests ({skips.length})
                    </h4>
                    {skips.length === 0 ? (
                      <div className="text-slate-400 text-xs py-4">No skip requests recorded.</div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3">Skip Date</th>
                              <th className="p-3">Credit Month</th>
                              <th className="p-3">Credit Amount</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {skips.map((s: any) => (
                              <tr key={s.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-800 dark:text-white">{s.skip_date}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{s.credit_month || 'Next Bill'}</td>
                                <td className="p-3 font-mono font-bold text-emerald-600">₹{s.credit_amount || 80}</td>
                                <td className="p-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Adjustments Section */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                      Billing Credits & Referral Rewards ({adjustments.length})
                    </h4>
                    {adjustments.length === 0 ? (
                      <div className="text-slate-400 text-xs py-4">No billing adjustments or referral bonuses applied yet.</div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3">Date</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Description</th>
                              <th className="p-3 text-right">Applied</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {adjustments.map((a: any) => (
                              <tr key={a.id} className="hover:bg-slate-50/50">
                                <td className="p-3 text-slate-700 dark:text-slate-300">
                                  {new Date(a.created_at).toLocaleDateString('en-IN')}
                                </td>
                                <td className="p-3 font-bold uppercase text-slate-700 dark:text-slate-200">
                                  {a.adjustment_type}
                                </td>
                                <td className="p-3 font-mono font-bold text-emerald-600">
                                  ₹{Number(a.amount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">
                                  {a.description || 'Credit Adjustment'}
                                </td>
                                <td className="p-3 text-right">
                                  <span className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                                    a.is_applied ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  )}>
                                    {a.is_applied ? 'Applied' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">
            Customer ID: <strong className="font-mono text-slate-600 dark:text-slate-300">{customerId}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </motion.div>

      {showMarkPaid && (
        <AdminMarkPaidModal
          isOpen={showMarkPaid}
          onClose={() => setShowMarkPaid(false)}
          onSuccess={() => {
            setShowMarkPaid(false)
            fetchHistory()
          }}
          customerId={customerId}
          customerName={customerName}
          defaultAmount={totalDue || 1200}
          billingMonth={markPaidTargetMonth}
        />
      )}

      {activeSubActionModal === 'subscription' && (
        <AdminSubscriptionModal
          isOpen={activeSubActionModal === 'subscription'}
          onClose={() => setActiveSubActionModal(null)}
          onSuccess={() => {
            setActiveSubActionModal(null)
            fetchHistory()
          }}
          customerId={customerId}
          customerName={customerName}
        />
      )}

      {activeSubActionModal === 'skip' && (
        <AdminSkipModal
          isOpen={activeSubActionModal === 'skip'}
          onClose={() => setActiveSubActionModal(null)}
          onSuccess={() => {
            setActiveSubActionModal(null)
            fetchHistory()
          }}
          customerId={customerId}
          customerName={customerName}
        />
      )}

      {activeSubActionModal === 'extra' && (
        <AdminExtraMilkModal
          isOpen={activeSubActionModal === 'extra'}
          onClose={() => setActiveSubActionModal(null)}
          onSuccess={() => {
            setActiveSubActionModal(null)
            fetchHistory()
          }}
          customerId={customerId}
          customerName={customerName}
        />
      )}
    </div>
  )
}
