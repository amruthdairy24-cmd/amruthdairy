'use client'

import { useState, useMemo } from 'react'
import {
  Wallet, Users, TrendingUp, CheckCircle2,
  Clock, XCircle, Droplets, Calendar,
  ArrowUpRight, Filter, Download, RefreshCw,
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
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8edf5',
        borderRadius: 20,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        position: 'relative' as const,
        overflow: 'hidden',
      }}
    >
      {/* Subtle top-right glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: iconBg,
          opacity: 0.5,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={iconColor} strokeWidth={2.2} />
        </div>

        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: trendUp ? '#dcfce7' : '#fef2f2',
              color: trendUp ? '#16a34a' : '#dc2626',
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 999,
              border: `1px solid ${trendUp ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <ArrowUpRight
              size={10}
              style={{ transform: trendUp ? 'none' : 'rotate(90deg)' }}
            />
            {trend}
          </div>
        )}
      </div>

      <div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1,
            marginBottom: 4,
            fontFamily: 'var(--font-display, system-ui)',
            letterSpacing: '-0.5px',
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{sub}</p>
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

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8edf5',
        borderRadius: 20,
        padding: '20px 22px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
            Status Distribution
          </p>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
            Breakdown of all subscriptions
          </p>
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#0f172a',
            fontFamily: 'var(--font-display, system-ui)',
          }}
        >
          {data.length}
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 4 }}>
            total
          </span>
        </div>
      </div>

      {/* Bar */}
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: '#f1f5f9',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: 14,
        }}
      >
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
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
              {s.label}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: s.color,
                background: s.bg,
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
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
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8edf5',
        borderRadius: 20,
        padding: '20px 22px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
          Quantity Breakdown
        </p>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
          Subscribers by daily litres
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {entries.map(([qty, count]) => {
          const pct = (count / max) * 100
          const color = qtyColors[qty] || '#94a3b8'
          return (
            <div key={qty} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#475569',
                  flexShrink: 0,
                  textAlign: 'right' as const,
                }}
              >
                {qty}L
              </div>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 999,
                  background: '#f1f5f9',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: color,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  width: 28,
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0f172a',
                  textAlign: 'right' as const,
                  flexShrink: 0,
                }}
              >
                {count}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total litres */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
          Total daily output
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: '#0f172a',
            fontFamily: 'var(--font-display, system-ui)',
          }}
        >
          {data.reduce((s, d) => s + d.quantity_litres, 0).toFixed(1)}
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 3 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 900,
                color: fg,
                flexShrink: 0,
                letterSpacing: '0.5px',
              }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                {name}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
            <Droplets size={11} color="#0284c7" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>{plan}</span>
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: isHigh ? '#fef3c7' : '#f0fdf4',
              border: `1px solid ${isHigh ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: isHigh ? '#92400e' : '#166534',
              }}
            >
              {qty}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isHigh ? '#b45309' : '#16a34a',
              }}
            >
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
            <p style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{dateStr}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>

      {/* ── PAGE HEADER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8f 60%, #1e40af 100%)',
          borderRadius: 24,
          padding: '28px 32px',
          position: 'relative' as const,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(96,165,250,0.15)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: '30%',
            width: 160,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(167,139,250,0.1)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative' as const,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap' as const,
            gap: 16,
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Wallet size={24} color="#ffffff" strokeWidth={2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.5px',
                    fontFamily: 'var(--font-display, system-ui)',
                  }}
                >
                  Subscriptions
                </h1>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#93c5fd',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {data.length} total
                </span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(219,234,254,0.7)' }}>
                Manage recurring milk delivery subscriptions
              </p>
            </div>
          </div>

          {/* Right — action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Download size={14} />
              Export
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 12,
                border: 'none',
                background: '#ffffff',
                color: '#1e3a8f',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Users size={14} />
              New Subscription
            </button>
          </div>
        </div>

        {/* Quick stat pills inside header */}
        <div
          style={{
            position: 'relative' as const,
            zIndex: 2,
            display: 'flex',
            gap: 10,
            marginTop: 20,
            flexWrap: 'wrap' as const,
          }}
        >
          {[
            { icon: CheckCircle2, label: `${stats.active} Active`, color: '#4ade80' },
            { icon: Clock, label: `${stats.pending} Pending`, color: '#fbbf24' },
            { icon: Droplets, label: `${stats.totalLitres.toFixed(1)}L / day`, color: '#60a5fa' },
            { icon: TrendingUp, label: `Avg ${stats.avgQty}L`, color: '#c084fc' },
          ].map((p) => (
            <div
              key={p.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                padding: '5px 12px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p.icon size={11} color={p.color} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ROW ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <DistributionBar data={data} />
        <QuantityBreakdown data={data} />
      </div>

      {/* ── FILTER BAR ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8edf5',
          borderRadius: 18,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap' as const,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' as const, flex: 1, minWidth: 200 }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers or plans..."
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 36,
              paddingRight: 14,
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              color: '#334155',
              background: '#f8fafc',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' as const }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 40,
              paddingLeft: 14,
              paddingRight: 32,
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              color: '#334155',
              background: '#f8fafc',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none' as const,
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>

        {/* Qty filter */}
        <div style={{ position: 'relative' as const }}>
          <select
            value={qtyFilter}
            onChange={(e) => setQtyFilter(e.target.value)}
            style={{
              height: 40,
              paddingLeft: 14,
              paddingRight: 32,
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              color: '#334155',
              background: '#f8fafc',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none' as const,
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Quantities</option>
            {uniqueQtys.map((q) => (
              <option key={q} value={q}>{q}L / day</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>

        {/* Reset */}
        {(search || statusFilter !== 'all' || qtyFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setQtyFilter('all') }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              height: 40,
              padding: '0 14px',
              borderRadius: 12,
              border: '1.5px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <XCircle size={13} />
            Reset
          </button>
        )}

        {/* Results count */}
        <div style={{ marginLeft: 'auto' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '4px 10px',
            }}
          >
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