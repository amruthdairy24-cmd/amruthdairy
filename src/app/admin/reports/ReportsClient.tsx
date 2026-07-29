'use client'

import { BarChart2, TrendingUp, Users, Wallet, Activity, Calendar, Download } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface KPIs {
  currentRevenue: number;
  revenueGrowth: number;
  currentOutstanding: number;
  lastOutstanding: number;
  activeSubsCount: number;
}

interface ChartData {
  revenueTrend: { day: string, amount: number }[];
  subscriptionMix: { name: string, value: number }[];
  paymentMethods: { name: string, amount: number }[];
}

interface PaymentRow {
  id: string;
  amount: number;
  method?: string;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export function ReportsClient({ 
  kpis, 
  charts,
  recentPayments
}: { 
  kpis: KPIs;
  charts: ChartData;
  recentPayments: PaymentRow[];
}) {

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminHeader 
          title="Analytics & Reports" 
          description="Business intelligence, revenue trends, and operational metrics." 
          icon={BarChart2}
          actionLabel="Export CSV"
          hideSearchRow={true}
        />
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-sm">
          <Calendar size={16} className="text-slate-400 ml-1" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 px-2">This Month</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={48} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">Total Revenue</p>
          <p className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(kpis.currentRevenue)}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1",
              kpis.revenueGrowth >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              <TrendingUp size={10} className={kpis.revenueGrowth < 0 ? "rotate-180" : ""} />
              {Math.abs(kpis.revenueGrowth).toFixed(1)}%
            </span>
            <span className="text-[10px] font-bold text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-amber-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">Pending Dues</p>
          <p className="text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrency(kpis.currentOutstanding)}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">Last month: {formatCurrency(kpis.lastOutstanding)}</span>
          </div>
        </div>

        {/* Active Subs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={48} className="text-blue-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">Active Subs</p>
          <p className="text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 mt-2">
            {kpis.activeSubsCount}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">Currently delivering</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Area Chart - Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Revenue Trend (This Month)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="day" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => val.replace('Day ', '')}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart - Subscription Mix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Subscription Mix</h3>
          <div className="flex-1 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.subscriptionMix}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.subscriptionMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Payment Methods */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Revenue by Payment Method</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.paymentMethods} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis 
                  type="number"
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Volume']}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                  {charts.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent High-Value Collections</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Method</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPayments.length > 0 ? recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-5 py-3 text-[13px] font-bold text-slate-800 dark:text-slate-200">
                      {payment.profiles?.full_name || 'Unknown Customer'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {payment.method || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[13.5px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{payment.amount}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">No recent collections found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

