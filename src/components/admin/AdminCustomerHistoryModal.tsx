'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, History, Calendar, CreditCard, Truck, AlertCircle,
  FileText, CheckCircle2, Clock, Milk, Gift, ChevronRight,
  ArrowUpRight, RefreshCw, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminCustomerHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
  customerName: string
}

export function AdminCustomerHistoryModal({
  isOpen,
  onClose,
  customerId,
  customerName
}: AdminCustomerHistoryModalProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bills' | 'payments' | 'deliveries' | 'adjustments'>('bills')
  const [historyData, setHistoryData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !customerId) return
    let isMounted = true
    setLoading(true)
    setError(null)

    async function loadHistory() {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/history`)
        const data = await res.json()
        if (isMounted) {
          if (data.success) {
            setHistoryData(data)
          } else {
            setError(data.message || 'Failed to load customer history')
          }
        }
      } catch (err: unknown) {
        if (isMounted) setError('Network error loading history')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadHistory()
    return () => { isMounted = false }
  }, [isOpen, customerId])

  if (!isOpen) return null

  const profile = historyData?.profile
  const subscriptions = historyData?.subscriptions || []
  const billingMonths = historyData?.billing_months || []
  const payments = historyData?.payments || []
  const deliveries = historyData?.deliveries || []
  const skips = historyData?.skips || []
  const adjustments = historyData?.adjustments || []
  const deliverySummary = historyData?.delivery_summary || { total_delivered_days: 0, total_skipped_days: 0, total_litres_delivered: 0 }
  const paymentSummary = historyData?.payment_summary || { total_paid: 0, total_transactions: 0 }

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
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-slate-800/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#014DA4] text-white flex items-center justify-center shadow-md shadow-blue-900/20 flex-shrink-0">
              <History size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  {customerName}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#014DA4] dark:text-blue-400">
                  Full Customer Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 font-medium">
                <span>Phone: <strong className="text-slate-700 dark:text-slate-300">{profile?.phone || 'N/A'}</strong></span>
                <span>•</span>
                <span>Area: <strong className="text-slate-700 dark:text-slate-300">{profile?.area || 'Padil'}</strong></span>
                {profile?.address && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-xs">{profile.address}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-50/60 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800/60">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount Paid</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              ₹{paymentSummary.total_paid.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{paymentSummary.total_transactions} transactions</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Litres Delivered</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
              {deliverySummary.total_litres_delivered} L
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{deliverySummary.total_delivered_days} days delivered</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Skipped</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
              {deliverySummary.total_skipped_days} Days
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{skips.length} skip requests</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Subscriptions</p>
            <p className="text-xl font-black text-slate-800 dark:text-white font-mono mt-1">
              {subscriptions.length > 0 ? `${subscriptions[0].quantity_litres}L / Day` : 'None'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Status: <span className="font-bold text-[#014DA4] dark:text-blue-400 uppercase">{subscriptions[0]?.status || 'Inactive'}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('bills')}
            className={cn(
              'py-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'bills'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <FileText size={15} />
            <span>Monthly Bills ({billingMonths.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={cn(
              'py-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'payments'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <CreditCard size={15} />
            <span>Payments Ledger ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('deliveries')}
            className={cn(
              'py-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'deliveries'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Truck size={15} />
            <span>Deliveries ({deliveries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('adjustments')}
            className={cn(
              'py-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'adjustments'
                ? 'border-[#014DA4] text-[#014DA4] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Gift size={15} />
            <span>Credits & Adjustments ({adjustments.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw className="animate-spin text-[#014DA4]" size={32} />
              <p className="text-xs font-bold">Loading full customer records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: MONTHLY BILLS */}
              {activeTab === 'bills' && (
                <div className="space-y-4">
                  {billingMonths.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                      No monthly billing records found for this customer.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Month</th>
                            <th className="p-3.5">Plan Rate</th>
                            <th className="p-3.5">Delivered / Skips</th>
                            <th className="p-3.5">Bill Amount</th>
                            <th className="p-3.5">Paid</th>
                            <th className="p-3.5">Net Due</th>
                            <th className="p-3.5 text-right">Status</th>
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
                                  {bm.quantity_litres || 1}L • ₹{bm.daily_rate || 80}/d
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
                                <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                                  ₹{Number(bm.net_due || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 text-right">
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                      isPaid
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    )}
                                  >
                                    {isPaid ? 'Paid' : 'Pending'}
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

              {/* TAB 2: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                      No payment transactions recorded yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Date & Time</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Method</th>
                            <th className="p-3.5">Transaction / Payment ID</th>
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

              {/* TAB 3: DELIVERIES & SKIPS */}
              {activeTab === 'deliveries' && (
                <div className="space-y-4">
                  {deliveries.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                      No daily delivery records generated yet for this customer.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Delivery Date</th>
                            <th className="p-3.5">Quantity</th>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Delivered At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {deliveries.slice(0, 50).map((d: any) => {
                            const isDelivered = d.delivery_status === 'delivered'
                            const isSkipped = d.delivery_status === 'skipped' || d.is_skip
                            return (
                              <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 font-bold text-slate-800 dark:text-white">
                                  {d.delivery_date}
                                </td>
                                <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                                  {d.total_litres} Litre{d.total_litres > 1 ? 's' : ''}
                                </td>
                                <td className="p-3.5 text-slate-600 dark:text-slate-400">
                                  {d.is_extra ? 'Extra Order' : d.is_vacation ? 'Vacation' : 'Daily Regular'}
                                </td>
                                <td className="p-3.5">
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                      isDelivered
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : isSkipped
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    )}
                                  >
                                    {d.delivery_status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right text-slate-500 font-mono">
                                  {d.delivered_at ? new Date(d.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
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

              {/* TAB 4: CREDITS & ADJUSTMENTS */}
              {activeTab === 'adjustments' && (
                <div className="space-y-4">
                  {adjustments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                      No credit adjustments or referral bonuses applied yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5">Created At</th>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Description</th>
                            <th className="p-3.5 text-right">Applied</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {adjustments.map((a: any) => (
                            <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 text-slate-700 dark:text-slate-300">
                                {new Date(a.created_at).toLocaleDateString('en-IN')}
                              </td>
                              <td className="p-3.5 font-bold uppercase text-slate-700 dark:text-slate-200">
                                {a.adjustment_type}
                              </td>
                              <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{Number(a.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5 text-slate-600 dark:text-slate-400">
                                {a.description || 'Adjustment'}
                              </td>
                              <td className="p-3.5 text-right">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                    a.is_applied
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  )}
                                >
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
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">
            Customer ID: <strong className="font-mono text-slate-600 dark:text-slate-300">{customerId}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
