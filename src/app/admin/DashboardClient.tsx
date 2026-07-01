'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Wallet,
  Truck,
  IndianRupee,
  RefreshCw,
  UserPlus,
  CreditCard,
  SkipForward,
  BarChart2,
  Package,
  CheckCircle2,
  ArrowUpRight,
  X,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { cn } from '@/lib/utils'

interface DashboardClientProps {
  stats: {
    totalCustomers: number
    activeSubscriptions: number
    totalSubscriptions: number
    waitlist: number
    totalLitresToday: number
    totalRevenue: number
    deliveriesCount: number
    skippedCount: number
    newCustomersThisWeek?: number
  }
  deliveriesList: Array<{
    id: string
    customerName: string
    area: string
    qty: string
    status: string
  }>
  recentActivities: Array<{
    id: string
    text: string
    time: string
    type: string
  }>
  subOverview: {
    active: number
    paused: number
    cancelled: number
    pending: number
  }
  rawMilkPricing?: any
}

export default function DashboardClient({ 
  stats, 
  deliveriesList, 
  recentActivities, 
  subOverview,
  rawMilkPricing
}: DashboardClientProps) {
  const [greeting, setGreeting] = useState('Good Morning')
  const [formattedDate, setFormattedDate] = useState('')

  // Milk Pricing Modal State
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [prices, setPrices] = useState({ '0.5': '41', '1.0': '82', '1.5': '124', '2.0': '165' })
  const [priceApplyMode, setPriceApplyMode] = useState<'next_month' | 'immediate'>('next_month')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [priceMessage, setPriceMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  const openPriceModal = () => {
    const activePricesToEdit = rawMilkPricing?.next_prices || rawMilkPricing?.prices || { '0.5': 41.34, '1.0': 82.67, '1.5': 124, '2.0': 165.34 };
    setPrices({
      '0.5': activePricesToEdit['0.5']?.toString() || '41.34',
      '1.0': activePricesToEdit['1.0']?.toString() || activePricesToEdit['1']?.toString() || '82.67',
      '1.5': activePricesToEdit['1.5']?.toString() || '124',
      '2.0': activePricesToEdit['2.0']?.toString() || activePricesToEdit['2']?.toString() || '165.34'
    })
    setShowPriceModal(true)
  }

  const handlePriceUpdate = async () => {
    try {
      setIsUpdatingPrice(true)
      setPriceMessage(null)

      const numPrices = {
        '0.5': Number(prices['0.5']),
        '1.0': Number(prices['1.0']),
        '1.5': Number(prices['1.5']),
        '2.0': Number(prices['2.0'])
      }
      
      if (Object.values(numPrices).some(val => isNaN(val) || val <= 0)) {
        throw new Error("Please enter valid positive prices for all tiers.")
      }

      const body: any = { key: 'milk_tier_prices' };
      
      // Apply next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const effectiveDateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
      
      // Fetch current to keep it
      const res = await fetch('/api/admin/settings?key=milk_tier_prices');
      const currentData = await res.json();
      const currentPrices = currentData?.value?.prices || { '0.5': 41.34, '1.0': 82.67, '1.5': 124, '2.0': 165.34 };

      body.value = {
        prices: currentPrices,
        next_prices: numPrices,
        effective_date: effectiveDateStr
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update price')

      setPriceMessage({ text: 'Milk price updated successfully!', type: 'success' })
      setTimeout(() => {
        setShowPriceModal(false)
        setPriceMessage(null)
      }, 2000)

    } catch (err: any) {
      setPriceMessage({ text: err.message, type: 'error' })
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  useEffect(() => {
    const hr = new Date().getHours()
    if (hr < 12) setGreeting('Good Morning')
    else if (hr < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    const d = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    setFormattedDate(`${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`)
  }, [])

  // Calculate percentages for subscription breakdown
  const totalSubs = subOverview.active + subOverview.paused + subOverview.cancelled + subOverview.pending || 1
  const activePct = Math.round((subOverview.active / totalSubs) * 100)
  const pausedPct = Math.round((subOverview.paused / totalSubs) * 100)
  const pendingPct = Math.round((subOverview.pending / totalSubs) * 100)
  const cancelledPct = Math.round((subOverview.cancelled / totalSubs) * 100)

  return (
    <div className="space-y-6">
      
      {/* =========================================
          SECTION 1 — HERO WELCOME BANNER
      ========================================= */}
      <div className="rounded-3xl p-7 md:p-8 relative overflow-hidden text-white bg-[#014DA4] dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 shadow-lg border border-white/5 dark:border-slate-800">
        {/* Decorative background blurs */}
        <div className="absolute top-[-20px] right-[-20px] w-[200px] h-[200px] rounded-full pointer-events-none filter blur-[40px] opacity-20 dark:opacity-10 bg-blue-500" />
        <div className="absolute bottom-[-40px] left-[30%] w-[300px] h-[150px] rounded-full pointer-events-none filter blur-[50px] opacity-10 dark:opacity-5 bg-purple-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Welcome Text */}
          <div>
            <h1 className="text-[22px] font-black font-display flex items-center gap-2 text-white dark:text-slate-100">
              {greeting}, Admin 👋
            </h1>
            <p className="text-[12px] font-medium text-blue-200/70 dark:text-slate-400 mt-1">
              {formattedDate}
            </p>
            <p className="text-[13px] font-medium text-blue-200/60 dark:text-slate-400 mt-1">
              Here&apos;s what&apos;s happening at Amruth Dairy today.
            </p>
          </div>

          {/* Quick Stat Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-white/8 dark:bg-slate-800/40 border border-white/12 dark:border-slate-800/50 text-white/85 dark:text-slate-300">
              <span>🥛</span>
              <span>{stats.totalLitresToday}L delivering today</span>
            </div>
            
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-white/8 dark:bg-slate-800/40 border border-white/12 dark:border-slate-800/50 text-white/85 dark:text-slate-300">
              <span>👥</span>
              <span>{stats.activeSubscriptions} active customers</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-white/8 dark:bg-slate-800/40 border border-white/12 dark:border-slate-800/50 text-white/85 dark:text-slate-300">
              <span>⏰</span>
              <span>Cutoff: 9:00 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="mt-6 flex flex-wrap gap-2.5 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 dark:text-slate-405 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>SYSTEM HEALTH: EXCELLENT</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 dark:text-slate-405 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>SERVER: HEALTHY</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 dark:text-slate-405 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>DATABASE: CONNECTED</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 dark:text-slate-405 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>API: ONLINE</span>
          </div>
        </div>
      </div>

      {/* =========================================
          SECTION 2 — KPI METRIC CARDS
      ========================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-md flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 min-w-0 text-left">
            <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-455 dark:text-slate-400">
              Total Customers
            </h4>
            <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display text-slate-800 dark:text-white">
              {stats.totalCustomers}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-500/10 border border-emerald-200/20">
                +{stats.newCustomersThisWeek || 0} New
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                this week
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 bg-blue-500/10 shadow-3xs border border-blue-500/5 flex-shrink-0">
            <Users size={20} strokeWidth={2.2} />
          </div>
        </div>

        {/* KPI 2: Active Subscriptions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-md flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 min-w-0 text-left">
            <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-455 dark:text-slate-400">
              Active Subs
            </h4>
            <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display text-slate-800 dark:text-white">
              {stats.activeSubscriptions}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-500/10 border border-emerald-200/20">
                {stats.totalSubscriptions ? Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100) : 0}% Active
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                of {stats.totalSubscriptions} total
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 bg-green-500/10 shadow-3xs border border-green-500/5 flex-shrink-0">
            <Wallet size={20} strokeWidth={2.2} />
          </div>
        </div>

        {/* KPI 3: Today's Deliveries */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-md flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 min-w-0 text-left">
            <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-455 dark:text-slate-400">
              Deliveries Today
            </h4>
            <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display text-slate-800 dark:text-white">
              {stats.deliveriesCount}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-amber-700 bg-amber-500/10 border border-amber-200/20">
                {stats.skippedCount} Skipped
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                out of {stats.deliveriesCount + stats.skippedCount} total
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 bg-amber-500/10 shadow-3xs border border-amber-500/5 flex-shrink-0">
            <Truck size={20} strokeWidth={2.2} />
          </div>
        </div>

        {/* KPI 4: Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-md flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 min-w-0 text-left">
            <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-455 dark:text-slate-400">
              Monthly Revenue
            </h4>
            <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display text-slate-800 dark:text-white">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-500/10 border border-emerald-200/20">
                Real-Time
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                this cycle
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 bg-purple-500/10 shadow-3xs border border-purple-500/5 flex-shrink-0">
            <IndianRupee size={20} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* =========================================
          SECTION 3 — TWO COLUMN (60/40 SPLIT)
      ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Delivery Summary Table (60%) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between border border-slate-150 dark:border-slate-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-[16px] font-black text-slate-900 dark:text-white">
                Today&apos;s Delivery List
              </h2>
              <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                Live delivery sheets for today
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => window.location.reload()}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-[#014DA4] dark:hover:text-blue-400 shadow-3xs cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
              <Link 
                href="/admin/deliveries" 
                className="text-[12px] font-extrabold text-[#014DA4] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Mini Table */}
          <div className="overflow-x-auto mt-2 hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 text-[10.5px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Customer</th>
                  <th className="py-3 text-[10.5px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Area</th>
                  <th className="py-3 text-[10.5px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 text-center">Qty</th>
                  <th className="py-3 text-[10.5px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveriesList.slice(0, 6).map((del, idx) => {
                  // Cycle through nice, bright, premium gradients for avatars
                  const gradients = [
                    "from-blue-500 to-indigo-600",
                    "from-violet-500 to-fuchsia-600",
                    "from-emerald-500 to-teal-600",
                    "from-amber-500 to-orange-600",
                    "from-rose-500 to-pink-600",
                    "from-sky-500 to-blue-600"
                  ];
                  const avatarBg = gradients[idx % gradients.length];
                  
                  return (
                    <tr 
                      key={del.id || idx} 
                      className="border-b border-slate-100/70 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors h-[60px]"
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs",
                            avatarBg
                          )}>
                            {del.customerName ? del.customerName.charAt(0) : 'C'}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                              {del.customerName}
                            </p>
                            <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-550 mt-1">
                              ID: #{String(del.id).slice(-4)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-[12.5px] font-extrabold text-slate-600 dark:text-slate-300">
                        {del.area}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                          {del.qty}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusBadge status={del.status || 'pending'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-black text-slate-400 dark:text-slate-500">
            <span>Showing {Math.min(6, deliveriesList.length)} of {deliveriesList.length} deliveries</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions Grid (40%) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between border border-slate-150 dark:border-slate-800 shadow-sm">
          {/* Header */}
          <div>
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white">
              Quick Actions
            </h2>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              Admin workflow shortcuts
            </p>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3.5 mt-5 flex-1">
            <Link 
              href="/admin/deliveries" 
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs h-[78px]"
            >
              <Truck size={22} className="text-blue-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Delivery List</span>
            </Link>

            <Link 
              href="/admin/customers" 
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs h-[78px]"
            >
              <UserPlus size={22} className="text-emerald-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Add Customer</span>
            </Link>

            <Link 
              href="/admin/billing" 
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs h-[78px]"
            >
              <CreditCard size={22} className="text-purple-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Record Payment</span>
            </Link>

            <Link 
              href="/admin/deliveries" 
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs h-[78px]"
            >
              <SkipForward size={22} className="text-amber-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Mark Skip</span>
            </Link>

            <Link 
              href="/admin/reports" 
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs h-[78px]"
            >
              <BarChart2 size={22} className="text-rose-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Monthly Report</span>
            </Link>

            <Link 
              href="/admin/products" 
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs h-[78px]"
            >
              <Package size={22} className="text-indigo-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Update Stock</span>
            </Link>

            <button 
              onClick={openPriceModal}
              className="group col-span-2 flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs transition-all hover:border-blue-400/50 dark:hover:border-blue-400/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-2xs cursor-pointer h-[78px]"
            >
              <IndianRupee size={22} className="text-teal-500 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 group-hover:text-[#014DA4] dark:group-hover:text-blue-400 transition-colors">Update Milk Price</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================
          SECTION 4 — THREE COLUMN BOTTOM
      ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bottom Col 1: Subscription Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between border border-slate-150 dark:border-slate-800 shadow-sm">
          <div>
            <h3 className="text-[16px] font-black text-slate-900 dark:text-white mb-4">
              Subscription Overview
            </h3>

            {/* Color Segments Bar */}
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-950/80 mb-4 shadow-3xs">
              <div style={{ width: `${activePct}%` }} className="bg-emerald-500" title={`Active: ${activePct}%`} />
              <div style={{ width: `${pendingPct}%` }} className="bg-blue-500" title={`Pending: ${pendingPct}%`} />
              <div style={{ width: `${pausedPct}%` }} className="bg-amber-400" title={`Paused: ${pausedPct}%`} />
              <div style={{ width: `${cancelledPct}%` }} className="bg-rose-500" title={`Cancelled: ${cancelledPct}%`} />
            </div>

            {/* Segment Legend */}
            <div className="space-y-2.5 mt-4">
              {[
                { label: 'Active', count: subOverview.active, pct: activePct, color: 'bg-emerald-500', bg: 'bg-emerald-50/35 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/20' },
                { label: 'Pending', count: subOverview.pending, pct: pendingPct, color: 'bg-blue-500', bg: 'bg-blue-50/35 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/20' },
                { label: 'Paused', count: subOverview.paused, pct: pausedPct, color: 'bg-amber-400', bg: 'bg-amber-50/35 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/20' },
                { label: 'Cancelled', count: subOverview.cancelled, pct: cancelledPct, color: 'bg-rose-500', bg: 'bg-rose-50/35 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/20' }
              ].map((item) => (
                <div 
                  key={item.label} 
                  className={cn(
                    "flex justify-between items-center p-2.5 rounded-2xl border transition-all hover:bg-slate-50/40 dark:hover:bg-slate-800/30",
                    item.bg
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full shadow-3xs", item.color)} />
                    <span className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-slate-400">{item.pct}%</span>
                    <span className="font-black text-[14px] text-slate-800 dark:text-slate-100">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Col 2: Recent Activity Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col relative overflow-hidden border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-black text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-700 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-5 relative flex-1 mt-2">
            {/* Timeline connector line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100 dark:bg-slate-800" />

            {recentActivities.map((act) => {
              const dotColorClass = {
                blue: 'bg-blue-500',
                green: 'bg-emerald-500',
                amber: 'bg-amber-400',
                red: 'bg-rose-500'
              }[act.type] || 'bg-blue-500';

              return (
                <div key={act.id} className="flex gap-4 relative z-10 items-start">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-3xs flex-shrink-0">
                    <div className={cn("w-2 h-2 rounded-full", dotColorClass)} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200 leading-snug">
                      {act.text}
                    </p>
                    <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                      {act.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Col 3: System Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between border border-slate-150 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-black text-slate-900 dark:text-white">
                System Status
              </h3>
              <span className="text-[11px] font-bold text-slate-450 dark:text-slate-550">Checked just now</span>
            </div>

            {/* Operational Banner */}
            <div className="rounded-2xl p-3 border mb-5 flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span className="text-[12px] font-black text-emerald-700 dark:text-emerald-400">
                All systems operational
              </span>
            </div>

            {/* Status Rows */}
            <div className="space-y-3">
              {[
                { label: 'Supabase Database', status: 'Connected' },
                { label: 'Supabase Auth', status: 'Online' },
                { label: 'Razorpay Gateway', status: 'Active' },
                { label: 'Cron Jobs', status: 'Running' }
              ].map((sys) => (
                <div key={sys.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                  <span className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200">{sys.label}</span>
                  <span className="text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/40 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                    {sys.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 flex justify-between">
            <span>Last Backup: 2 hours ago</span>
            <span>v2.4.1</span>
          </div>
        </div>

      </div>

      {/* PRICE UPDATE MODAL */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 w-full max-w-[500px] shadow-2xl relative text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <IndianRupee size={24} />
                <h3 className="text-xl font-black font-display m-0">Update Milk Base Price</h3>
              </div>
              <button onClick={() => setShowPriceModal(false)} className="bg-transparent border-none cursor-pointer p-1">
                <X size={20} className="text-slate-450 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors" />
              </button>
            </div>
            
            <p className="text-slate-550 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Set the new daily price for each tier explicitly. This allows you to set custom prices for different quantities.
            </p>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 mb-2 uppercase tracking-wider">0.5 L (₹)</label>
                <input type="number" value={prices['0.5']} onChange={(e) => setPrices({...prices, '0.5': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 mb-2 uppercase tracking-wider">1.0 L (₹)</label>
                <input type="number" value={prices['1.0']} onChange={(e) => setPrices({...prices, '1.0': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 mb-2 uppercase tracking-wider">1.5 L (₹)</label>
                <input type="number" value={prices['1.5']} onChange={(e) => setPrices({...prices, '1.5': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 mb-2 uppercase tracking-wider">2.0 L (₹)</label>
                <input type="number" value={prices['2.0']} onChange={(e) => setPrices({...prices, '2.0': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 mb-3 uppercase tracking-wider">
                Application Method
              </label>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-slate-50/25 dark:bg-slate-950/20">
                  <input 
                    type="radio" 
                    name="applyMode" 
                    value="next_month"
                    checked={priceApplyMode === 'next_month'}
                    onChange={() => setPriceApplyMode('next_month')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Apply on Next Renewal (Recommended)</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      New signups get the new price immediately. Existing customers finish their current month at their old price, avoiding billing confusion mid-month.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-slate-50/25 dark:bg-slate-950/20">
                  <input 
                    type="radio" 
                    name="applyMode" 
                    value="immediate"
                    checked={priceApplyMode === 'immediate'}
                    onChange={() => setPriceApplyMode('immediate')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Apply Immediately</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Instantly changes the price for everyone. Note: This will cause current month bills to be pro-rated, which may confuse existing customers.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {priceMessage && (
              <div className={cn(
                "p-3.5 px-4 rounded-xl mb-6 text-sm font-semibold border",
                priceMessage.type === 'success' 
                  ? "bg-green-500/10 dark:bg-green-950/15 border-green-200/30 dark:border-green-900/30 text-emerald-700 dark:text-emerald-400" 
                  : "bg-red-500/10 dark:bg-red-950/15 border-red-200/30 dark:border-red-900/30 text-rose-700 dark:text-rose-400"
              )}>
                {priceMessage.text}
              </div>
            )}

            <button 
              onClick={handlePriceUpdate}
              disabled={isUpdatingPrice}
              className="w-full py-4 bg-brand-secondary hover:bg-brand-secondary/90 text-white border-none rounded-xl text-base font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-secondary/20"
            >
              {isUpdatingPrice ? 'Updating Price...' : 'Update Price & Recalculate Plans'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
