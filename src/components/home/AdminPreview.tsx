import { cn } from '@/lib/utils'
import { Truck, FastForward, Milk, PlusCircle, Lock, BarChart3, Users, Coins, Package, TrendingUp, Sun, Printer, Search } from 'lucide-react'

function getAdminIcon(name: string, className?: string) {
  switch (name) {
    case '🚚': return <Truck className={className} />
    case '⏭️': return <FastForward className={className} />
    case '🥛': return <Milk className={className} />
    case '➕': return <PlusCircle className={className} />
    case '📊': return <BarChart3 className={className} />
    case '👥': return <Users className={className} />
    case '💰': return <Coins className={className} />
    case '📦': return <Package className={className} />
    case '📈': return <TrendingUp className={className} />
    default: return null
  }
}

const customers = [
  {
    initials: 'RN',
    name: 'Ravi Nayak',
    area: 'Padil',
    qty: '1L',
    amount: '₹2,480',
    status: 'Deliver',
    statusColor: 'bg-green-50 text-green-700 border border-green-100',
  },
  {
    initials: 'PS',
    name: 'Priya Shenoy',
    area: 'Urwa',
    qty: '1.5L',
    amount: '₹3,720',
    status: 'Skip',
    statusColor: 'bg-red-50 text-red-600 border border-red-100',
  },
  {
    initials: 'AK',
    name: 'Anand Kumar',
    area: 'Padil',
    qty: '2L + 1L extra',
    amount: '₹4,960',
    status: 'Extra',
    statusColor: 'bg-teal-50 text-teal-700 border border-teal-100',
  },
  {
    initials: 'SM',
    name: 'Sunita Mallya',
    area: 'Kottara',
    qty: '0.5L',
    amount: '₹1,240',
    status: 'Vacation',
    statusColor: 'bg-blue-50 text-blue-600 border border-blue-100',
  },
  {
    initials: 'VD',
    name: 'Vinod D\'Souza',
    area: 'Padil',
    qty: '1L',
    amount: '₹2,480',
    status: 'Deliver',
    statusColor: 'bg-green-50 text-green-700 border border-green-100',
  },
]

const stats = [
  { icon: '🚚', label: 'Deliveries Today', value: '243', trend: '+2', up: true },
  { icon: '⏭️', label: 'Skipped Today', value: '7', trend: '-1', up: false },
  { icon: '🥛', label: 'Total Milk Needed', value: '312L', trend: '+18L', up: true },
  { icon: '➕', label: 'Extra Orders', value: '3', trend: '+3', up: true },
]

export function AdminPreview() {
  return (
    <section className="bg-teal-900 section-py" id="admin-preview">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="section-label justify-center" style={{ color: '#1A7A5E' }}>
            Admin Dashboard
          </p>
          <h2 className="text-heading text-white mb-4">
            Everything you need, every morning
          </h2>
          <p className="text-body text-white/55">
            Open your dashboard, see exactly who gets milk today, mark deliveries done.
            That&apos;s it. 5 minutes instead of 2 hours.
          </p>
        </div>

        {/* Browser window mockup */}
        <div
          className="rounded-[20px] overflow-hidden shadow-float"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
        >
          {/* Browser chrome */}
          <div className="bg-[#1E1E1E] px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
              <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
            </div>
            <div className="flex-1 max-w-md mx-auto bg-[#2A2A2A] rounded-lg px-4 py-1.5 flex items-center gap-2">
              <Lock className="text-green-400 w-3 h-3" />
              <span className="text-xs text-white/50 font-mono">amruthmilk.com/admin/delivery</span>
            </div>
          </div>

          {/* Dashboard interior */}
          <div className="flex" style={{ minHeight: '480px' }}>
            {/* Sidebar */}
            <div className="bg-slate-900 w-52 flex-shrink-0 p-4 flex flex-col hidden md:flex">
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                  <Milk size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Amruth Milk</p>
                  <p className="text-[10px] text-white/40">Admin Panel</p>
                </div>
              </div>
              {[
                { icon: '📊', label: 'Dashboard', active: false },
                { icon: '🚚', label: "Today's Delivery", active: true },
                { icon: '👥', label: 'Customers', active: false },
                { icon: '💰', label: 'Billing', active: false },
                { icon: '📦', label: 'Products', active: false },
                { icon: '📈', label: 'Reports', active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1',
                    'text-xs font-medium',
                    item.active
                      ? 'bg-teal-600/20 text-teal-400 border-l-2 border-teal-500'
                      : 'text-white/40'
                  )}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2">
                    {getAdminIcon(item.icon, "w-4 h-4")}
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-slate-50 p-6 overflow-hidden">
              {/* Top */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    Good Morning! <Sun className="w-4 h-4 text-amber-500 inline-block" /> Thursday, June 18
                  </h3>
                  <p className="text-xs text-slate-500">243 deliveries · 7 skips · 312L total</p>
                </div>
                <button className="flex items-center gap-1.5 bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-teal-600 transition-colors">
                  <Printer size={13} /> Print List
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-teal-600 flex items-center">{getAdminIcon(s.icon, "w-5 h-5")}</span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          s.up ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        )}
                      >
                        {s.trend}
                      </span>
                    </div>
                    <p className="text-lg font-extrabold text-slate-800 leading-none">{s.value}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Delivery table */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-700">Today&apos;s Delivery List</p>
                  <div className="flex gap-2">
                    <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Search size={11} /> Search customer
                    </div>
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Customer', 'Area', 'Quantity', 'Status', 'Action'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c.name} className={cn('border-b border-slate-50', i % 2 === 0 ? '' : 'bg-slate-50/50')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {c.initials}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.area}</td>
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-700">{c.qty}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', c.statusColor)}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'Deliver' && (
                            <button className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-100 transition-colors">
                              Mark Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-teal-50 border-t border-teal-100 flex items-center gap-2">
                  <Milk size={14} className="text-teal-700" />
                  <p className="text-xs font-bold text-teal-700">
                    Total milk needed today: <span className="text-teal-900">312 Litres</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
