'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, SkipForward, Palmtree, PlusCircle, FileText,
  Calendar, ArrowRight, AlertTriangle, HelpCircle, Clock, Milk,
  Wallet, CreditCard, CheckCircle, ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface DashboardData {
  success: boolean;
  profile: {
    full_name: string;
    phone: string;
    address: string;
  };
  subscription: {
    id: string;
    status: string;
    quantity_litres: number;
    monthly_amount: number;
    daily_rate: number;
    start_date: string;
    balance: number;
  } | null;
  waitlist?: {
    id: string;
    quantity_litres: number;
    requested_start_date: string;
    position: number;
    status: string;
    created_at: string;
  } | null;
  current_month: {
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
  } | null;
  upcoming_skips: Array<{ skip_date: string; credit_amount: number }>;
  active_vacation: { pause_start: string; pause_end: string; total_credit: number } | null;
  next_month_change: { quantity: number; amount: number } | null;
  recent_deliveries: Array<{ delivery_date: string; total_litres: number; delivery_status: string }>;
}

// Framer Motion Animation Configurations (with explicit types locked)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22
    }
  },
} as const

export default function CustomerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/customer/dashboard')
        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          setError(json.message || 'Failed to retrieve dashboard data')
        }
      } catch (err) {
        setError('Network error loading dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white dark:bg-cream-100 border border-border/40 dark:border-slate-800/85 rounded-2xl p-8 shadow-sm">
        <AlertTriangle className="text-rose-500 mx-auto mb-4" size={40} />
        <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Dashboard Unavailable</h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-6">{error || 'Failed to load details.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 h-11 bg-brand-secondary text-white font-extrabold rounded-xl text-xs shadow-md hover:bg-brand-secondary/90 border-none cursor-pointer transition-colors"
        >
          Retry Loading
        </button>
      </div>
    )
  }

  if (data.waitlist) {
    const wl = data.waitlist
    const requestedPlan = wl.quantity_litres === 0.5 ? '½ L' : `${wl.quantity_litres} L`
    const formattedStartDate = new Date(wl.requested_start_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="max-w-xl mx-auto space-y-6"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-[22px] sm:text-[28px] font-black text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2.5">
            Waitlist Status <Clock size={24} className="text-amber-600 animate-pulse" />
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1">You are currently in queue for a delivery slot.</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950"
        >
          <div className="absolute -top-5 -right-5 w-48 h-48 rounded-full pointer-events-none filter blur-[40px] opacity-20 bg-blue-400" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-200 mb-4 border border-white/10 backdrop-blur-md">
                <Milk size={10} />
                <span>{requestedPlan} Daily Plan</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-white font-display leading-tight mb-1">
                Amruth Milk Waitlist
              </p>
              <p className="text-xs text-blue-100/70 font-semibold">
                Requested Start: {formattedStartDate}
              </p>
            </div>

            <div className="text-left sm:text-right bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
              <p className="text-[10px] text-blue-200/70 uppercase tracking-widest font-black mb-1">Queue Position</p>
              <p className="text-4xl font-black font-mono tracking-tight leading-none text-white">
                #{wl.position}
              </p>
              <p className="text-[9px] text-blue-200/50 font-bold mt-1.5">Updates dynamically</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-cream-100 border border-border/40 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed"
        >
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
            <HelpCircle size={15} className="text-brand-secondary" /> How the Waitlist Works
          </h3>
          <p>At Amruth Dairy Farm, we limit our daily production to ensure every drop of milk is fresh, raw, and delivered directly within hours of milking.</p>
          <p>Due to high demand, all local delivery zones are operating at full capacity. As soon as a spot opens up in your delivery zone, your queue status will update.</p>
          <div className="pt-4 border-t border-border/40 dark:border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 font-bold">
            <span>Registered: {new Date(wl.created_at).toLocaleDateString('en-IN')}</span>
            <span>Status: <strong className="text-amber-600 uppercase font-black">{wl.status}</strong></span>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (!data.subscription) {
    if (typeof window !== 'undefined') window.location.href = '/onboarding';
    return null;
  }

  const { subscription, current_month, recent_deliveries, profile } = data
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const balanceVal = subscription.balance || 0
  const balanceText = balanceVal >= 0 ? `₹${balanceVal.toFixed(2)}` : `₹${Math.abs(balanceVal).toFixed(2)}`

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      {/* Soft farm background auras to give visual depth */}
      <div className="absolute -top-40 -right-40 w-[380px] h-[380px] bg-gradient-to-br from-emerald-500/5 to-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -left-40 w-[300px] h-[300px] bg-gradient-to-tr from-amber-400/5 to-emerald-400/5 blur-[90px] rounded-full pointer-events-none" />

      {/* ─── Header Section ─── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
            {greeting}, {profile.full_name.split(' ')[0]}!
          </h1>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1.5">
            <Calendar size={14} className="text-brand-secondary" />
            <span>{todayStr}</span>
          </p>
        </div>
      </motion.div>

      {/* ─── 1. HERO BENTO SECTION (Pasture Green welcome card) ─── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 text-white p-6 sm:p-8 shadow-md border border-white/10 z-10"
      >
        <div className="absolute -top-5 -right-5 w-60 h-60 rounded-full pointer-events-none filter blur-[50px] opacity-25 bg-amber-300" />

        {/* Custom Charming Farm Scene SVG Vector Illustration */}
        <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-8 bottom-0 opacity-90 pointer-events-none hidden md:block select-none transform translate-y-3">
          {/* Glowing rising sun */}
          <circle cx="160" cy="70" r="35" fill="url(#sunGlow)" opacity="0.3"/>
          <circle cx="160" cy="70" r="14" fill="#FCD34D"/>
          {/* Rolling Farm Hills */}
          <path d="M60 160C110 120 160 140 220 110C240 100 260 110 280 110V160H60Z" fill="#047857" opacity="0.3"/>
          <path d="M10 160C70 110 130 130 190 95C210 85 230 90 250 90V160H10Z" fill="#065F46" opacity="0.2"/>
          {/* Grazing Cow Silhouette */}
          <g transform="translate(95, 115) scale(0.4)" fill="#065F46" opacity="0.45">
            <path d="M50 30C42 30 38 28 35 25C32 28 28 30 20 30H10V45C10 47 12 48 14 48H18V65C18 68 22 68 22 65V48H38V65C38 68 42 68 42 65V48H46C48 48 50 47 50 45V30Z"/>
            <path d="M8 30C5 30 2 28 0 25V18C0 15 3 12 6 12H15L22 22C24 25 28 26 32 26H40L45 18C47 15 50 15 52 18L58 28C60 30 62 32 65 32H75C78 32 80 34 80 37V45C80 48 78 50 75 50H70V75C70 78 65 78 65 75V50H58V75C58 78 53 78 53 75V50H18V75C18 78 13 78 13 75V50H10C8 50 6 48 6 45V30H8Z"/>
            <path d="M78 20L84 10C86 7 90 7 92 10L98 20C100 23 98 27 94 27H82C78 27 76 23 78 20Z"/>
          </g>
          {/* Vintage Copper Milk Churn */}
          <g transform="translate(185, 95) scale(0.65)">
            <ellipse cx="15" cy="50" rx="11" ry="3" fill="#000000" opacity="0.2"/>
            <path d="M7 22C7 17 10 14 15 14C20 14 23 17 23 22V45C23 48 20 50 15 50C10 50 7 48 7 45V22Z" fill="url(#churnMetal)" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1"/>
            <path d="M10 14V8H20V14H10Z" fill="rgba(255, 255, 255, 0.8)"/>
            <rect x="8" y="4" width="14" height="4" rx="2" fill="#D97706"/>
            <path d="M4 14C4 10 7 8 10 8V10C8 10 6 12 6 14H4ZM26 14C26 10 23 8 20 8V10C22 10 24 12 24 14H26Z" fill="#D97706"/>
          </g>
          <defs>
            <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="1"/>
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="churnMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)"/>
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Content Layout */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-white/12 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-50 border border-white/10">
              <Milk size={11} className="text-amber-300 animate-pulse" />
              <span>{subscription.quantity_litres} Litre Daily Plan</span>
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight leading-tight mt-1">
                Welcome to your morning harvest! 🌾
              </h2>
              <p className="text-xs sm:text-sm font-medium text-emerald-100/90 mt-2 leading-relaxed">
                {subscription.status === 'active' 
                  ? 'Your raw, farm-fresh milk subscription is active. Delivered daily before 7:00 AM straight to your home.'
                  : 'Your subscription is currently paused. Resume your milk delivery anytime below.'
                }
              </p>
            </div>
            
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link 
                href="/dashboard/quantity" 
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-warm-white dark:bg-slate-950 text-emerald-850 dark:text-emerald-400 hover:bg-cream-100 dark:hover:bg-slate-900 font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer"
              >
                <span>Manage Subscription</span>
                <ArrowRight size={13} />
              </Link>
              <span className="text-[11px] font-bold text-emerald-55/80 bg-emerald-950/20 backdrop-blur-sm border border-white/5 py-2 px-3.5 rounded-xl select-none">
                Zone: Mangalore Metro
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 self-start md:self-center pr-6 flex flex-col items-end">
            <div className="bg-white/12 border border-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl min-w-[170px] text-left md:text-right shadow-sm select-none">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-200 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Next Delivery</span>
              </span>
              <p className="text-sm font-bold text-white font-display mt-1.5">Tomorrow, 7:00 AM</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. DASHBOARD STATS ROW (4 Gourmet Cream Cards) ─── */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10"
      >
        {/* Card 1: Account Balance */}
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Balance</p>
            <p className={cn("text-xl font-black font-mono tracking-tight mt-1 leading-none", balanceVal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {balanceVal >= 0 ? `${balanceText} Credit` : `${balanceText} Due`}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 truncate">
              {balanceVal >= 0 ? 'Adjusted in next bill' : 'Outstanding due amount'}
            </p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105", balanceVal >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-500")}>
            <Wallet size={18} />
          </div>
        </div>

        {/* Card 2: Deliveries This Month */}
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Days Delivered</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-none font-sans">
              {current_month?.days_delivered || 0} Days
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 truncate">
              Delivered this month
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <CheckCircle size={18} />
          </div>
        </div>

        {/* Card 3: Skipped Days */}
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Days Skipped</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-none font-sans">
              {current_month?.days_skipped || 0} Days
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 truncate">
              Refund applied: ₹{((current_month?.skip_credit || 0)).toFixed(0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <SkipForward size={17} />
          </div>
        </div>

        {/* Card 4: Plan Details */}
        <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Plan Capacity</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-none font-sans">
              {subscription.quantity_litres} Litres
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 truncate">
              Rate: ₹{subscription.daily_rate.toFixed(2)}/L
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Milk size={18} />
          </div>
        </div>
      </motion.div>

      {/* ─── 3. QUICK SERVICES SECTION ─── */}
      <motion.div variants={itemVariants} className="space-y-3.5 relative z-10">
        <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] px-1">Quick Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Skip Day */}
          <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.99 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Link href="/dashboard/skip" className="flex flex-col items-start bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-200 group h-full justify-between cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/20 transition-colors shadow-sm">
                <SkipForward size={20} strokeWidth={2.5} />
              </div>
              <div className="mt-5 text-left">
                <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">Skip Day</p>
                <p className="text-xs text-slate-400 dark:text-slate-550 font-medium leading-relaxed mt-2">
                  Need to skip tomorrow morning&apos;s milk? Make skips instantly before 9:00 PM cutoff.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-bold text-rose-600 flex items-center gap-1">
                <span>Configure Skips</span>
                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Vacation Pause */}
          <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.99 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Link href="/dashboard/vacation" className="flex flex-col items-start bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-200 group h-full justify-between cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors shadow-sm">
                <Palmtree size={20} strokeWidth={2.5} />
              </div>
              <div className="mt-5 text-left">
                <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">Vacation Pause</p>
                <p className="text-xs text-slate-400 dark:text-slate-555 font-medium leading-relaxed mt-2">
                  Going away on holiday? Pause deliveries temporarily for a custom date range.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-bold text-blue-600 flex items-center gap-1">
                <span>Set Dates</span>
                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Extra Milk */}
          <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.99 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Link href="/dashboard/extra" className="flex flex-col items-start bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-200 group h-full justify-between cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors shadow-sm">
                <PlusCircle size={20} strokeWidth={2.5} />
              </div>
              <div className="mt-5 text-left">
                <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">Extra Milk</p>
                <p className="text-xs text-slate-400 dark:text-slate-555 font-medium leading-relaxed mt-2">
                  Guests arriving? Request extra litres of milk for tomorrow morning&apos;s delivery.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-bold text-brand-secondary flex items-center gap-1">
                <span>Order Extra</span>
                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* My Bills */}
          <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.99 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Link href="/dashboard/bills" className="flex flex-col items-start bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-200 group h-full justify-between cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors shadow-sm">
                <FileText size={20} strokeWidth={2.5} />
              </div>
              <div className="mt-5 text-left">
                <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">My Bills</p>
                <p className="text-xs text-slate-400 dark:text-slate-555 font-medium leading-relaxed mt-2">
                  Review monthly transactions, carry-forwards, and download billing invoices.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-bold text-[#D97706] flex items-center gap-1">
                <span>View Statements</span>
                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── 4. BILLING & DELIVERIES GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">

        {/* Live Billing Calculator (Artisanal Split Card) */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-3.5">
          <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] px-1">Live Billing Calculator</h3>
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Breakdown Column */}
            <div className="p-6 flex-1 space-y-4">
              <div className="text-left">
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Statement Breakdown</h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1">Estimates for current month cycle</p>
              </div>
              
              <div className="space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px]">
                {/* Base Plan */}
                <div className="flex justify-between items-center py-2.5 first:pt-0">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                    <Milk size={14} className="text-brand-secondary" />
                    <span>Base Plan Amount:</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹{subscription.monthly_amount.toFixed(2)}</span>
                </div>

                {/* Skips Credit */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                    <SkipForward size={14} className="text-rose-500" />
                    <span>Skips Credit ({current_month?.days_skipped || 0} days):</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">-₹{(current_month?.skip_credit || 0).toFixed(2)}</span>
                </div>

                {/* Vacation Credit */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                    <Palmtree size={14} className="text-blue-500" />
                    <span>Vacation Credit ({current_month?.days_paused || 0} days):</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">-₹{(current_month?.pause_credit || 0).toFixed(2)}</span>
                </div>

                {/* Extra Milk Charges */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                    <PlusCircle size={14} className="text-emerald-500" />
                    <span>Extra Milk (+{current_month?.extra_litres_ordered || 0}L):</span>
                  </span>
                  <span className="font-bold text-rose-500 dark:text-rose-400 font-mono">+₹{(current_month?.extra_charges || 0).toFixed(2)}</span>
                </div>

                {/* Carry In Balance */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                    <Wallet size={14} className="text-amber-500" />
                    <span>Previous Carry-over:</span>
                  </span>
                  <span className={cn("font-bold font-mono", (current_month?.carry_in_balance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400")}>
                    {((current_month?.carry_in_balance || 0) >= 0 ? '-' : '+')}₹{Math.abs(current_month?.carry_in_balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Summary Highlight Box (Gourmet Gold Panel) */}
            <div className="bg-cream-100/50 dark:bg-slate-900/40 border-t md:border-t-0 md:border-l border-border/40 dark:border-slate-800/60 p-6 flex flex-col justify-between items-stretch md:w-[220px] lg:w-[240px] flex-shrink-0">
              <div className="space-y-1 text-left">
                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-[#D97706] text-[9px] px-2 py-0.5 rounded-full font-bold border border-amber-200/40">
                  <CreditCard size={10} />
                  <span>NET BALANCE</span>
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold pt-2">Total Net Due</p>
                <p className="text-3xl font-black font-mono text-slate-800 dark:text-white tracking-tight leading-none pt-1">
                  ₹{(current_month?.net_due || 0).toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold pt-1">
                  Billing cycle: {current_month?.billing_month || 'Current Month'}
                </p>
              </div>

              <div className="pt-6 space-y-2">
                <Link 
                  href="/dashboard/bills" 
                  className="w-full inline-flex items-center justify-center h-10 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs shadow-sm transition-all duration-150 gap-1 cursor-pointer"
                >
                  <span>Pay Balance</span>
                  <ArrowUpRight size={14} />
                </Link>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center font-bold">Statements generated monthly on the 1st</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Delivery Log (Artisanal Timeline Component) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-3.5">
          <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] px-1">Recent Delivery Log</h3>
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            {recent_deliveries.length === 0 ? (
              <div className="p-12 text-center text-[13px] font-medium text-slate-400 flex flex-col items-center gap-2">
                <Milk size={28} className="text-slate-200 dark:text-slate-800" />
                <span>No deliveries recorded in the last 7 days.</span>
              </div>
            ) : (
              <div className="relative border-l border-border/40 dark:border-slate-800/60 ml-2.5 pl-6 space-y-6 py-1">
                {recent_deliveries.slice(0, 5).map((delivery, index) => {
                  const delDate = new Date(delivery.delivery_date)
                  const dayName = delDate.toLocaleDateString('en-IN', { weekday: 'short' })
                  const dateNum = delDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  
                  return (
                    <div key={index} className="relative group">
                      
                      {/* Timeline Dot with Color-coding */}
                      <span 
                        className={cn(
                          "absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-cream-100 flex items-center justify-center shadow-sm z-10 transition-transform duration-200 group-hover:scale-110",
                          delivery.delivery_status === 'delivered' && "bg-emerald-600",
                          delivery.delivery_status === 'skipped' && "bg-rose-500",
                          delivery.delivery_status === 'paused' && "bg-blue-500",
                          delivery.delivery_status === 'pending' && "bg-[#D97706]"
                        )}
                      />
                      
                      {/* Entry details */}
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0 text-left">
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-none">
                            {dayName}, {dateNum}
                          </p>
                          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                            {delivery.total_litres} Litres Delivered
                          </p>
                        </div>
                        
                        <div>
                          {delivery.delivery_status === 'delivered' && (
                            <span className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200/30">Delivered</span>
                          )}
                          {delivery.delivery_status === 'skipped' && (
                            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200/30">Skipped</span>
                          )}
                          {delivery.delivery_status === 'paused' && (
                            <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200/30">Vacation</span>
                          )}
                          {delivery.delivery_status === 'pending' && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200/30">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
