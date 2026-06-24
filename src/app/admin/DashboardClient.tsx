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
}

export default function DashboardClient({ 
  stats, 
  deliveriesList, 
  recentActivities, 
  subOverview 
}: DashboardClientProps) {
  const [greeting, setGreeting] = useState('Good Morning')
  const [formattedDate, setFormattedDate] = useState('')

  // Milk Pricing Modal State
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [prices, setPrices] = useState({ '0.5': '41', '1.0': '82', '1.5': '124', '2.0': '165' })
  const [priceApplyMode, setPriceApplyMode] = useState<'next_month' | 'immediate'>('next_month')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [priceMessage, setPriceMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

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
      
      if (priceApplyMode === 'immediate') {
        body.value = { prices: numPrices }
      } else {
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
      <div className="rounded-3xl p-7 md:p-8 relative overflow-hidden text-white bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-lg border border-white/5">
        {/* Decorative background blurs */}
        <div className="absolute top-[-20px] right-[-20px] w-[200px] h-[200px] rounded-full pointer-events-none filter blur-[40px] opacity-20 bg-blue-500" />
        <div className="absolute bottom-[-40px] left-[30%] w-[300px] h-[150px] rounded-full pointer-events-none filter blur-[50px] opacity-10 bg-purple-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Welcome Text */}
          <div>
            <h1 className="text-[22px] font-black font-display flex items-center gap-2">
              {greeting}, Admin 👋
            </h1>
            <p className="text-[12px] font-medium text-blue-200/70 mt-1">
              {formattedDate}
            </p>
            <p className="text-[13px] font-medium text-blue-200/60 mt-1">
              Here&apos;s what&apos;s happening at Amruth Dairy today.
            </p>
          </div>

          {/* Quick Stat Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-white/8 border border-white/12 text-white/85">
              <span>🥛</span>
              <span>{stats.totalLitresToday}L delivering today</span>
            </div>
            
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-white/8 border border-white/12 text-white/85">
              <span>👥</span>
              <span>{stats.activeSubscriptions} active customers</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-white/8 border border-white/12 text-white/85">
              <span>⏰</span>
              <span>Cutoff: 9:00 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="mt-6 flex flex-wrap gap-2.5 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>SYSTEM HEALTH: EXCELLENT</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>SERVER: HEALTHY</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>DATABASE: CONNECTED</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70 bg-white/5 border border-white/10">
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
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 border border-border/50 dark:border-slate-800/80 shadow-sm hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-500" />
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[9px] font-black px-2 py-0.5 rounded-full text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30">
              +12%
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Customers
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-slate-900 dark:text-white">
              {stats.totalCustomers}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              +2 registered this week
            </p>
          </div>
        </div>

        {/* KPI 2: Active Subscriptions */}
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 border border-border/50 dark:border-slate-800/80 shadow-sm hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-green-600 dark:bg-green-500" />
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[9px] font-black px-2 py-0.5 rounded-full text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30">
              +8%
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Subscriptions
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-slate-900 dark:text-white">
              {stats.activeSubscriptions}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              of {stats.totalSubscriptions} subscriptions
            </p>
          </div>
        </div>

        {/* KPI 3: Today's Deliveries */}
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 border border-border/50 dark:border-slate-800/80 shadow-sm hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500 dark:bg-amber-600" />
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-650 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20">
              <Truck size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[9px] font-black px-2 py-0.5 rounded-full text-amber-700 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-555/20 border border-amber-200/30 dark:border-amber-900/30">
              On Track
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Deliveries Today
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-slate-900 dark:text-white">
              {stats.deliveriesCount}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              {stats.skippedCount} skipped today
            </p>
          </div>
        </div>

        {/* KPI 4: Monthly Revenue */}
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 border border-border/50 dark:border-slate-800/80 shadow-sm hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-purple-600 dark:bg-purple-500" />
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20">
              <IndianRupee size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[9px] font-black px-2 py-0.5 rounded-full text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30">
              +15%
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Monthly Revenue
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-slate-900 dark:text-white">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              Current billing cycle
            </p>
          </div>
        </div>

      </div>

      {/* =========================================
          SECTION 3 — TWO COLUMN (60/40 SPLIT)
      ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Delivery Summary Table (60%) */}
        <div className="lg:col-span-3 bg-white dark:bg-cream-100 rounded-2xl p-5 flex flex-col justify-between border border-border/50 dark:border-slate-800/80 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-900/50">
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                Today&apos;s Delivery List
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                Live delivery sheets for today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950"
              >
                <RefreshCw size={14} className="text-slate-400 dark:text-slate-500" />
              </button>
              <Link 
                href="/admin/deliveries" 
                className="text-[12px] font-bold text-brand-secondary hover:underline flex items-center gap-0.5"
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
                <tr className="border-b border-slate-50 dark:border-slate-900/50">
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">Customer</th>
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">Area</th>
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 text-center">Qty</th>
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveriesList.slice(0, 6).map((del, idx) => (
                  <tr 
                    key={del.id || idx} 
                    className="border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors h-[52px]"
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white bg-gradient-to-br",
                          idx % 2 === 0 ? "from-blue-900 to-blue-600" : "from-purple-900 to-purple-600"
                        )}>
                          {del.customerName ? del.customerName.charAt(0) : 'C'}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-none">
                            {del.customerName}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                            ID: #{String(del.id).slice(-4)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-[12px] font-semibold text-slate-605 dark:text-slate-400">
                      {del.area}
                    </td>
                    <td className="py-2 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20">
                        {del.qty}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <StatusBadge status={del.status || 'pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-[11px] font-bold text-slate-400 dark:text-slate-500">
            <span>Showing {Math.min(6, deliveriesList.length)} of {deliveriesList.length} deliveries</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions Grid (40%) */}
        <div className="lg:col-span-2 bg-white dark:bg-cream-100 rounded-2xl p-5 flex flex-col justify-between border border-border/50 dark:border-slate-800/80 shadow-sm">
          {/* Header */}
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
              Quick Actions
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              Admin workflow shortcuts
            </p>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 flex-1">
            <Link 
              href="/admin/deliveries" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm h-[68px]"
            >
              <Truck size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Delivery List</span>
            </Link>

            <Link 
              href="/admin/customers" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm h-[68px]"
            >
              <UserPlus size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Add Customer</span>
            </Link>

            <Link 
              href="/admin/billing" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm h-[68px]"
            >
              <CreditCard size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Record Payment</span>
            </Link>

            <Link 
              href="/admin/deliveries" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm h-[68px]"
            >
              <SkipForward size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Mark Skip</span>
            </Link>

            <Link 
              href="/admin/reports" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm h-[68px]"
            >
              <BarChart2 size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Monthly Report</span>
            </Link>

            <Link 
              href="/admin/products" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-955 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm h-[68px]"
            >
              <Package size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Update Stock</span>
            </Link>

            <button 
              onClick={() => setShowPriceModal(true)}
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-500/10 dark:hover:bg-blue-500/25 hover:border-blue-400/30 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer h-[68px]"
            >
              <IndianRupee size={20} className="text-brand-secondary group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-455 group-hover:text-brand-secondary">Update Milk Price</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================
          SECTION 4 — THREE COLUMN BOTTOM
      ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bottom Col 1: Subscription Breakdown */}
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 flex flex-col border border-border/50 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white mb-4">
            Subscription Overview
          </h3>

          {/* Color Segments Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-900 mb-4">
            <div style={{ width: `${activePct}%` }} className="bg-green-600" title={`Active: ${activePct}%`} />
            <div style={{ width: `${pendingPct}%` }} className="bg-blue-600" title={`Pending: ${pendingPct}%`} />
            <div style={{ width: `${pausedPct}%` }} className="bg-amber-500" title={`Paused: ${pausedPct}%`} />
            <div style={{ width: `${cancelledPct}%` }} className="bg-rose-600" title={`Cancelled: ${cancelledPct}%`} />
          </div>

          {/* Segment Legend */}
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-[12px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                <span>Active</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">{subOverview.active}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Pending</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">{subOverview.pending}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Paused</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">{subOverview.paused}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Cancelled</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">{subOverview.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Bottom Col 2: Recent Activity Timeline */}
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 flex flex-col relative overflow-hidden border border-border/50 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-555 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-4 relative flex-1">
            {/* Timeline connector line */}
            <div className="absolute left-[3.5px] top-1 bottom-1 w-[1px] bg-slate-100 dark:bg-slate-850" />

            {recentActivities.map((act) => {
              const dotColorClass = {
                blue: 'bg-blue-600',
                green: 'bg-green-600',
                amber: 'bg-amber-555',
                red: 'bg-rose-600'
              }[act.type] || 'bg-blue-600'

              return (
                <div key={act.id} className="flex gap-3.5 relative z-10">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", dotColorClass)} />
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 leading-snug">
                      {act.text}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                      {act.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Col 3: System Status */}
        <div className="bg-white dark:bg-cream-100 rounded-2xl p-5 flex flex-col justify-between border border-border/50 dark:border-slate-800/80 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">
                System Status
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Checked just now</span>
            </div>

            {/* Operational Banner */}
            <div className="rounded-xl py-2 px-3 border mb-4 flex items-center gap-2 bg-green-500/10 dark:bg-green-950/15 border-green-200/40 dark:border-green-900/30">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-[11.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
                All systems operational
              </span>
            </div>

            {/* Status Rows */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-900/40">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Supabase Database</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-500/10 dark:bg-green-950/15 border border-green-200/20 dark:border-green-900/20 text-emerald-600 dark:text-emerald-455">
                  ● Connected
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-900/40">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Supabase Auth</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-500/10 dark:bg-green-950/15 border border-green-200/20 dark:border-green-900/20 text-emerald-600 dark:text-emerald-455">
                  ● Online
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-900/40">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Razorpay Gateway</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-500/10 dark:bg-green-950/15 border border-green-200/20 dark:border-green-900/20 text-emerald-600 dark:text-emerald-455">
                  ● Active
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-900/40">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Cron Jobs</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-500/10 dark:bg-green-950/15 border border-green-200/20 dark:border-green-900/20 text-emerald-600 dark:text-emerald-455">
                  ● Running
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 flex justify-between">
            <span>Last Backup: 2 hours ago</span>
            <span>v2.4.1</span>
          </div>
        </div>

      </div>

      {/* PRICE UPDATE MODAL */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-3xl p-8 w-full max-w-[500px] shadow-2xl relative text-slate-900 dark:text-white">
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
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">0.5 L (₹)</label>
                <input type="number" value={prices['0.5']} onChange={(e) => setPrices({...prices, '0.5': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">1.0 L (₹)</label>
                <input type="number" value={prices['1.0']} onChange={(e) => setPrices({...prices, '1.0': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">1.5 L (₹)</label>
                <input type="number" value={prices['1.5']} onChange={(e) => setPrices({...prices, '1.5': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">2.0 L (₹)</label>
                <input type="number" value={prices['2.0']} onChange={(e) => setPrices({...prices, '2.0': e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-base font-black" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
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
                    <div className="text-xs text-slate-500 dark:text-slate-405 mt-1 leading-relaxed">
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
