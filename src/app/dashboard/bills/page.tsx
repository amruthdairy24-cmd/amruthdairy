'use client'

import { useState, useEffect } from 'react'
import {
  FileText, CreditCard, CheckCircle2, ShieldCheck, AlertCircle,
  TrendingUp, Info, Milk, SkipForward, Palmtree, PlusCircle,
  Wallet, ArrowRight, Eye, Calendar, Sparkles, Clock,
  ArrowUpRight, RefreshCw, Banknote, ChevronRight, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'

interface BillingData {
  id?: string;
  billing_month: string;
  days_delivered: number;
  days_skipped: number;
  days_paused: number;
  extra_litres_ordered: number;
  skip_credit: number;
  pause_credit: number;
  extra_charges: number;
  carry_in_balance: number;
  net_due: number;
  amount_paid: number;
  monthly_amount?: number;
  payment_status?: string;
}

interface SubscriptionData {
  id: string;
  status: string;
  quantity_litres: number;
  monthly_amount: number;
  daily_rate: number;
  start_date: string;
  balance: number;
}

interface ExtraMilkOrder {
  id?: string;
  order_date: string;
  extra_litres: number;
  charge_amount: number;
  skip_credit_applied?: number;
  net_charge_amount?: number;
  status: string;
}

// Animation configurations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
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

export default function BillsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bill, setBill] = useState<BillingData | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [upcomingAdjustments, setUpcomingAdjustments] = useState<any[]>([])
  const [upcomingSkips, setUpcomingSkips] = useState<any[]>([])
  const [upcomingExtras, setUpcomingExtras] = useState<ExtraMilkOrder[]>([])
  const [activeVacation, setActiveVacation] = useState<any>(null)
  const [nextMonthChange, setNextMonthChange] = useState<any>(null)

  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details')
  const [mockPaid, setMockPaid] = useState(false)
  const [isRequestingRefund, setIsRequestingRefund] = useState(false)
  const [viewingBill, setViewingBill] = useState<BillingData | null>(null)

  async function handleRefundRequest() {
    if (!confirm('Are you sure you want to request a cash refund? This will convert your carry-forward credits to cash, and they will no longer reduce your next bill.')) return;
    setIsRequestingRefund(true);
    try {
      const res = await fetch('/api/customer/refund', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Refund requested successfully! Our admin will process your request shortly.');
        loadData();
      } else {
        alert(data.message || 'Failed to request refund');
      }
    } catch (err) {
      alert('Network error while requesting refund');
    } finally {
      setIsRequestingRefund(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        if (json.profile) setProfile(json.profile)
        if (json.subscription) setSubscription(json.subscription)
        if (json.upcoming_adjustments) setUpcomingAdjustments(json.upcoming_adjustments)
        if (json.upcoming_skips) setUpcomingSkips(json.upcoming_skips)
        if (json.upcoming_extras) setUpcomingExtras(json.upcoming_extras)
        if (json.active_vacation) setActiveVacation(json.active_vacation)
        if (json.next_month_change) setNextMonthChange(json.next_month_change)
        if (json.current_month) {
          setBill(json.current_month)
        } else {
          const monthly = json.subscription ? json.subscription.monthly_amount : 0
          setBill({
            billing_month: new Date().toISOString().split('T')[0],
            days_delivered: 0, days_skipped: 0, days_paused: 0, extra_litres_ordered: 0,
            skip_credit: 0, pause_credit: 0, extra_charges: 0, carry_in_balance: 0,
            net_due: monthly, amount_paid: 0, payment_status: 'pending'
          })
        }
      } else {
        setError(json.message || 'Failed to retrieve billing statements')
      }
    } catch (err) {
      setError('Network error loading statements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function startPayment() {
    if (!bill) return;
    try {
      setPaymentStep('processing');
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setPaymentStep('details');
        return;
      }

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bill.net_due, billingMonthId: bill.id })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        alert(orderData.message || 'Failed to initialize payment order.');
        setPaymentStep('details');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Amruth Milk',
        description: `Milk Subscription Payment - ${monthName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setPaymentStep('processing');
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                billing_month_id: bill.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentStep('success');
              setMockPaid(true);
              loadData();
            } else {
              alert(verifyData.message || 'Payment verification failed.');
              setPaymentStep('details');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Error verifying payment.');
            setPaymentStep('details');
          }
        },
        prefill: {
          name: profile?.full_name || '',
          contact: profile?.phone || ''
        },
        theme: { color: '#014DA4' },
        modal: { ondismiss: function () { setPaymentStep('details'); } }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Payment start error:', err);
      alert('Failed to initiate payment.');
      setPaymentStep('details');
    }
  }

  // ─── Loading Skeleton ───
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-[100px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-[100px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-[100px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-[100px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="h-[420px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-[240px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-[240px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    )
  }

  // ─── Error State ───
  if (error || !bill) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={40} />
        <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Statement Unavailable</h3>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-6">{error || 'No active statements found.'}</p>
        <button onClick={loadData} className="inline-flex items-center justify-center px-6 h-11 bg-brand-secondary hover:bg-[#014DA4] text-white font-extrabold rounded-xl text-[13px] shadow-sm border-none cursor-pointer transition-colors">
          Retry Loading
        </button>
      </div>
    )
  }

  // ─── Derived Values ───
  const monthName = new Date(bill.billing_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  // Payment status: check payment_status field first, then fall back to amount_paid check
  // Treat as paid in dev mode if the subscription is active but billing hasn't caught up (local Razorpay bypass)
  const isDevMockPaid = process.env.NODE_ENV === 'development' && subscription?.status === 'active' && bill.payment_status === 'pending';
  const isPaid = mockPaid || bill.payment_status === 'paid' || (bill.amount_paid > 0 && bill.amount_paid >= bill.net_due) || isDevMockPaid;
  const hasPendingBill = bill.net_due > 0 && !isPaid
  const basePlanAmount = bill.monthly_amount || (bill.net_due + bill.skip_credit + bill.pause_credit - bill.extra_charges + bill.carry_in_balance)

  // Billing cycle dates
  const billingDate = new Date(bill.billing_month)
  const cycleStart = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1)
  const cycleEnd = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0)
  const cycleStartStr = cycleStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const cycleEndStr = cycleEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const totalDaysInMonth = cycleEnd.getDate()
  const today = new Date()
  const dayOfMonth = today.getMonth() === billingDate.getMonth() && today.getFullYear() === billingDate.getFullYear() ? today.getDate() : totalDaysInMonth
  const cycleProgress = Math.round((dayOfMonth / totalDaysInMonth) * 100)

  // Carry forward amount
  const carryForwardSum = upcomingAdjustments
    .filter(a => a.adjustment_type.includes('credit') || a.amount < 0)
    .reduce((sum, a) => sum + Math.abs(a.amount), 0)

  // Extra milk upcoming
  const totalGrossExtraMilk = upcomingExtras.reduce((sum, e) => sum + (e.charge_amount || 0), 0)
  const totalExtraMilkCharges = upcomingExtras.reduce((sum, e) => sum + Number(e.net_charge_amount !== undefined ? e.net_charge_amount : e.charge_amount || 0), 0)
  const totalSkipCreditsAppliedToExtra = upcomingExtras.reduce((sum, e) => sum + Number(e.skip_credit_applied || 0), 0)

  
  const totalSkipCredits = upcomingSkips.reduce((sum: number, s: any) => sum + (s.credit_amount || 0), 0)
  const extraMilkAfterCredits = totalExtraMilkCharges
  const creditsUsedForExtra = totalSkipCreditsAppliedToExtra

  // Plan info
  const planLabel = subscription
    ? subscription.quantity_litres === 0.5 ? '½ Litre' : `${subscription.quantity_litres} Litre`
    : '—'
  const memberSince = subscription?.start_date
    ? new Date(subscription.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—'

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-7 relative"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-[340px] h-[340px] bg-gradient-to-br from-blue-500/5 to-emerald-500/5 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute top-[50%] -left-32 w-[260px] h-[260px] bg-gradient-to-tr from-amber-400/5 to-blue-400/5 blur-[80px] rounded-full pointer-events-none" />

      {/* ═══════════════════════════════════════════════════════════
          ZONE 1 — HERO PLAN CARD (full width)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-[#014DA4] dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 text-white p-6 sm:p-7 shadow-lg border border-white/10 dark:border-slate-800 z-10"
      >
        <div className="absolute -top-8 -right-8 w-56 h-56 rounded-full pointer-events-none filter blur-[50px] opacity-20 dark:opacity-10 bg-amber-300" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none filter blur-[40px] opacity-10 bg-blue-200" />

        {/* Farm scene SVG */}
        <svg width="200" height="130" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-4 bottom-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none hidden md:block select-none">
          <circle cx="160" cy="70" r="35" fill="url(#sunGlowBill)" opacity="0.3"/>
          <circle cx="160" cy="70" r="14" fill="#FCD34D"/>
          <path d="M60 160C110 120 160 140 220 110C240 100 260 110 280 110V160H60Z" fill="#047857" opacity="0.3"/>
          <path d="M10 160C70 110 130 130 190 95C210 85 230 90 250 90V160H10Z" fill="#065F46" opacity="0.2"/>
          <g transform="translate(95, 115) scale(0.4)" fill="#065F46" opacity="0.45">
            <path d="M50 30C42 30 38 28 35 25C32 28 28 30 20 30H10V45C10 47 12 48 14 48H18V65C18 68 22 68 22 65V48H38V65C38 68 42 68 42 65V48H46C48 48 50 47 50 45V30Z"/>
            <path d="M8 30C5 30 2 28 0 25V18C0 15 3 12 6 12H15L22 22C24 25 28 26 32 26H40L45 18C47 15 50 15 52 18L58 28C60 30 62 32 65 32H75C78 32 80 34 80 37V45C80 48 78 50 75 50H70V75C70 78 65 78 65 75V50H58V75C58 78 53 78 53 75V50H18V75C18 78 13 78 13 75V50H10C8 50 6 48 6 45V30H8Z"/>
          </g>
          <defs>
            <radialGradient id="sunGlowBill" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="1"/>
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
            </radialGradient>
          </defs>
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/15 dark:bg-slate-950/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10">
                <Milk size={11} className="text-amber-300" />
                <span>{planLabel} Daily Plan</span>
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                subscription?.status === 'active'
                  ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/20"
                  : "bg-amber-400/20 text-amber-200 border-amber-400/20"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", subscription?.status === 'active' ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                {subscription?.status === 'active' ? 'Active' : subscription?.status === 'paused' ? 'Paused' : 'Pending'}
              </span>
            </div>

            <div>
              <h1 className="text-[22px] sm:text-[26px] font-bold font-display tracking-tight leading-tight">
                My Billing & Payments
              </h1>
              <p className="text-[12px] sm:text-[13px] font-medium text-blue-100/70 dark:text-slate-400 mt-1 leading-relaxed">
                {monthName} billing cycle • {cycleStartStr} – {cycleEndStr}
              </p>
            </div>

            <div className="flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cycleProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-amber-300 to-emerald-300 rounded-full"
                />
              </div>
              <span className="text-[10px] font-bold text-white/50 whitespace-nowrap">{cycleProgress}% cycle</span>
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white/8 dark:bg-slate-950/40 backdrop-blur-md border border-white/10 dark:border-slate-800/50 px-4 py-3 rounded-xl min-w-[110px] text-center select-none">
              <p className="text-[9px] text-blue-200/60 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Monthly</p>
              <p className="text-xl font-black font-mono tracking-tight leading-none text-white">₹{subscription?.monthly_amount?.toFixed(0) || '0'}</p>
              <p className="text-[9px] text-blue-200/40 font-semibold mt-1">₹{subscription?.daily_rate?.toFixed(0) || '0'}/day</p>
            </div>
            <div className="bg-white/8 dark:bg-slate-950/40 backdrop-blur-md border border-white/10 dark:border-slate-800/50 px-4 py-3 rounded-xl min-w-[110px] text-center select-none">
              <p className="text-[9px] text-blue-200/60 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Member Since</p>
              <p className="text-sm font-bold font-display tracking-tight leading-none text-white mt-1">{memberSince}</p>
              <Link href="/dashboard/quantity" className="text-[9px] text-amber-300/80 hover:text-amber-200 font-bold mt-1.5 flex items-center justify-center gap-0.5 transition-colors">
                Manage <ChevronRight size={9} />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          ZONE 2 — FINANCIAL SUMMARY STATS ROW (4 cards, full width)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">

        {/* Stat 1: Current Due */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Current Due</p>
              <p className={cn(
                "text-2xl font-black font-mono tracking-tight mt-1.5 leading-none",
                hasPendingBill ? "text-[#014DA4] dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                ₹{isPaid ? '0.00' : bill.net_due.toFixed(2)}
              </p>
              <div className="mt-2">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-500/10 border border-emerald-200/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={9} /> Paid
                  </span>
                ) : hasPendingBill ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/10 border border-amber-200/30 px-2 py-0.5 rounded-full">
                    <Clock size={9} /> Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-500/10 border border-emerald-200/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={9} /> Cleared
                  </span>
                )}
              </div>
            </div>
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
              hasPendingBill ? "bg-[#014DA4]/10 text-[#014DA4] dark:text-blue-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}>
              <CreditCard size={19} />
            </div>
          </div>
        </div>

        {/* Stat 2: Carry Forward Credits */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Carry Forward</p>
              <p className={cn(
                "text-2xl font-black font-mono tracking-tight mt-1.5 leading-none",
                carryForwardSum > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
              )}>
                {carryForwardSum > 0 ? `₹${carryForwardSum.toFixed(2)}` : '₹0.00'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-2 truncate">
                {carryForwardSum > 0 ? 'Credits for next month' : 'No pending credits'}
              </p>
            </div>
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
              carryForwardSum > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            )}>
              <ArrowRight size={19} />
            </div>
          </div>
        </div>

        {/* Stat 3: Extra Milk Charges */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Extra Milk Due</p>
              <p className={cn(
                "text-2xl font-black font-mono tracking-tight mt-1.5 leading-none",
                totalExtraMilkCharges > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
              )}>
                ₹{totalExtraMilkCharges > 0 ? totalExtraMilkCharges.toFixed(2) : '0.00'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-2 truncate">
                {totalExtraMilkCharges > 0
                  ? `${upcomingExtras.length} upcoming order${upcomingExtras.length > 1 ? 's' : ''}`
                  : 'No extra orders'}
              </p>
            </div>
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
              totalExtraMilkCharges > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            )}>
              <PlusCircle size={19} />
            </div>
          </div>
        </div>

        {/* Stat 4: Account Balance */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Balance</p>
              <p className={cn(
                "text-2xl font-black font-mono tracking-tight mt-1.5 leading-none",
                (subscription?.balance ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                ₹{Math.abs(subscription?.balance ?? 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-2 truncate">
                {(subscription?.balance ?? 0) >= 0 ? 'Credit balance' : 'Outstanding due'}
              </p>
            </div>
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
              (subscription?.balance ?? 0) >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-500"
            )}>
              <Wallet size={19} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          ZONE 3 — MONTHLY STATEMENT (full width)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="relative z-10">
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">

          {/* Statement Header */}
          <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-between items-center select-none">
            <div className="text-left">
              <h3 className="text-[14px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-wider font-display flex items-center gap-2">
                <FileText size={15} />
                {monthName} Statement
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-widest">Amruth Dairy Farm Invoice</p>
            </div>
            <div>
              {isPaid ? (
                <span className="text-[9.5px] font-extrabold uppercase text-green-700 bg-green-500/10 border border-green-200/25 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} /> Paid
                </span>
              ) : hasPendingBill ? (
                <span className="text-[9.5px] font-extrabold uppercase text-amber-700 bg-amber-500/10 border border-amber-200/25 px-3 py-1 rounded-full animate-pulse">Pending</span>
              ) : (
                <span className="text-[9.5px] font-extrabold uppercase text-green-700 bg-green-500/10 border border-green-200/25 px-3 py-1 rounded-full">Cleared</span>
              )}
            </div>
          </div>

          {/* Invoice Line Items — 2-column grid on large screens */}
          <div className="p-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              {/* Left column of items */}
              <div className="space-y-1">
                {/* Base Plan */}
                <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Milk size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Base Plan Charges</span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">{planLabel}/day × {totalDaysInMonth} days</span>
                    </div>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">₹{basePlanAmount.toFixed(2)}</span>
                </div>

                {/* Skip Credits */}
                <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <SkipForward size={13} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Skip Day Credits</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/60 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">{bill.days_skipped} days</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-500 font-mono text-sm">-₹{bill.skip_credit.toFixed(2)}</span>
                </div>

                {/* Vacation Credits */}
                <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800 lg:border-b-0">
                  <span className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <Palmtree size={13} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Vacation Pause Credits</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/60 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">{bill.days_paused} days</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-500 font-mono text-sm">-₹{bill.pause_credit.toFixed(2)}</span>
                </div>
              </div>

              {/* Right column of items */}
              <div className="space-y-1">
                {/* Extra Milk Charges */}
                <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <PlusCircle size={13} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Extra Milk Charges</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/60 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">+{bill.extra_litres_ordered}L</span>
                  </span>
                  <span className="font-bold text-rose-500 dark:text-rose-400 font-mono text-sm">+₹{bill.extra_charges.toFixed(2)}</span>
                </div>

                {/* Previous Carry-over */}
                <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                      <Wallet size={13} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Previous Carry-over</span>
                  </span>
                  <span className={cn("font-bold font-mono text-sm", bill.carry_in_balance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-500 dark:text-rose-400")}>
                    {bill.carry_in_balance >= 0 ? '-' : '+'}₹{Math.abs(bill.carry_in_balance).toFixed(2)}
                  </span>
                </div>

                {/* Carry forward to next month */}
                {carryForwardSum > 0 && (
                  <div className="flex justify-between items-center py-3.5 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 -mx-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                    <span className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <ArrowRight size={13} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Next Month Carry-forward</span>
                      <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">Credits</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-500 font-mono text-sm">+₹{carryForwardSum.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Total Row (full width) ─── */}
            <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-base font-black text-slate-900 dark:text-white select-none">Total Net Due</span>
              <div className="flex items-center gap-3">
                {isPaid && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-500/10 border border-emerald-200/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> Already Paid
                  </span>
                )}
                <span className={cn("font-mono text-2xl font-black tracking-tight", isPaid ? "text-emerald-600 dark:text-emerald-400 line-through opacity-60" : "text-[#014DA4] dark:text-blue-400")}>
                  ₹{bill.net_due.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions — only show pay button if actually pending */}
          <div className="p-6 bg-slate-50/60 dark:bg-slate-950/40 border-t border-border/50 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            {hasPendingBill && (
              <button
                onClick={() => { setShowPayModal(true); setPaymentStep('details'); }}
                className="flex-1 h-12 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/90 active:scale-[0.98] text-white font-extrabold text-xs shadow-md shadow-[#014DA4]/10 transition-all border-none flex items-center justify-center gap-2 cursor-pointer group"
              >
                <CreditCard size={15} className="group-hover:scale-110 transition-transform" />
                <span>Pay Balance Due (₹{bill.net_due.toFixed(2)})</span>
              </button>
            )}
            <button
              onClick={() => setViewingBill(bill)}
              className={cn(
                "h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer",
                hasPendingBill ? "flex-1" : "w-full"
              )}
            >
              <Eye size={15} />
              <span>View Full Details</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          ZONE 4 — EXTRA MILK & CREDITS + NEXT MONTH PREVIEW (side by side)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">

        {/* ─── Extra Milk & Credit Offset Card ─── */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 select-none">
            <h3 className="text-[12px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-[2px] flex items-center gap-2">
              <Zap size={14} />
              <span>Extra Milk & Credits</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Upcoming extra orders & skip credit offsets</p>
          </div>

          <div className="p-5 space-y-4">
            {upcomingExtras.length > 0 ? (
              <>
                {/* Individual extra milk orders */}
                <div className="space-y-2">
                  {upcomingExtras.map((extra, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/60 dark:border-amber-900/20 rounded-xl text-[12.5px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <PlusCircle size={13} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">+{extra.extra_litres}L Extra</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {new Date(extra.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">₹{extra.charge_amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Credit offset breakdown */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-2.5 text-[12px]">
                  <div className="flex justify-between items-center font-semibold text-slate-600 dark:text-slate-300">
                    <span>Total Extra Milk</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{totalGrossExtraMilk.toFixed(2)}</span>
                  </div>

                  {creditsUsedForExtra > 0 && (
                    <div className="flex justify-between items-center font-semibold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <SkipForward size={11} className="text-emerald-500" />
                        Skip Credit Offset
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-₹{creditsUsedForExtra.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white text-[13px]">
                    <span>Net Extra Due</span>
                    <span className={cn("font-mono", extraMilkAfterCredits > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                      ₹{extraMilkAfterCredits.toFixed(2)}
                    </span>
                  </div>

                  {creditsUsedForExtra > 0 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                      <CheckCircle2 size={10} />
                      ₹{creditsUsedForExtra.toFixed(2)} offset by skip credits automatically
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* No extra milk orders */
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                  <PlusCircle size={20} />
                </div>
                <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400">No upcoming extra milk orders</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Order extra milk anytime from the Extra Milk page</p>
                {totalSkipCredits > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 rounded-xl">
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                      <SkipForward size={12} />
                      ₹{totalSkipCredits.toFixed(2)} in skip credits available
                    </p>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">Can be used to offset future extra milk charges</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Next Month Preview Card ─── */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-gradient-to-r from-emerald-50/60 to-blue-50/40 dark:from-emerald-950/20 dark:to-blue-950/10 select-none">
            <h3 className="text-[12px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[2px] flex items-center gap-2">
              <Sparkles size={14} />
              <span>Next Month Preview</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">What to expect on your next bill</p>
          </div>

          <div className="p-5 space-y-3.5 text-[12.5px]">
            {/* Carry Forward Credits */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowRight size={13} />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">Credits Carry-forward</span>
              </div>
              <span className={cn("font-mono font-black text-sm", carryForwardSum > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")}>
                {carryForwardSum > 0 ? `-₹${carryForwardSum.toFixed(2)}` : '₹0.00'}
              </span>
            </div>

            {/* Active Vacation */}
            {activeVacation && (
              <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Palmtree size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Active Vacation</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(activeVacation.pause_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(activeVacation.pause_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  -₹{activeVacation.total_credit?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}

            {/* Upcoming Skips */}
            {upcomingSkips.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/60 dark:border-rose-900/20 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <SkipForward size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Upcoming Skips</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{upcomingSkips.length} day{upcomingSkips.length > 1 ? 's' : ''} scheduled</span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  -₹{totalSkipCredits.toFixed(2)}
                </span>
              </div>
            )}

            {/* Pending Quantity Change */}
            {nextMonthChange && (
              <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/60 dark:border-amber-900/20 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <ArrowUpRight size={13} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Plan Change Pending</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Changing to {nextMonthChange.quantity === 0.5 ? '½' : nextMonthChange.quantity}L/day
                    </span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                  ₹{nextMonthChange.amount?.toFixed(0) || '—'}/mo
                </span>
              </div>
            )}

            {/* Empty state */}
            {!activeVacation && upcomingSkips.length === 0 && !nextMonthChange && carryForwardSum === 0 && (
              <div className="text-center py-4">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">No upcoming adjustments or changes</p>
                <p className="text-[10px] text-slate-350 dark:text-slate-600 mt-1">Your next bill will be at the standard plan rate</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          ZONE 5 — UPCOMING ADJUSTMENTS + BILLING GUIDE (side by side)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className={cn("grid gap-5 relative z-10", upcomingAdjustments.length > 0 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>

        {/* Upcoming Adjustments Card */}
        {upcomingAdjustments.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-left select-none">
              <h3 className="text-[12px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-[2px] flex items-center gap-2">
                <RefreshCw size={14} />
                Upcoming Adjustments
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Calculations pending for next renewal cycle</p>
            </div>

            <div className="p-5 space-y-3">
              {upcomingAdjustments.map((adj, idx) => (
                <div key={idx} className="flex justify-between items-center text-[12.5px] bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl hover:shadow-sm transition-shadow">
                  <span className="flex flex-col text-left">
                    <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 flex-wrap">
                      {adj.adjustment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      {adj.refund_status === 'requested' && <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide border border-amber-200/10 dark:border-amber-900/30">Refund Pending</span>}
                      {adj.refund_status === 'processed' && <span className="text-[9px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide border border-green-200/10 dark:border-green-900/30">Refunded</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{adj.description || 'Adjustment'}</span>
                  </span>
                  <span className={cn("font-mono font-black ml-2.5 text-right text-sm", adj.adjustment_type.includes('credit') || adj.amount < 0 ? "text-emerald-600" : "text-rose-500")}>
                    {adj.adjustment_type.includes('credit') || adj.amount < 0 ? '-' : '+'}₹{Math.abs(adj.amount).toFixed(2)}
                  </span>
                </div>
              ))}

              {(() => {
                const refundableAmt = upcomingAdjustments
                  .filter(a => a.amount < 0 && (!a.refund_status || a.refund_status === 'none'))
                  .reduce((sum, a) => sum + Math.abs(a.amount), 0);

                if (refundableAmt > 0) {
                  return (
                    <div className="pt-2">
                      <button
                        onClick={handleRefundRequest}
                        disabled={isRequestingRefund}
                        className="w-full h-10 rounded-xl bg-white dark:bg-slate-900 border border-[#014DA4]/30 text-[#014DA4] dark:text-blue-400 hover:bg-[#014DA4]/5 active:scale-[0.98] font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Banknote size={14} />
                        {isRequestingRefund ? 'Requesting...' : `Request Cash Refund (₹${refundableAmt.toFixed(2)})`}
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Billing Guide Card */}
        <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-5 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
          <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] flex items-center gap-2 pl-0.5 select-none">
            <TrendingUp size={15} className="text-[#014DA4] dark:text-blue-400" />
            <span>Billing Guide</span>
          </h3>

          <div className="space-y-4 text-left leading-relaxed">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">1</div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Monthly Cycle Rates</p>
                <p className="text-slate-450 dark:text-slate-500 mt-1">Calculations are based on the actual number of days in the month. Your customized subscription daily rate applies directly to each successfully delivered day.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">2</div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Credits & Extra Milk</p>
                <p className="text-slate-450 dark:text-slate-500 mt-1">Skip day credits automatically offset extra milk charges. Any remaining credits carry forward to reduce your next monthly bill.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">3</div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cash Refund Policy</p>
                <p className="text-slate-450 dark:text-slate-500 mt-1">Accumulated carry-forward credits can be directly refunded to your bank account upon request rather than rolled over.</p>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

          <div className="flex gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl">
            <Info size={16} className="text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 ml-0.5" />
            <p className="text-[10.5px] text-slate-450 dark:text-slate-500 leading-relaxed font-bold text-left">
              Online card and UPI payments update your balance immediately. For physical cash or cheque payments, please coordinate directly with the delivery managers.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          SECURE CHECKOUT MODAL
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => paymentStep !== 'processing' && setShowPayModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-10 overflow-hidden text-slate-900 dark:text-slate-100"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#014DA4] to-emerald-500" />

              {paymentStep === 'details' && (
                <div className="space-y-5">
                  <div className="text-left">
                    <h3 className="text-[16px] sm:text-lg font-black font-display text-slate-800 dark:text-white flex items-center gap-2">
                      <ShieldCheck size={18} className="text-[#014DA4]" />
                      Secure Checkout
                    </h3>
                    <p className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Complete your subscription renewal payment securely via Razorpay.</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4.5 rounded-xl text-[13px] font-semibold text-slate-500 dark:text-slate-400 space-y-2.5">
                    <div className="flex justify-between">
                      <span>Statement Amount</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{bill.net_due.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 dark:text-white border-t border-slate-150 dark:border-slate-800 pt-2.5 mt-2.5 text-sm">
                      <span>Paying Total</span>
                      <span className="text-[#014DA4] dark:text-blue-400 font-mono">₹{bill.net_due.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1 select-none">
                    <button
                      onClick={() => setShowPayModal(false)}
                      className="w-1/3 h-10 rounded-xl border border-border dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer bg-transparent font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startPayment}
                      className="w-2/3 h-10 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm border-none cursor-pointer transition-all"
                    >
                      Pay Securely
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 border-3 border-slate-200 dark:border-slate-800 border-t-[#014DA4] rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-[14.5px] font-black text-slate-800 dark:text-slate-200">Processing Payment...</p>
                    <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center justify-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-600" /> Secured by SSL encryption
                    </p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-green-500/10 border border-green-200/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 size={26} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Payment Successful!</h3>
                    <p className="text-[12.5px] font-bold text-slate-400 dark:text-slate-500 mt-1.5">₹{bill.net_due.toFixed(2)} has been successfully credited to your account.</p>
                  </div>
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer mt-4 transition-all"
                  >
                    Close Invoice
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RowDetailsModal
        isOpen={!!viewingBill}
        onClose={() => setViewingBill(null)}
        title="Billing Details"
        data={viewingBill}
      />
    </motion.div>
  )
}
