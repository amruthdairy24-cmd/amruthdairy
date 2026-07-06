'use client'

import { useState, useEffect } from 'react'
import {
  Truck, CheckCircle2, SkipForward, PlusCircle,
  Calendar, RefreshCw, ChevronLeft, ChevronRight, Package,
  MapPin, Phone, Droplets, AlertTriangle, Clock, Eye, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'

interface DeliveryEntry {
  id: string
  subscription_id: string
  customer_id: string
  customer_name: string
  phone: string
  address: string
  area: string
  landmark: string
  floor_notes: string
  regular_litres: number
  extra_litres: number
  total_litres: number
  delivery_status: string
  is_skip: boolean
  is_vacation: boolean
  is_extra: boolean
  extra_order_id: string | null
  delivered_at: string | null
  notes: string | null
}

interface DeliverySummary {
  total_customers: number
  delivering: number
  skipped: number
  on_vacation: number
  extra_orders: number
  total_litres_needed: number
}

interface CapacityData {
  total_litres: number
  booked_litres: number
}

export function DeliveriesClient({ initialDate }: { initialDate: string }) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([])
  const [summary, setSummary] = useState<DeliverySummary | null>(null)
  const [capacity, setCapacity] = useState<CapacityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [viewingEntry, setViewingEntry] = useState<DeliveryEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered'>('all')

  async function fetchDeliveries(date: string) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/delivery/${date}`)
      const json = await res.json()
      if (json.success) {
        setDeliveries(json.deliveries || [])
        setSummary(json.summary || null)
        setCapacity(json.capacity || null)
      } else {
        setDeliveries([])
        setSummary(null)
        setMessage({ text: json.message || 'Failed to load deliveries', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Network error loading deliveries', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveries(selectedDate)
  }, [selectedDate])

  function changeDate(offset: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  function goToToday() {
    setSelectedDate(initialDate)
  }

  async function markDelivered(deliveryId: string) {
    setMarkingId(deliveryId)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/delivery/${selectedDate}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, status: 'delivered' })
      })
      const json = await res.json()
      if (json.success) {
        setDeliveries(prev => prev.map(d =>
          d.id === deliveryId
            ? { ...d, delivery_status: 'delivered', delivered_at: new Date().toISOString() }
            : d
        ))
        setMessage({ text: 'Delivery marked as delivered', type: 'success' })
      } else {
        setMessage({ text: json.message || 'Failed to update', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' })
    } finally {
      setMarkingId(null)
    }
  }

  async function markAllDelivered() {
    setMarkingAll(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/delivery/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const json = await res.json()
      if (json.success) {
        setDeliveries(prev => prev.map(d =>
          d.delivery_status === 'pending'
            ? { ...d, delivery_status: 'delivered', delivered_at: new Date().toISOString() }
            : d
        ))
        setMessage({ text: `${json.updated_count} deliveries marked as delivered`, type: 'success' })
      } else {
        setMessage({ text: json.message || 'Failed to batch update', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' })
    } finally {
      setMarkingAll(false)
    }
  }

  const pendingCount = deliveries.filter(d => d.delivery_status === 'pending').length
  const deliveredCount = deliveries.filter(d => d.delivery_status === 'delivered').length
  const skippedCount = deliveries.filter(d => d.is_skip).length
  const vacationCount = deliveries.filter(d => d.is_vacation).length
  const extraCount = deliveries.filter(d => d.is_extra).length
  const totalLitres = deliveries.reduce((sum, d) => sum + Number(d.total_litres || 0), 0)

  const isToday = selectedDate === initialDate

  const filteredDeliveries = deliveries.filter(d => {
    // text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = d.customer_name?.toLowerCase().includes(q)
      const matchesArea = d.area?.toLowerCase().includes(q)
      const matchesPhone = d.phone?.includes(q)
      if (!matchesName && !matchesArea && !matchesPhone) return false
    }
    // status filter
    if (filterStatus === 'pending') {
      if (d.delivery_status !== 'pending' || d.is_skip || d.is_vacation) return false
    } else if (filterStatus === 'delivered') {
      if (d.delivery_status !== 'delivered') return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 select-none transition-colors duration-300">
        
        {/* Title Block */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#014DA4]/10 dark:bg-[#014DA4]/20 text-[#014DA4] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Truck size={22} className="stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Delivery Management
            </h1>
            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-1">
              Track, manage, and coordinate daily milk deliveries
            </p>
          </div>
        </div>

        {/* Date Navigation Block */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => changeDate(-1)} 
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-2xs text-slate-600 dark:text-slate-300"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2 shadow-2xs">
            <Calendar size={14} className="text-[#014DA4] dark:text-blue-400" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {isToday && (
              <span className="text-[9px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider shadow-3xs">
                Today
              </span>
            )}
          </div>
          
          <button 
            onClick={() => changeDate(1)} 
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-2xs text-slate-600 dark:text-slate-300"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
          
          {!isToday && (
            <button 
              onClick={goToToday} 
              className="px-3.5 h-9 bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Today
            </button>
          )}
          
          <button 
            onClick={() => fetchDeliveries(selectedDate)} 
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-2xs text-slate-600 dark:text-slate-300"
            title="Reload Sheet"
          >
            <RefreshCw size={14} />
          </button>
        </div>

      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard icon={<Package size={18} />} label="Total Deliveries" value={deliveries.length} color="text-blue-600 dark:text-blue-400" bg="bg-blue-500/10" />
        <SummaryCard icon={<Droplets size={18} />} label="Total Litres" value={`${totalLitres.toFixed(1)}L`} color="text-cyan-600 dark:text-cyan-400" bg="bg-cyan-500/10" />
        <SummaryCard icon={<Clock size={18} />} label="Pending" value={pendingCount} color="text-amber-600 dark:text-amber-400" bg="bg-amber-500/10" />
        <SummaryCard icon={<CheckCircle2 size={18} />} label="Delivered" value={deliveredCount} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/10" />
        <SummaryCard icon={<SkipForward size={18} />} label="Skipped" value={skippedCount} color="text-rose-550 dark:text-rose-400" bg="bg-rose-500/10" />
        <SummaryCard icon={<PlusCircle size={18} />} label="Extra Orders" value={extraCount} color="text-purple-600 dark:text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* MESSAGE STATUS */}
      {message && (
        <div className={cn(
          "p-4 rounded-xl text-xs font-bold border transition-all duration-250",
          message.type === 'success' 
            ? "bg-emerald-50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400" 
            : "bg-rose-50 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400"
        )}>
          {message.text}
        </div>
      )}

      {/* DELIVERY TABLE CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors duration-300">
        
        {/* Table Control Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              Daily Delivery Sheet
            </h2>
            <p className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 mt-1.5">
              {filteredDeliveries.length} entries for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search customers, area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#014DA4]/20 w-full sm:w-48 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>

            {/* FILTER */}
            <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 shadow-2xs">
              {(['all', 'pending', 'delivered'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer",
                    filterStatus === status 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            {pendingCount > 0 && (
              <button
                onClick={markAllDelivered}
                disabled={markingAll}
                className="inline-flex items-center justify-center gap-2 px-5 h-9 sm:h-10 rounded-xl bg-emerald-600 hover:bg-emerald-600/95 active:scale-98 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                <span>{markingAll ? 'Marking...' : `Mark All Delivered (${pendingCount})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sheet Content Body */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-slate-200 dark:border-slate-800 border-t-[#014DA4] dark:border-t-blue-400 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Loading daily delivery sheet...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4 max-w-sm mx-auto p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-2xs">
              <AlertTriangle size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">No Delivery Sheet Generated</p>
              <p className="text-xs text-slate-455 dark:text-slate-400 mt-1 leading-relaxed">
                The delivery sheet for this date has not been generated yet. Sheets are automatically prepared by the background schedule.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full border-collapse text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/40 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 text-left select-none">
                  <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Customer</th>
                  <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Area</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px] text-center">Regular</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px] text-center">Extra</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px] text-center">Total</th>
                  <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px] text-center">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[2px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDeliveries.map((del, idx) => {
                  const isMarkingThis = markingId === del.id
                  const isDelivered = del.delivery_status === 'delivered'
                  const isSkipped = del.is_skip
                  const isVacation = del.is_vacation
                  const isPending = del.delivery_status === 'pending' && !isSkipped && !isVacation

                  return (
                    <tr
                      key={del.id}
                      className={cn(
                        "hover:bg-slate-50/40 dark:hover:bg-slate-855/20 transition-colors h-[60px]",
                        isDelivered && "bg-emerald-500/2",
                        isSkipped && "bg-rose-500/2",
                        isVacation && "bg-blue-500/2"
                      )}
                    >
                      {/* Customer info */}
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shadow-2xs flex-shrink-0 select-none",
                            idx % 2 === 0 ? "bg-gradient-to-br from-[#014DA4] to-blue-550" : "bg-gradient-to-br from-[#014DA4]/80 to-indigo-505"
                          )}>
                            {del.customer_name?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 leading-none">
                              {del.customer_name || 'Unknown'}
                            </p>
                            {del.phone && (
                              <p className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                <Phone size={10} className="text-slate-400 dark:text-slate-500" />
                                <span>{del.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-1.5 text-left">
                          <MapPin size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="text-[12.5px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                            {del.area || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Regular Volume */}
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-300 font-mono">
                          {isSkipped || isVacation ? '—' : `${del.regular_litres}L`}
                        </span>
                      </td>

                      {/* Extra Volume */}
                      <td className="px-4 py-2.5 text-center">
                        {del.is_extra && Number(del.extra_litres) > 0 ? (
                          <span className="inline-flex text-[10px] font-extrabold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/30 px-2 py-0.5 rounded-md border border-purple-200/20 dark:border-purple-900/30 font-mono">
                            +{del.extra_litres}L
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      {/* Total Volume */}
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn(
                          "text-[14px] font-black font-mono",
                          isSkipped || isVacation ? "text-slate-400 dark:text-slate-555" : "text-slate-850 dark:text-slate-100"
                        )}>
                          {del.total_litres}L
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5 text-center">
                        <StatusBadge
                          status={del.delivery_status}
                          isSkip={del.is_skip}
                          isVacation={del.is_vacation}
                        />
                      </td>

                      {/* Action trigger */}
                      <td className="px-6 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingEntry(del)}
                            className="inline-flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#014DA4] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors cursor-pointer w-8 h-8" 
                            title="View Details"
                          >
                            <Eye size={14}/>
                          </button>
                        {isPending ? (
                          <button
                            onClick={() => markDelivered(del.id)}
                            disabled={isMarkingThis}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-600/95 active:scale-95 text-white font-bold text-[11px] shadow-3xs hover:shadow-2xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={12} />
                            <span>{isMarkingThis ? '...' : 'Delivered'}</span>
                          </button>
                        ) : isDelivered ? (
                          <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-450">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <span>
                              {del.delivered_at
                                ? new Date(del.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                : 'Done'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 font-mono">—</span>
                        )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Delivery Details"
        data={viewingEntry}
      />
    </div>
  )
}

/* ─── HELPER COMPONENTS ─── */

function SummaryCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; bg: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all duration-250 flex items-center gap-3.5 group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105", bg, color)}>
        {icon}
      </div>
      <div className="text-left min-w-0">
        <p className="text-[20px] font-black text-slate-900 dark:text-white font-mono leading-none truncate">
          {value}
        </p>
        <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider truncate">
          {label}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status, isSkip, isVacation }: { status: string; isSkip: boolean; isVacation: boolean }) {
  let badgeClass = 'bg-slate-50 dark:bg-slate-950 border-slate-200/50 dark:border-slate-800/50 text-slate-455 dark:text-slate-400'
  let labelText = status

  if (isSkip) {
    badgeClass = 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/15 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
    labelText = 'Skipped'
  } else if (isVacation) {
    badgeClass = 'bg-blue-500/10 dark:bg-blue-950/20 border-blue-500/15 dark:border-blue-900/30 text-blue-600 dark:text-blue-400'
    labelText = 'Vacation'
  } else if (status === 'delivered') {
    badgeClass = 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/15 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    labelText = 'Delivered'
  } else if (status === 'pending') {
    badgeClass = 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/15 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'
    labelText = 'Pending'
  } else if (status === 'failed') {
    badgeClass = 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/15 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
    labelText = 'Failed'
  }

  return (
    <span className={cn(
      "inline-flex text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border",
      badgeClass
    )}>
      {labelText}
    </span>
  )
}
