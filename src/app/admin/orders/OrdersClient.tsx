'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingBag, Search, Filter, CheckCircle2,
  Clock, Truck, AlertCircle, RefreshCw, Phone, MapPin,
  Calendar, Check, X, ShieldCheck, IndianRupee
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_area: string
  delivery_address: string
  total_amount: number
  item_count: number
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_date: string
  delivery_notes: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
  items: OrderItem[]
}

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (data.success && data.orders) {
        setOrders(data.orders)
      }
    } catch (err) {
      console.error('Failed to load admin orders', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
      }
    } catch (err) {
      console.error('Failed to update order status', err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.customer_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesArea = areaFilter === 'all' || order.customer_area === areaFilter

    return matchesSearch && matchesStatus && matchesArea
  })

  // Metrics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total_amount : 0), 0)
  const pendingCount = orders.filter(o => o.status === 'confirmed' || o.status === 'pending').length
  const deliveredCount = orders.filter(o => o.status === 'delivered').length

  const uniqueAreas = Array.from(new Set(orders.map(o => o.customer_area))).filter(Boolean)

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#02429C] dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Deliveries</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{deliveredCount}</h3>
          </div>
        </div>

      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, area, or order ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm font-medium outline-none focus:border-[#02429C]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'out_for_delivery', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === tab.id
                  ? "bg-white dark:bg-slate-900 text-[#02429C] dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
          title="Refresh Orders"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
        </button>

      </div>

      {/* Orders List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#02429C]" />
            <p className="text-sm font-semibold">Loading product orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <ShoppingBag size={36} className="mx-auto text-slate-300" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">No Product Orders Found</p>
            <p className="text-xs text-slate-400">Try clearing search filters or wait for customer bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Order Details</th>
                  <th className="py-3.5 px-4">Customer & Contact</th>
                  <th className="py-3.5 px-4">Delivery Address & Area</th>
                  <th className="py-3.5 px-4">Items Purchased</th>
                  <th className="py-3.5 px-4">Total & Payment</th>
                  <th className="py-3.5 px-4 text-right">Delivery Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Order ID & Date */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {order.customer_name}
                      </div>
                      {order.customer_phone && (
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#02429C] hover:underline mt-1"
                        >
                          <Phone size={11} /> {order.customer_phone}
                        </a>
                      )}
                    </td>

                    {/* Delivery Area & Address */}
                    <td className="py-4 px-4 align-top max-w-[220px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/50 mb-1">
                        <MapPin size={10} /> {order.customer_area}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {order.delivery_address || 'Address provided in order notes'}
                      </p>
                    </td>

                    {/* Items Purchased */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1">
                        {order.items && order.items.length > 0 ? (
                          order.items.map(item => (
                            <div key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 mr-1 mb-1">
                              <span>{item.quantity}x</span>
                              <span>{item.product_name}</span>
                              <span className="text-slate-400 text-[10px]">₹{item.subtotal}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">1x Standalone Item</span>
                        )}
                      </div>
                    </td>

                    {/* Total & Payment Status */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-extrabold text-base text-slate-900 dark:text-white">
                        ₹{order.total_amount}
                      </div>
                      <div className="mt-1">
                        {order.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck size={11} /> Razorpay PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Payment
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Delivery Status Selector */}
                    <td className="py-4 px-4 align-top text-right">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all",
                          order.status === 'delivered'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.status === 'out_for_delivery'
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : order.status === 'cancelled'
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  )
}
