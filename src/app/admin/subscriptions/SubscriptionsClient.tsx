'use client'

import { useState, useMemo } from 'react'
import {
  Wallet, Users, TrendingUp, CheckCircle2,
  Clock, XCircle, Droplets,
  ArrowUpRight, Download,
  ChevronDown
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface SubscriptionData {
  id: string
  start_date: string
  status: string
  quantity_litres: number
  profiles: { full_name: string }
}

/* ── tiny helper ── */
function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  ['#dbeafe', '#1d4ed8'],
  ['#dcfce7', '#15803d'],
  ['#fef3c7', '#b45309'],
  ['#f3e8ff', '#7e22ce'],
  ['#ffe4e6', '#be123c'],
  ['#e0f2fe', '#0369a1'],
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3.5 shadow-sm relative overflow-hidden transition-all hover:shadow-md duration-200">
      {/* Subtle top-right glow */}
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-30 blur-xl pointer-events-none"
        style={{ background: iconBg }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} strokeWidth={2.2} />
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            trendUp 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
          }`}>
            <ArrowUpRight
              size={10}
              className={trendUp ? '' : 'rotate-90'}
            />
            {trend}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none mb-1 font-display tracking-tight">
          {value}
        </p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">
          {label}
        </p>
        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">{sub}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   DISTRIBUTION BAR
───────────────────────────────────────── */
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
    { label: 'Active', count: active, color: '#22c55e', bg: '#dcfce7' },
    { label: 'Inactive', count: inactive, color: '#ef4444', bg: '#fee2e2' },
    { label: 'Pending', count: pending, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Vacation', count: vacation, color: '#3b82f6', bg: '#dbeafe' },
  ].filter((s) => s.count > 0)

  const getSegmentClasses = (label: string) => {
    switch (label.toLowerCase()) {
      case 'active': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
      case 'inactive': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
      case 'pending': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
      case 'vacation': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
      default: return 'bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-extrabold text-slate-950 dark:text-white mb-0.5">
            Status Distribution
          </p>
          <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">
            Breakdown of all subscriptions
          </p>
        </div>
        <div className="text-xl font-black text-slate-950 dark:text-white font-display">
          {data.length}
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 ml-1">
            total
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mb-3.5">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              height: '100%',
              width: `${(s.count / total) * 100}%`,
              background: s.color,
              transition: 'width 0.6s ease',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div
              className="width-2 height-2 rounded-full shrink-0 w-2 h-2"
              style={{ background: s.color }}
            />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {s.label}
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${getSegmentClasses(s.label)}`}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   QUANTITY BREAKDOWN
───────────────────────────────────────── */
function QuantityBreakdown({ data }: { data: SubscriptionData[] }) {
  const qtyMap: Record<number, number> = {}
  data.forEach((d) => {
    qtyMap[d.quantity_litres] = (qtyMap[d.quantity_litres] || 0) + 1
  })
  const entries = Object.entries(qtyMap).sort((a, b) => Number(a[0]) - Number(b[0]))
  const max = Math.max(...Object.values(qtyMap))

  const qtyColors: Record<string, string> = {
    '0.5': '#60a5fa',
    '1': '#34d399',
    '1.5': '#a78bfa',
    '2': '#fb923c',
    '3': '#f472b6',
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-extrabold text-slate-950 dark:text-white mb-0.5">
          Quantity Breakdown
        </p>
        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">
          Subscribers by daily litres
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {entries.map(([qty, count]) => {
          const pct = (count / max) * 105 // slight adjustment for visual hierarchy
          const color = qtyColors[qty] || '#94a3b8'
          return (
            <div key={qty} className="flex items-center gap-2.5">
              <div className="w-9 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 text-right">
                {qty}L
              </div>
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: color,
                  }}
                />
              </div>
              <div className="w-7 text-xs font-bold text-slate-950 dark:text-white text-right shrink-0">
                {count}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total litres */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total daily output
        </span>
        <span className="text-lg font-black text-slate-955 dark:text-white font-display">
          {data.reduce((s, d) => s + d.quantity_litres, 0).toFixed(1)}
          <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 ml-1">
            L / day
          </span>
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export function SubscriptionsClient({ data }: { data: SubscriptionData[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [qtyFilter, setQtyFilter] = useState('all')

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
        const initials = getInitials(name)
        const [bg, fg] = getAvatarColor(name)
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 tracking-wider w-[34px] h-[34px]"
              style={{ backgroundColor: bg, color: fg }}
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {name}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                #{row.id.slice(0, 8)}
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
          <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 rounded-lg px-2.5 py-1">
            <Droplets size={11} className="text-sky-600 dark:text-sky-405" />
            <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400">{plan}</span>
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
          <div className={`inline-flex items-center gap-1 border rounded-lg px-2.5 py-1 ${
            isHigh 
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
          }`}>
            <span className={`text-xs font-black ${isHigh ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'}`}>
              {qty}
            </span>
            <span className={`text-[10px] font-bold ${isHigh ? 'text-amber-600 dark:text-amber-550' : 'text-emerald-600 dark:text-emerald-550'}`}>
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
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{dateStr}</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 px-8 py-7 shadow-lg">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-50 h-50 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-[30%] w-40 h-25 rounded-full bg-purple-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md w-[52px] h-[52px]">
              <Wallet size={24} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight font-display">
                  Subscriptions
                </h1>
                <span className="bg-white/15 border border-white/25 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-blue-200 backdrop-blur-md">
                  {data.length} total
                </span>
              </div>
              <p className="text-xs font-medium text-blue-200/75">
                Manage recurring milk delivery subscriptions
              </p>
            </div>
          </div>

          {/* Right — action buttons */}
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-200 text-xs font-bold cursor-pointer backdrop-blur-md transition-all duration-200">
              <Download size={14} />
              Export
            </button>
            <button className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border-0 bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-900 text-xs font-black cursor-pointer shadow-md transition-all duration-200">
              <Users size={14} />
              New Subscription
            </button>
          </div>
        </div>

        {/* Quick stat pills inside header */}
        <div className="relative z-10 flex flex-wrap gap-2.5 mt-5">
          {[
            { icon: CheckCircle2, label: `${stats.active} Active`, color: '#4ade80' },
            { icon: Clock, label: `${stats.pending} Pending`, color: '#fbbf24' },
            { icon: Droplets, label: `${stats.totalLitres.toFixed(1)}L / day`, color: '#60a5fa' },
            { icon: TrendingUp, label: `Avg ${stats.avgQty}L`, color: '#c084fc' },
          ].map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md"
            >
              <p.icon size={11} style={{ color: p.color }} />
              <span className="text-[11px] font-bold text-white/85">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionBar data={data} />
        <QuantityBreakdown data={data} />
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 flex-wrap shadow-sm">
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
            className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-blue-500/20"
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
            className="h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-blue-500/20"
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
          <span className="text-[11px] font-bold text-slate-450 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1">
            {filtered.length} of {data.length} results
          </span>
        </div>
      </div>

      {/* ── TABLE ── */}
      <DataTable
        data={filtered}
        columns={columns}
      />

    </div>
  )
}