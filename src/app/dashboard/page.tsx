'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, SkipForward, Palmtree, PlusCircle, FileText, Calendar, ArrowRight, AlertTriangle, HelpCircle, Clock, Milk } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  upcoming_adjustments?: Array<{ id: string, adjustment_type: string, amount: number, description: string, target_month: string, refund_status?: string }>;
}

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
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white border border-[#e8edf5] rounded-[24px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
        <h3 className="text-lg font-black text-[#0f172a]">Dashboard Unavailable</h3>
        <p className="text-xs font-semibold text-[#64748b] mt-2 mb-6">{error || 'Failed to load details.'}</p>
        <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center px-5 h-10 bg-[#2563eb] text-white font-extrabold rounded-xl text-xs shadow-sm hover:bg-[#1e40af] border-none cursor-pointer transition-colors">
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
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-black text-[#0f172a] font-display tracking-tight flex items-center gap-2">
            Waitlist Status <Clock size={24} className="text-[#2563eb] animate-pulse" />
          </h1>
          <p className="text-[13px] font-semibold text-[#64748b] mt-1">You are currently in queue for a delivery slot.</p>
        </div>

        <div className="rounded-[24px] p-6 sm:p-8 text-white relative overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.15)]" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8f 55%, #1e40af 100%)' }}>
          <div className="absolute rounded-full pointer-events-none filter blur-[40px] opacity-20" style={{ top: '-20px', right: '-20px', width: '200px', height: '200px', background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-200 mb-4 border border-white/10 backdrop-blur-md">
                <Milk size={10} />
                <span>{requestedPlan} Daily Plan</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-white font-display leading-tight mb-1">
                Amruth Milk Waitlist
              </p>
              <p className="text-xs text-blue-200/70 font-semibold">
                Requested Start: {formattedStartDate}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] text-blue-200/60 uppercase tracking-widest font-black mb-1">Queue Position</p>
              <p className="text-4xl font-black font-mono tracking-tight leading-none text-white">
                #{wl.position}
              </p>
              <p className="text-[9px] text-blue-200/50 font-bold mt-1">Updates dynamically</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e8edf5] rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-4 text-[13px] font-semibold text-[#64748b] leading-relaxed">
          <h3 className="text-sm font-black text-[#0f172a] flex items-center gap-2">
            <HelpCircle size={14} className="text-[#2563eb]" /> How the Waitlist Works
          </h3>
          <p>At Amruth Dairy Farm, we limit our daily production to ensure every drop of milk is fresh, raw, and delivered directly within hours of milking.</p>
          <p>Due to high demand, all local delivery zones are operating at full capacity. As soon as a spot opens up in your delivery zone, your queue status will update.</p>
          <div className="pt-3 border-t border-[#e8edf5] flex justify-between items-center text-[11px] text-[#94a3b8]">
            <span>Registered: {new Date(wl.created_at).toLocaleDateString('en-IN')}</span>
            <span>Status: <strong className="text-[#2563eb] uppercase font-black">{wl.status}</strong></span>
          </div>
        </div>
      </div>
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
  const balanceText = balanceVal >= 0 ? `₹${balanceVal.toFixed(2)} Credit` : `₹${Math.abs(balanceVal).toFixed(2)} Due`

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-black text-[#0f172a] font-display tracking-tight mb-1">
            {greeting}, {profile.full_name.split(' ')[0]}!
          </h1>
          <p className="text-[13px] font-semibold text-[#64748b] flex items-center gap-1.5 mt-1">
            <Calendar size={13} className="text-[#94a3b8]" />
            <span>{todayStr}</span>
          </p>
        </div>
      </div>

      <div className="rounded-[24px] p-6 sm:p-8 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8f 55%, #1e40af 100%)', boxShadow: '0 10px 30px rgba(15,23,42,0.15)' }}>
        <div className="absolute rounded-full pointer-events-none filter blur-[40px] opacity-20" style={{ top: '-20px', right: '-20px', width: '200px', height: '200px', background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-200 mb-4 border border-white/10 backdrop-blur-md">
              <Milk size={10} />
              <span>{subscription.quantity_litres} Litre Daily Plan</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white font-display leading-tight mb-1">
              Amruth Farm Milk
            </p>
            <p className="text-[13px] text-blue-200/70 font-medium">
              Delivered fresh before 7:00 AM every morning
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-blue-200/60 uppercase tracking-widest font-black mb-1">Account Balance</p>
            <p className={cn("text-3xl font-black font-mono tracking-tight leading-none", balanceVal >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
              {balanceText}
            </p>
            <p className="text-[9px] text-blue-200/50 font-bold mt-1">Carried forward to next bill</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] text-blue-200/50 font-bold mb-0.5 uppercase tracking-wider">Monthly Cost</p>
              <p className="text-[15px] font-black font-mono">₹{subscription.monthly_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-200/50 font-bold mb-0.5 uppercase tracking-wider">Daily Rate</p>
              <p className="text-[15px] font-black font-mono">₹{subscription.daily_rate.toFixed(2)}</p>
            </div>
          </div>
          <Link href="/dashboard/bills" className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-white text-[#0f172a] hover:bg-slate-50 font-extrabold text-[13px] shadow-sm transition-all gap-1.5 self-start sm:self-auto border border-white/20">
            <span>View Statements</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest pl-1">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/skip" className="bg-white border border-[#e8edf5] p-5 rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#ef4444]" />
            <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center">
              <SkipForward size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0f172a] leading-tight mb-1">Skip Day</p>
              <p className="text-[10px] font-bold text-[#94a3b8]">Before 9:00 PM</p>
            </div>
          </Link>
          <Link href="/dashboard/vacation" className="bg-white border border-[#e8edf5] p-5 rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#2563eb]" />
            <div className="w-10 h-10 rounded-xl bg-[#dbeafe] text-[#2563eb] flex items-center justify-center">
              <Palmtree size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0f172a] leading-tight mb-1">Vacation Pause</p>
              <p className="text-[10px] font-bold text-[#94a3b8]">Multi-day pause</p>
            </div>
          </Link>
          <Link href="/dashboard/extra" className="bg-white border border-[#e8edf5] p-5 rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#16a34a]" />
            <div className="w-10 h-10 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
              <PlusCircle size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0f172a] leading-tight mb-1">Extra Milk</p>
              <p className="text-[10px] font-bold text-[#94a3b8]">Order for tomorrow</p>
            </div>
          </Link>
          <Link href="/dashboard/bills" className="bg-white border border-[#e8edf5] p-5 rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#64748b]" />
            <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#64748b] flex items-center justify-center">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0f172a] leading-tight mb-1">My Bills</p>
              <p className="text-[10px] font-bold text-[#94a3b8]">Monthly invoice</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest pl-1">Live Billing Calculator</h3>
          <div className="bg-white border border-[#e8edf5] rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex justify-between items-center text-[13px] text-[#64748b] font-semibold pb-3 border-b border-[#e8edf5]">
              <span>Base Plan amount:</span>
              <span className="font-bold text-[#0f172a]">₹{subscription.monthly_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[13px] text-[#64748b] font-semibold pb-3 border-b border-[#e8edf5]">
              <span>Carry In balance (Previous month):</span>
              <span className={cn("font-bold", (current_month?.carry_in_balance || 0) >= 0 ? "text-[#16a34a]" : "text-[#ef4444]")}>
                {((current_month?.carry_in_balance || 0) >= 0 ? '-' : '+')}₹{Math.abs(current_month?.carry_in_balance || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 pb-3 text-[14px] font-black text-[#0f172a]">
              <span>Net Due for this month:</span>
              <span className="text-[#2563eb] font-mono text-[18px]">₹{(current_month?.net_due || 0).toFixed(2)}</span>
            </div>
            
            {data.upcoming_adjustments && data.upcoming_adjustments.length > 0 && (
              <div className="pt-3 border-t border-[#e8edf5] space-y-3">
                <p className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Unapplied Credits & Charges</p>
                <p className="text-[10px] font-semibold text-[#64748b]">These will automatically adjust your next month's bill.</p>
                {data.upcoming_adjustments.map((adj, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[13px] font-semibold text-[#64748b]">
                    <span className="flex flex-col">
                      <span className="text-[#0f172a] font-bold">
                        {adj.adjustment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        {adj.refund_status === 'requested' && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Refund Pending</span>}
                        {adj.refund_status === 'processed' && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Refunded</span>}
                      </span>
                      <span className="text-[11px] font-normal">{adj.description || 'Adjustment'}</span>
                    </span>
                    <span className={cn("font-bold", adj.adjustment_type.includes('credit') || adj.amount < 0 ? "text-[#16a34a]" : "text-[#ef4444]")}>
                      {adj.adjustment_type.includes('credit') || adj.amount < 0 ? '-' : '+'}₹{Math.abs(adj.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest pl-1">Recent Delivery Log</h3>
          <div className="bg-white border border-[#e8edf5] rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-[#e8edf5]">
            {recent_deliveries.length === 0 ? (
              <div className="p-8 text-center text-[13px] font-semibold text-[#94a3b8]">
                No deliveries recorded in the last 7 days.
              </div>
            ) : (
              recent_deliveries.slice(0, 5).map((delivery, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-[#f8fafc] transition-all">
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-[#0f172a] leading-tight">
                      {new Date(delivery.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[11px] text-[#64748b] font-semibold mt-0.5">
                      {delivery.total_litres} Litres Delivered
                    </p>
                  </div>
                  <div>
                    {delivery.delivery_status === 'delivered' && (
                      <span className="text-[9px] font-black uppercase text-[#16a34a] bg-[#dcfce7] px-2 py-0.5 rounded border border-[#bbf7d0]">Delivered</span>
                    )}
                    {delivery.delivery_status === 'skipped' && (
                      <span className="text-[9px] font-black uppercase text-[#ef4444] bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fecaca]">Skipped</span>
                    )}
                    {delivery.delivery_status === 'paused' && (
                      <span className="text-[9px] font-black uppercase text-[#2563eb] bg-[#dbeafe] px-2 py-0.5 rounded border border-[#bfdbfe]">Vacation</span>
                    )}
                    {delivery.delivery_status === 'pending' && (
                      <span className="text-[9px] font-black uppercase text-[#94a3b8] bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e8edf5]">Pending</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
