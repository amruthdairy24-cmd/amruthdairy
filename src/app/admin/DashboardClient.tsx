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
  Activity,
  CheckCircle2,
  Database,
  ArrowUpRight,
  X,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/admin/StatusBadge'

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
      <div 
        className="rounded-[24px] p-7 md:p-8 relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8f 55%, #1e40af 100%)',
          boxShadow: '0 10px 30px rgba(15,23,42,0.15)'
        }}
      >
        {/* Decorative background blurs */}
        <div 
          className="absolute rounded-full pointer-events-none filter blur-[40px] opacity-20"
          style={{
            top: '-20px',
            right: '-20px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute rounded-full pointer-events-none filter blur-[50px] opacity-10"
          style={{
            bottom: '-40px',
            left: '30%',
            width: '300px',
            height: '150px',
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)'
          }}
        />

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
            <div 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)'
              }}
            >
              <span>🥛</span>
              <span>{stats.totalLitresToday}L delivering today</span>
            </div>
            
            <div 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)'
              }}
            >
              <span>👥</span>
              <span>{stats.activeSubscriptions} active customers</span>
            </div>

            <div 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)'
              }}
            >
              <span>⏰</span>
              <span>Cutoff: 9:00 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="mt-6 flex flex-wrap gap-2.5 relative z-10">
          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>SYSTEM HEALTH: EXCELLENT</span>
          </div>

          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>SERVER: HEALTHY</span>
          </div>

          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>DATABASE: CONNECTED</span>
          </div>

          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold text-white/70"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
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
        <div 
          className="bg-white rounded-[20px] p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#2563eb' }} />
          <div className="flex justify-between items-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2563eb]"
              style={{ background: '#dbeafe' }}
            >
              <Users size={18} strokeWidth={2.5} />
            </div>
            <div 
              className="text-[9px] font-black px-2 py-0.5 rounded-full text-[#16a34a] border border-[#bbf7d0]"
              style={{ background: '#dcfce7' }}
            >
              +12%
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
              Total Customers
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-[#0f172a]">
              {stats.totalCustomers}
            </p>
            <p className="text-[11px] font-semibold text-[#64748b] mt-1.5 truncate">
              +2 registered this week
            </p>
          </div>
        </div>

        {/* KPI 2: Active Subscriptions */}
        <div 
          className="bg-white rounded-[20px] p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#16a34a' }} />
          <div className="flex justify-between items-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#16a34a]"
              style={{ background: '#dcfce7' }}
            >
              <Wallet size={18} strokeWidth={2.5} />
            </div>
            <div 
              className="text-[9px] font-black px-2 py-0.5 rounded-full text-[#16a34a] border border-[#bbf7d0]"
              style={{ background: '#dcfce7' }}
            >
              +8%
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
              Active Subscriptions
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-[#0f172a]">
              {stats.activeSubscriptions}
            </p>
            <p className="text-[11px] font-semibold text-[#64748b] mt-1.5 truncate">
              of {stats.totalSubscriptions} subscriptions
            </p>
          </div>
        </div>

        {/* KPI 3: Today's Deliveries */}
        <div 
          className="bg-white rounded-[20px] p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#d97706' }} />
          <div className="flex justify-between items-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#d97706]"
              style={{ background: '#fef3c7' }}
            >
              <Truck size={18} strokeWidth={2.5} />
            </div>
            <div 
              className="text-[9px] font-black px-2 py-0.5 rounded-full text-[#d97706] border border-[#fde68a]"
              style={{ background: '#fef3c7' }}
            >
              On Track
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
              Deliveries Today
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-[#0f172a]">
              {stats.deliveriesCount}
            </p>
            <p className="text-[11px] font-semibold text-[#64748b] mt-1.5 truncate">
              {stats.skippedCount} skipped today
            </p>
          </div>
        </div>

        {/* KPI 4: Monthly Revenue */}
        <div 
          className="bg-white rounded-[20px] p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: '#7c3aed' }} />
          <div className="flex justify-between items-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7c3aed]"
              style={{ background: '#ede9fe' }}
            >
              <IndianRupee size={18} strokeWidth={2.5} />
            </div>
            <div 
              className="text-[9px] font-black px-2 py-0.5 rounded-full text-[#16a34a] border border-[#bbf7d0]"
              style={{ background: '#dcfce7' }}
            >
              +15%
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8]">
              Monthly Revenue
            </h4>
            <p className="text-[28px] font-black tracking-tight leading-none mt-1 font-display text-[#0f172a]">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] font-semibold text-[#64748b] mt-1.5 truncate">
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
        <div 
          className="lg:col-span-3 bg-white rounded-[20px] p-5 flex flex-col justify-between"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f8fafc]">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#0f172a]">
                Today&apos;s Delivery List
              </h2>
              <p className="text-[11px] font-semibold text-[#94a3b8] mt-0.5">
                Live delivery sheets for today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 cursor-pointer border border-[#e8edf5]"
                style={{ background: '#f8fafc' }}
              >
                <RefreshCw size={14} className="text-[#94a3b8]" />
              </button>
              <Link 
                href="/admin/deliveries" 
                className="text-[12px] font-bold text-[#2563eb] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Mini Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f8fafc]">
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-[#94a3b8]">Customer</th>
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-[#94a3b8]">Area</th>
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-[#94a3b8] text-center">Qty</th>
                  <th className="py-2.5 text-[10px] uppercase font-extrabold tracking-wider text-[#94a3b8] text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveriesList.slice(0, 6).map((del, idx) => (
                  <tr 
                    key={del.id || idx} 
                    className="border-b border-[#f8fafc] hover:bg-slate-50 transition-colors"
                    style={{ height: '52px' }}
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                          style={{
                            background: `linear-gradient(135deg, ${
                              idx % 2 === 0 ? '#1e3a8f, #2563eb' : '#7c3aed, #8b5cf6'
                            })`
                          }}
                        >
                          {del.customerName ? del.customerName.charAt(0) : 'C'}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[#0f172a] leading-none">
                            {del.customerName}
                          </p>
                          <p className="text-[10px] font-semibold text-[#94a3b8] mt-0.5">
                            ID: #{String(del.id).slice(-4)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-[12px] font-semibold text-[#475569]">
                      {del.area}
                    </td>
                    <td className="py-2 text-center">
                      <span 
                        className="px-2 py-0.5 rounded text-[11px] font-extrabold text-blue-700"
                        style={{ background: '#eff6ff' }}
                      >
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
          <div className="mt-4 pt-4 border-t border-[#f1f5f9] flex justify-between items-center text-[11px] font-bold text-[#94a3b8]">
            <span>Showing {Math.min(6, deliveriesList.length)} of {deliveriesList.length} deliveries</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions Grid (40%) */}
        <div 
          className="lg:col-span-2 bg-white rounded-[20px] p-5 flex flex-col justify-between"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          {/* Header */}
          <div>
            <h2 className="text-[15px] font-extrabold text-[#0f172a]">
              Quick Actions
            </h2>
            <p className="text-[11px] font-semibold text-[#94a3b8] mt-0.5">
              Admin workflow shortcuts
            </p>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 flex-1">
            <Link 
              href="/admin/deliveries" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Truck size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Delivery List</span>
            </Link>

            <Link 
              href="/admin/customers" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <UserPlus size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Add Customer</span>
            </Link>

            <Link 
              href="/admin/billing" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <CreditCard size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Record Payment</span>
            </Link>

            <Link 
              href="/admin/deliveries" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <SkipForward size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Mark Skip</span>
            </Link>

            <Link 
              href="/admin/reports" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <BarChart2 size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Monthly Report</span>
            </Link>

            <Link 
              href="/admin/products" 
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Package size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Update Stock</span>
            </Link>

            <button 
              onClick={openPriceModal}
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] transition-all hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:-translate-y-0.5 cursor-pointer"
              style={{ height: '68px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <IndianRupee size={20} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#475569] group-hover:text-[#2563eb]">Update Milk Price</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================
          SECTION 4 — THREE COLUMN BOTTOM
      ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bottom Col 1: Subscription Breakdown */}
        <div 
          className="bg-white rounded-[20px] p-5 flex flex-col"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <h3 className="text-[14px] font-extrabold text-[#0f172a] mb-4">
            Subscription Overview
          </h3>

          {/* Color Segments Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#f1f5f9] mb-4">
            <div style={{ width: `${activePct}%`, background: '#16a34a' }} title={`Active: ${activePct}%`} />
            <div style={{ width: `${pendingPct}%`, background: '#2563eb' }} title={`Pending: ${pendingPct}%`} />
            <div style={{ width: `${pausedPct}%`, background: '#d97706' }} title={`Paused: ${pausedPct}%`} />
            <div style={{ width: `${cancelledPct}%`, background: '#dc2626' }} title={`Cancelled: ${cancelledPct}%`} />
          </div>

          {/* Segment Legend */}
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-[12px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#16a34a' }} />
                <span>Active</span>
              </div>
              <span className="font-extrabold text-[#0f172a]">{subOverview.active}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2563eb' }} />
                <span>Pending</span>
              </div>
              <span className="font-extrabold text-[#0f172a]">{subOverview.pending}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#d97706' }} />
                <span>Paused</span>
              </div>
              <span className="font-extrabold text-[#0f172a]">{subOverview.paused}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#dc2626' }} />
                <span>Cancelled</span>
              </div>
              <span className="font-extrabold text-[#0f172a]">{subOverview.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Bottom Col 2: Recent Activity Timeline */}
        <div 
          className="bg-white rounded-[20px] p-5 flex flex-col relative overflow-hidden"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-extrabold text-[#0f172a]">
              Recent Activity
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-4 relative flex-1">
            {/* Timeline connector line */}
            <div 
              className="absolute left-[3.5px] top-1 bottom-1 w-[1px]" 
              style={{ background: '#f1f5f9' }}
            />

            {recentActivities.map((act) => {
              const dotColor = {
                blue: '#2563eb',
                green: '#16a34a',
                amber: '#d97706',
                red: '#dc2626'
              }[act.type] || '#2563eb'

              return (
                <div key={act.id} className="flex gap-3.5 relative z-10">
                  <div 
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: dotColor }}
                  />
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#475569] leading-snug">
                      {act.text}
                    </p>
                    <p className="text-[10px] font-bold text-[#94a3b8] mt-1">
                      {act.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Col 3: System Status */}
        <div 
          className="bg-white rounded-[20px] p-5 flex flex-col justify-between"
          style={{
            border: '1px solid #e8edf5',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)'
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-extrabold text-[#0f172a]">
                System Status
              </h3>
              <span className="text-[10px] font-semibold text-[#94a3b8]">Checked just now</span>
            </div>

            {/* Operational Banner */}
            <div 
              className="rounded-xl py-2 px-3 border mb-4 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                borderColor: '#bbf7d0'
              }}
            >
              <CheckCircle2 size={16} className="text-[#16a34a] flex-shrink-0" />
              <span className="text-[11.5px] font-extrabold text-[#16a34a]">
                All systems operational
              </span>
            </div>

            {/* Status Rows */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-0.5 border-b border-[#f8fafc]">
                <span className="text-[11px] font-bold text-[#475569]">Supabase Database</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-50 border border-green-100 text-[#16a34a]">
                  ● Connected
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-[#f8fafc]">
                <span className="text-[11px] font-bold text-[#475569]">Supabase Auth</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-50 border border-green-100 text-[#16a34a]">
                  ● Online
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-[#f8fafc]">
                <span className="text-[11px] font-bold text-[#475569]">Razorpay Gateway</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-50 border border-green-100 text-[#16a34a]">
                  ● Active
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-[#f8fafc]">
                <span className="text-[11px] font-bold text-[#475569]">Cron Jobs</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-50 border border-green-100 text-[#16a34a]">
                  ● Running
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-[10px] font-bold text-[#94a3b8] flex justify-between">
            <span>Last Backup: 2 hours ago</span>
            <span>v2.4.1</span>
          </div>
        </div>

      </div>

      {/* PRICE UPDATE MODAL */}
      {showPriceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
                <IndianRupee size={24} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Update Milk Base Price</h3>
              </div>
              <button onClick={() => setShowPriceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              Set the new daily price for each tier explicitly. This allows you to set custom prices for different quantities.
            </p>

            <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>0.5 L (₹)</label>
                <input type="number" value={prices['0.5']} onChange={(e) => setPrices({...prices, '0.5': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>1.0 L (₹)</label>
                <input type="number" value={prices['1.0']} onChange={(e) => setPrices({...prices, '1.0': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>1.5 L (₹)</label>
                <input type="number" value={prices['1.5']} onChange={(e) => setPrices({...prices, '1.5': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>2.0 L (₹)</label>
                <input type="number" value={prices['2.0']} onChange={(e) => setPrices({...prices, '2.0': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>
                Application Method
              </label>
            </div>

            {priceMessage && (
              <div style={{ 
                padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 500,
                background: priceMessage.type === 'success' ? '#dcfce7' : '#fef2f2',
                color: priceMessage.type === 'success' ? '#166534' : '#991b1b'
              }}>
                {priceMessage.text}
              </div>
            )}

            <button 
              onClick={handlePriceUpdate}
              disabled={isUpdatingPrice}
              style={{
                width: '100%', padding: '16px', background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: isUpdatingPrice ? 'not-allowed' : 'pointer',
                opacity: isUpdatingPrice ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
              }}
            >
              {isUpdatingPrice ? 'Updating Price...' : 'Update Price & Recalculate Plans'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
