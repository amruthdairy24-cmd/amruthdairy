'use client'

import { useState, useEffect } from 'react'
import {
  Truck, CheckCircle2, SkipForward, Palmtree, PlusCircle,
  Calendar, RefreshCw, ChevronLeft, ChevronRight, Package,
  MapPin, Phone, Droplets, AlertTriangle, Clock
} from 'lucide-react'

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
        // Update local state immediately
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
        // Update local state
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* PAGE HEADER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8f 55%, #1e40af 100%)',
          borderRadius: '24px',
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(96,165,250,0.15)', filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Truck size={24} color="#ffffff" strokeWidth={2} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: 4 }}>
                  Delivery Management
                </h1>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(219,234,254,0.7)' }}>
                  Track, manage, and mark deliveries as completed
                </p>
              </div>
            </div>

            {/* Date Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => changeDate(-1)} style={navBtnWhite}>
                <ChevronLeft size={16} />
              </button>
              <div
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  padding: '8px 16px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Calendar size={14} color="#93c5fd" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {isToday && (
                  <span style={{ fontSize: 9, fontWeight: 900, background: '#22c55e', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                    TODAY
                  </span>
                )}
              </div>
              <button onClick={() => changeDate(1)} style={navBtnWhite}>
                <ChevronRight size={16} />
              </button>
              {!isToday && (
                <button onClick={goToToday} style={{ ...navBtnWhite, padding: '8px 14px', fontSize: 11, fontWeight: 700 }}>
                  Today
                </button>
              )}
              <button onClick={() => fetchDeliveries(selectedDate)} style={navBtnWhite}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        <SummaryCard icon={<Package size={18} />} label="Total Deliveries" value={deliveries.length} color="#2563eb" bg="#dbeafe" />
        <SummaryCard icon={<Droplets size={18} />} label="Total Litres" value={`${totalLitres.toFixed(1)}L`} color="#0891b2" bg="#cffafe" />
        <SummaryCard icon={<Clock size={18} />} label="Pending" value={pendingCount} color="#d97706" bg="#fef3c7" />
        <SummaryCard icon={<CheckCircle2 size={18} />} label="Delivered" value={deliveredCount} color="#16a34a" bg="#dcfce7" />
        <SummaryCard icon={<SkipForward size={18} />} label="Skipped" value={skippedCount} color="#ef4444" bg="#fee2e2" />
        <SummaryCard icon={<PlusCircle size={18} />} label="Extra Orders" value={extraCount} color="#7c3aed" bg="#f3e8ff" />
      </div>

      {/* MESSAGE */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.text}
        </div>
      )}

      {/* DELIVERY TABLE */}
      <div style={{
        background: '#ffffff', borderRadius: '20px',
        border: '1px solid #e8edf5',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        {/* Table Header Bar */}
        <div style={{
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Delivery Sheet
            </h2>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>
              {deliveries.length} total entries for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={markAllDelivered}
              disabled={markingAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '12px',
                border: 'none', background: '#16a34a', color: '#ffffff',
                fontSize: 13, fontWeight: 700, cursor: markingAll ? 'not-allowed' : 'pointer',
                opacity: markingAll ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                transition: 'all 0.2s',
              }}
            >
              <CheckCircle2 size={16} />
              {markingAll ? 'Marking...' : `Mark All Delivered (${pendingCount})`}
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb', borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Loading delivery sheet...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : deliveries.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: '#d97706', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>No delivery sheet generated</p>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', marginTop: 4 }}>
              The delivery sheet for this date has not been generated yet by the cron job.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf5' }}>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Area</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Regular</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Extra</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((del, idx) => {
                  const isMarkingThis = markingId === del.id
                  const isDelivered = del.delivery_status === 'delivered'
                  const isSkipped = del.is_skip
                  const isVacation = del.is_vacation
                  const isPending = del.delivery_status === 'pending' && !isSkipped && !isVacation

                  return (
                    <tr
                      key={del.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isDelivered ? '#f0fdf4' : isSkipped ? '#fef2f2' : isVacation ? '#eff6ff' : '#ffffff',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Customer */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#1e3a8f, #2563eb' : '#7c3aed, #8b5cf6'})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0
                            }}
                          >
                            {del.customer_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, margin: 0 }}>
                              {del.customer_name || 'Unknown'}
                            </p>
                            {del.phone && (
                              <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Phone size={9} /> {del.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Area */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            {del.area || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Regular */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                          {isSkipped || isVacation ? '—' : `${del.regular_litres}L`}
                        </span>
                      </td>

                      {/* Extra */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {del.is_extra && Number(del.extra_litres) > 0 ? (
                          <span style={{
                            fontSize: 11, fontWeight: 800, color: '#7c3aed',
                            background: '#f3e8ff', padding: '3px 8px', borderRadius: 6,
                            border: '1px solid #e9d5ff'
                          }}>
                            +{del.extra_litres}L
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Total */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          fontSize: 14, fontWeight: 900,
                          color: isSkipped || isVacation ? '#94a3b8' : '#0f172a'
                        }}>
                          {del.total_litres}L
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <StatusBadge
                          status={del.delivery_status}
                          isSkip={del.is_skip}
                          isVacation={del.is_vacation}
                        />
                      </td>

                      {/* Action */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {isPending ? (
                          <button
                            onClick={() => markDelivered(del.id)}
                            disabled={isMarkingThis}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 14px', borderRadius: '8px',
                              border: 'none', background: '#16a34a', color: '#ffffff',
                              fontSize: 11, fontWeight: 700,
                              cursor: isMarkingThis ? 'not-allowed' : 'pointer',
                              opacity: isMarkingThis ? 0.7 : 1,
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 4px rgba(22,163,74,0.2)',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            {isMarkingThis ? '...' : 'Delivered'}
                          </button>
                        ) : isDelivered ? (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#16a34a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3
                          }}>
                            <CheckCircle2 size={12} />
                            {del.delivered_at
                              ? new Date(del.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : 'Done'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── HELPER COMPONENTS ─── */

function SummaryCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; bg: string
}) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: '16px', padding: '16px 18px',
      border: '1px solid #e8edf5',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1, margin: 0 }}>
          {value}
        </p>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: 0, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status, isSkip, isVacation }: { status: string; isSkip: boolean; isVacation: boolean }) {
  let bg = '#f8fafc', color = '#94a3b8', text = status, borderColor = '#e8edf5'

  if (isSkip) {
    bg = '#fee2e2'; color = '#ef4444'; text = 'Skipped'; borderColor = '#fecaca'
  } else if (isVacation) {
    bg = '#dbeafe'; color = '#2563eb'; text = 'Vacation'; borderColor = '#bfdbfe'
  } else if (status === 'delivered') {
    bg = '#dcfce7'; color = '#16a34a'; text = 'Delivered'; borderColor = '#bbf7d0'
  } else if (status === 'pending') {
    bg = '#fef3c7'; color = '#d97706'; text = 'Pending'; borderColor = '#fde68a'
  } else if (status === 'failed') {
    bg = '#fee2e2'; color = '#ef4444'; text = 'Failed'; borderColor = '#fecaca'
  }

  return (
    <span style={{
      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 6,
      background: bg, color, border: `1px solid ${borderColor}`,
      letterSpacing: '0.03em'
    }}>
      {text}
    </span>
  )
}

/* ─── STYLES ─── */

const navBtnWhite: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#e2e8f0', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.2s',
  padding: 0, fontSize: 14
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px', fontSize: 10, fontWeight: 800,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const tdStyle: React.CSSProperties = {
  padding: '14px 16px', fontSize: 13, color: '#475569'
}
