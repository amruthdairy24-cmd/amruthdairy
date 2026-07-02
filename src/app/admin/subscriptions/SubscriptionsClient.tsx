'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet, Users, TrendingUp, CheckCircle2,
  XCircle, Droplets, CalendarDays,
  ChevronDown, IndianRupee
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
  payment_status: string
  quantity_litres: number
  profiles: { full_name: string }
}

/* ── STAT CARD ── */
function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string | number; sub: string;
  icon: any; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="space-y-1.5 min-w-0 text-left">
        <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-455 dark:text-slate-400">
          {label}
        </h4>
        <p className="text-2xl sm:text-3xl font-black tracking-tight leading-none font-display text-slate-800 dark:text-white">
          {value}
        </p>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate block">
          {sub}
        </span>
      </div>
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-3xs border border-blue-500/5 flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} strokeWidth={2.2} />
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
  const max = Math.max(...Object.values(qtyMap), 1)

  const qtyColors: Record<string, string> = {
    '0.5': '#60a5fa', '1': '#34d399', '1.0': '#34d399',
    '1.5': '#a78bfa', '2': '#fb923c', '2.0': '#fb923c', '3': '#f472b6',
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-[16px] font-black text-slate-900 dark:text-white mb-0.5">Quantity Breakdown</h3>
          <p className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500">Daily demand grouped by volume</p>
        </div>
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-500">
            <p className="text-sm font-semibold">No subscribers this month</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 mt-2">
            {entries.map(([qty, count]) => {
              const pct = (count / max) * 100
              const color = qtyColors[qty] || '#94a3b8'
              return (
                <div key={qty} className="flex items-center gap-3 p-1.5 rounded-xl transition-all hover:bg-slate-50/55 dark:hover:bg-slate-800/20">
                  <div className="w-9 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 text-right">{qty}L</div>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-955/80 overflow-hidden shadow-3xs">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                  </div>
                  <div className="w-7 text-xs font-black text-slate-800 dark:text-slate-100 text-right shrink-0">{count}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total daily output</span>
        <span className="text-lg font-black text-slate-800 dark:text-white font-display">
          {data.reduce((s, d) => s + d.quantity_litres, 0).toFixed(1)}
          <span className="text-xs font-semibold text-slate-455 dark:text-slate-555 ml-1">L / day</span>
        </span>
      </div>
    </div>
  )
}

/* ── PAYMENT BADGE ── */
function PaymentBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const config: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    paid: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40', icon: '✓' },
    pending: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40', icon: '⏳' },
    overdue: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800/40', icon: '!' },
  }
  const c = config[s] || config.pending
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border", c.bg, c.text, c.border)}>
      <span>{c.icon}</span>{status}
    </span>
  )
}

/* ── MAIN COMPONENT ── */
export function SubscriptionsClient({ data, currentMonth }: { data: SubscriptionData[], currentMonth: string }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [qtyFilter, setQtyFilter] = useState('all')
  const [viewingEntry, setViewingEntry] = useState<SubscriptionData | null>(null)

  const stats = useMemo(() => {
    const totalLitres = data.reduce((s, d) => s + d.quantity_litres, 0)
    const paidCount = data.filter(d => d.payment_status === 'paid').length
    const avgQty = data.length ? (totalLitres / data.length).toFixed(1) : '0'
    return { total: data.length, totalLitres, paidCount, avgQty }
  }, [data])

  const filtered = useMemo(() => {
    let d = data
    if (search) d = d.filter((r) => r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()))
    if (qtyFilter !== 'all') d = d.filter((r) => r.quantity_litres === Number(qtyFilter))
    return d
  }, [data, search, qtyFilter])

  const uniqueQtys = [...new Set(data.map((d) => d.quantity_litres))].sort((a, b) => a - b)

  const columns: ColumnDef<SubscriptionData>[] = [
    {
      header: 'Customer',
      cell: (row) => {
        const name = row.profiles?.full_name || 'Unknown'
        const nameParts = name.trim().split(/\s+/)
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : (nameParts[0]?.[0] || 'C').toUpperCase()
        const gradients = [
          "from-blue-500 to-indigo-600", "from-violet-500 to-fuchsia-600",
          "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
          "from-rose-500 to-pink-600", "from-sky-500 to-blue-600"
        ]
        const charSum = name.split('').reduce((sum: number, c: string) => sum + c.charCodeAt(0), 0)
        const avatarBg = gradients[charSum % gradients.length]
        return (
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs flex-shrink-0", avatarBg)}>
              {initials}
            </div>
            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">{name}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">ID: #{row.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Plan',
      cell: () => (
        <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/30 rounded-xl px-2.5 py-1 text-sky-750 dark:text-sky-300 font-extrabold text-[11px] shadow-3xs">
          <Droplets size={11} className="text-sky-500 dark:text-sky-400 flex-shrink-0" />
          <span>Standard Plan</span>
        </div>
      ),
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
            <span className={cn("text-[10px] font-bold", isHigh ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500')}>L</span>
          </div>
        )
      },
    },
    {
      header: 'Start Date',
      cell: (row) => {
        const d = new Date(row.start_date)
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        return <p className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300">{dateStr}</p>
      },
    },
    {
      header: 'Payment',
      align: 'center',
      cell: (row) => <PaymentBadge status={row.payment_status} />,
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ]

  const selectedMonthLabel = new Date(currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER + MONTH PICKER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminHeader
          title="Subscriptions"
          description={`${selectedMonthLabel} — ${stats.total} active subscribers`}
          icon={Wallet}
          actionLabel="New Subscription"
        />
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm">
          <div className="pl-2 pr-1 text-slate-400"><CalendarDays size={16} /></div>
          <select
            value={currentMonth}
            onChange={(e) => router.push(`/admin/subscriptions?month=${e.target.value}`)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 outline-none pr-3 py-1 cursor-pointer appearance-none"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
              const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return <option key={val} value={val}>{label}</option>
            })}
          </select>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Subscribers" value={stats.total} sub="This month" icon={CheckCircle2} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Daily Milk Output" value={`${stats.totalLitres.toFixed(1)}L`} sub={`${stats.avgQty}L avg per subscriber`} icon={Droplets} iconBg="#dbeafe" iconColor="#2563eb" />
        <StatCard label="Payments Collected" value={`${stats.paidCount}/${stats.total}`} sub={stats.total > 0 ? `${Math.round((stats.paidCount / stats.total) * 100)}% collected` : 'No subscribers'} icon={IndianRupee} iconBg="#f0fdf4" iconColor="#15803d" />
        <StatCard label="Avg Daily Qty" value={`${stats.avgQty}L`} sub="Per subscriber" icon={TrendingUp} iconBg="#f3e8ff" iconColor="#9333ea" />
      </div>

      {/* QUANTITY BREAKDOWN */}
      <QuantityBreakdown data={data} />

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="relative">
          <select value={qtyFilter} onChange={(e) => setQtyFilter(e.target.value)}
            className="h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-200 outline-none cursor-pointer appearance-none transition-all focus:ring-2 focus:ring-blue-500/20">
            <option value="all">All Quantities</option>
            {uniqueQtys.map((q) => (<option key={q} value={q}>{q}L / day</option>))}
          </select>
          <ChevronDown size={13} className="text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {(search || qtyFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setQtyFilter('all') }}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 text-xs font-bold cursor-pointer transition-all hover:bg-rose-100 dark:hover:bg-rose-950/50">
            <XCircle size={13} /> Reset
          </button>
        )}
        <div className="ml-auto">
          <span className="text-[11px] font-bold text-slate-455 dark:text-slate-550 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg px-2.5 py-1">
            {filtered.length} of {data.length} results
          </span>
        </div>
      </div>

      {/* TABLE or EMPTY */}
      {data.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Users size={28} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No subscriptions for {selectedMonthLabel}</h3>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 max-w-sm">Subscribers will appear here once their monthly billing is generated.</p>
        </div>
      ) : (
        <DataTable data={filtered} columns={columns} onView={(row) => setViewingEntry(row)} />
      )}

      <RowDetailsModal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} title="Subscription Details" data={viewingEntry} />
    </div>
  )
}