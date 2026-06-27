'use client'

import { useState, useMemo } from 'react'
import {
  Wallet, Users, TrendingUp, CheckCircle2,
  Clock, XCircle, Droplets,
  ArrowUpRight, ChevronDown
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'
import { cn } from '@/lib/utils'

interface SubscriptionData {
  id: string
  start_date: string
  status: string
  quantity_litres: number
  profiles: { full_name: string }
}

/* ── STAT CARD ── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendUp,
}: {
  label: string
  value: string | number
  sub: string
  icon: any
  iconBg: string
  iconColor: string
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
      <div className="space-y-1.5 min-w-0 text-left relative z-10">
        <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-455 dark:text-slate-400">
          {label}
        </h4>
        <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display text-slate-800 dark:text-white">
          {value}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {trend && (
            <span className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-0.5",
              trendUp 
                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200/20' 
                : 'bg-rose-500/10 text-rose-700 border-rose-200/20'
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
            {sub}
          </span>
        </div>
      </div>
      
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-3xs border border-blue-500/5 flex-shrink-0 relative z-10"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} strokeWidth={2.2} />
      </div>
    </div>
  )
}

/* ── STATUS DISTRIBUTION ── */
function DistributionBar({ data }: { data: SubscriptionData[] }) {
  const active = data.filter((d) => d.status.toLowerCase() === 'active').length
  const inactive = data.filter((d) =>
    ['inactive', 'cancelled'].includes(d.status.toLowerCase())
  ).length
  const pending = data.filter((d) =>
    ['pending', 'waitlist'].includes(d.status.toLowerCase())
  ).length
  const vacation = data.filter((d) => d.status.toLowerCase() === 'vacation').length
  const total = data.length || 1

  const segments = [
    { label: 'Active', count: active, color: '#22c55e', bg: 'bg-emerald-50/35 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/20', dotColor: 'bg-emerald-500' },
    { label: 'Pending', count: pending, color: '#f59e0b', bg: 'bg-blue-50/35 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/20', dotColor: 'bg-blue-500' },
    { label: 'Vacation', count: vacation, color: '#3b82f6', bg: 'bg-amber-50/35 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/20', dotColor: 'bg-amber-400' },
    { label: 'Inactive', count: inactive, color: '#ef4444', bg: 'bg-rose-50/35 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/20', dotColor: 'bg-rose-500' },
  ].filter((s) => s.count > 0)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[16px] font-black text-slate-900 dark:text-white mb-0.5">
              Status Distribution
            </h3>
            <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500">
              Breakdown of all active and pending plans
            </p>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-display">
            {data.length}
            <span className="text-xs font-semibold text-slate-455 dark:text-slate-500 ml-1">
              total
            </span>
          </div>
        </div>

        {/* Bar */}
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-950/80 overflow-hidden flex mb-5 shadow-3xs">
          {segments.map((s) => (
            <div
              key={s.label}
              style={{
                height: '100%',
                width: `${(s.count / total) * 100}%`,
                backgroundColor: s.color,
                transition: 'width 0.6s ease',
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-2.5">
          {segments.map((s) => {
            const pct = Math.round((s.count / total) * 100)
            return (
              <div 
                key={s.label} 
                className={cn(
                  "flex justify-between items-center p-2.5 rounded-2xl border transition-all hover:bg-slate-50/40 dark:hover:bg-slate-800/30",
                  s.bg
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-3 h-3 rounded-full shadow-3xs", s.dotColor)} />
                  <span className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200">{s.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold text-slate-450">{pct}%</span>
                  <span className="font-black text-[14px] text-slate-800 dark:text-slate-100">{s.count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── QUANTITY BREAKDOWN ── */
function QuantityBreakdown({ data }: { data: SubscriptionData[] }) {
  const qtyMap: Record<number, number> = {}
  data.forEach((d) => {
    qtyMap[d.quantity_litres] = (qtyMap[d.quantity_litres] || 0) + 1
  })
  const entries = Object.entries(qtyMap).sort((a, b) => Number(a[0]) - Number(b[0]))
  const max = Math.max(...Object.values(qtyMap)) || 1

  const qtyColors: Record<string, string> = {
    '0.5': '#60a5fa',
    '1': '#34d399',
    '1.0': '#34d399',
    '1.5': '#a78bfa',
    '2': '#fb923c',
    '2.0': '#fb923c',
    '3': '#f472b6',
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-[16px] font-black text-slate-900 dark:text-white mb-0.5">
            Quantity Breakdown
          </h3>
          <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500">
            Daily demand metrics grouped by volume
          </p>
        </div>

        <div className="flex flex-col gap-3.5 mt-2">
          {entries.map(([qty, count]) => {
            const pct = (count / max) * 100
            const color = qtyColors[qty] || '#94a3b8'
            return (
              <div 
                key={qty} 
                className="flex items-center gap-3 p-1.5 rounded-xl transition-all hover:bg-slate-50/55 dark:hover:bg-slate-800/20"
              >
                <div className="w-9 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 text-right">
                  {qty}L
                </div>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-955/80 overflow-hidden shadow-3xs">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <div className="w-7 text-xs font-black text-slate-800 dark:text-slate-100 text-right shrink-0">
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total litres */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total daily output
        </span>
        <span className="text-lg font-black text-slate-800 dark:text-white font-display">
          {data.reduce((s, d) => s + d.quantity_litres, 0).toFixed(1)}
          <span className="text-xs font-semibold text-slate-455 dark:text-slate-555 ml-1">
            L / day
          </span>
        </span>
      </div>
    </div>
  )
}

/* ── MAIN CLIENT COMPONENT ── */
export function SubscriptionsClient({ data }: { data: SubscriptionData[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [qtyFilter, setQtyFilter] = useState('all')
  const [viewingEntry, setViewingEntry] = useState<SubscriptionData | null>(null)

  /* ── derived stats ── */
  const stats = useMemo(() => {
    const active = data.filter((d) => d.status.toLowerCase() === 'active').length
    const totalLitres = data.reduce((s, d) => s + d.quantity_litres, 0)
    const pending = data.filter((d) =>
      ['pending', 'waitlist'].includes(d.status.toLowerCase())
    ).length
    const avgQty = data.length ? (totalLitres / data.length).toFixed(1) : '0'
    return { active, totalLitres, pending, avgQty }
  }, [data])

  /* ── filter ── */
  const filtered = useMemo(() => {
    let d = data
    if (search)
      d = d.filter(
        (r) => r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    if (statusFilter !== 'all')
      d = d.filter((r) => r.status.toLowerCase() === statusFilter)
    if (qtyFilter !== 'all')
      d = d.filter((r) => r.quantity_litres === Number(qtyFilter))
    return d
  }, [data, search, statusFilter, qtyFilter])

  const uniqueStatuses = [...new Set(data.map((d) => d.status.toLowerCase()))]
  const uniqueQtys = [...new Set(data.map((d) => d.quantity_litres))].sort((a, b) => a - b)

  /* ── columns ── */
  const columns: ColumnDef<SubscriptionData>[] = [
    {
      header: 'Customer',
      cell: (row) => {
        const name = row.profiles?.full_name || 'Unknown'
        // Generate deterministic gradient avatars matching Customers page
        const nameParts = name.trim().split(/\s+/)
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : (nameParts[0]?.[0] || 'C').toUpperCase()
          
        const gradients = [
          "from-blue-500 to-indigo-600",
          "from-violet-500 to-fuchsia-600",
          "from-emerald-500 to-teal-600",
          "from-amber-500 to-orange-600",
          "from-rose-500 to-pink-600",
          "from-sky-500 to-blue-600"
        ]
        const charSum = name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
        const avatarBg = gradients[charSum % gradients.length]

        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs flex-shrink-0",
              avatarBg
            )}>
              {initials}
            </div>
            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {name}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                ID: #{row.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Plan',
      cell: (row) => {
        const plan = 'Standard Plan'
        return (
          <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/30 rounded-xl px-2.5 py-1 text-sky-750 dark:text-sky-300 font-extrabold text-[11px] shadow-3xs">
            <Droplets size={11} className="text-sky-500 dark:text-sky-400 flex-shrink-0" />
            <span>{plan}</span>
          </div>
        )
      },
    },
    {
      header: 'Daily Qty',
      align: 'center',
      cell: (row) => {
        const qty = row.quantity_litres
        const isHigh = qty >= 2
        return (
          <div className={cn(
            "inline-flex items-center gap-1 border rounded-xl px-2.5 py-1 text-[12px] font-black shadow-3xs",
            isHigh 
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400' 
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
          )}>
            <span>{qty}</span>
            <span className={cn(
              "text-[10px] font-bold",
              isHigh ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'
            )}>
              L
            </span>
          </div>
        )
      },
    },
    {
      header: 'Start Date',
      cell: (row) => {
        const d = new Date(row.start_date)
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000)
        return (
          <div>
            <p className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300 leading-none">{dateStr}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
              {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
            </p>
          </div>
        )
      },
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* ── PAGE HEADER ── */}
      <AdminHeader 
        title="Subscriptions" 
        description="Manage recurring milk delivery subscriptions." 
        icon={Wallet} 
        actionLabel="New Subscription"
      />

      {/* ── STAT CARDS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={stats.active}
          sub={`${Math.round((stats.active / (data.length || 1)) * 100)}% of total`}
          icon={CheckCircle2}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          trend="+12%"
          trendUp
        />
        <StatCard
          label="Daily Milk Output"
          value={`${stats.totalLitres.toFixed(1)}L`}
          sub="Litres delivered daily"
          icon={Droplets}
          iconBg="#dbeafe"
          iconColor="#2563eb"
          trend="+8%"
          trendUp
        />
        <StatCard
          label="Pending / Waitlist"
          value={stats.pending}
          sub="Awaiting activation"
          icon={Clock}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
        <StatCard
          label="Avg Daily Qty"
          value={`${stats.avgQty}L`}
          sub="Per subscriber"
          icon={TrendingUp}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
          trend="+3%"
          trendUp
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionBar data={data} />
        <QuantityBreakdown data={data} />
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 flex-wrap shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers or plans..."
            className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-200 outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        {/* Qty filter */}
        <div className="relative">
          <select
            value={qtyFilter}
            onChange={(e) => setQtyFilter(e.target.value)}
            className="h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-200 outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Quantities</option>
            {uniqueQtys.map((q) => (
              <option key={q} value={q}>{q}L / day</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        {/* Reset */}
        {(search || statusFilter !== 'all' || qtyFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setQtyFilter('all') }}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 text-xs font-bold cursor-pointer transition-all hover:bg-rose-100 dark:hover:bg-rose-950/50"
          >
            <XCircle size={13} />
            Reset
          </button>
        )}

        {/* Results count */}
        <div className="ml-auto">
          <span className="text-[11px] font-bold text-slate-455 dark:text-slate-550 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg px-2.5 py-1">
            {filtered.length} of {data.length} results
          </span>
        </div>
      </div>

      {/* ── TABLE ── */}
      <DataTable
        data={filtered}
        columns={columns}
        onView={(row) => setViewingEntry(row)}
      />

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Subscription Details"
        data={viewingEntry}
      />
    </div>
  )
}