'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, FileText, Settings2, Receipt, Coins, CalendarDays, Search } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string;
  billing_month: string;
  net_due: number;
  amount_paid: number;
  payment_status: string;
  extra_charges: number;
  skip_credit: number;
  pause_credit: number;
  profiles: { full_name: string };
}

interface Adjustment {
  id: string;
  adjustment_type: string;
  amount: number;
  description: string;
  target_month: string;
  is_applied: boolean;
  refund_status?: string;
  created_at: string;
  profiles: { full_name: string };
}

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

export function BillingClient({ invoices, adjustments, payments, currentMonth }: { invoices: Invoice[], adjustments: Adjustment[], payments: Payment[], currentMonth: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'invoices' | 'adjustments' | 'payments'>('invoices')
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefundAction = async (id: string, action: 'process' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this refund request?`)) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment_id: id, action })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Refund ${action}ed successfully.`);
        window.location.reload();
      } else {
        alert(data.message || `Failed to ${action} refund`);
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  // Common initials avatar generator to ensure premium matching avatars
  const renderCustomerCell = (fullName: string, id: string) => {
    const name = fullName || 'Unknown'
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
          "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs flex-shrink-0 select-none",
          avatarBg
        )}>
          {initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 leading-none">
            {name}
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
            ID: #{id.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  /* ── INVOICE COLUMNS ── */
  const invoiceColumns: ColumnDef<Invoice>[] = [
    { 
      header: 'Month', 
      cell: (row) => (
        <span className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-200">
          {new Date(row.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      )
    },
    { 
      header: 'Customer', 
      cell: (row) => renderCustomerCell(row.profiles?.full_name, row.id) 
    },
    { 
      header: 'Net Due', 
      align: 'right', 
      cell: (row) => (
        <span className="text-[13.5px] font-black text-slate-800 dark:text-slate-200 font-mono">
          ₹{row.net_due}
        </span>
      ) 
    },
    { 
      header: 'Paid', 
      align: 'right', 
      cell: (row) => {
        const isPaid = row.payment_status === 'paid' || (row.net_due > 0 && row.amount_paid >= row.net_due)
        return (
          <span className={cn(
            "text-[13.5px] font-bold font-mono",
            isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
          )}>
            ₹{row.amount_paid}
          </span>
        )
      } 
    },
    { 
      header: 'Status', 
      align: 'center', 
      cell: (row) => {
        const isPaid = row.payment_status === 'paid' || (row.net_due > 0 && row.amount_paid >= row.net_due)
        return <StatusBadge status={isPaid ? 'Paid' : 'Pending'} />
      } 
    },
  ]

  /* ── ADJUSTMENT COLUMNS ── */
  const adjustmentColumns: ColumnDef<Adjustment>[] = [
    { 
      header: 'Created', 
      cell: (row) => (
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    { 
      header: 'Customer', 
      cell: (row) => renderCustomerCell(row.profiles?.full_name, row.id) 
    },
    { 
      header: 'Type', 
      cell: (row) => {
        const isCredit = row.amount < 0 || row.adjustment_type.includes('credit')
        return (
          <span className={cn(
            "inline-flex text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border",
            isCredit 
              ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-250/15 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450"
              : "bg-purple-500/10 dark:bg-purple-950/20 border-purple-250/15 dark:border-purple-900/30 text-purple-700 dark:text-purple-455"
          )}>
            {row.adjustment_type.replace('_', ' ')}
          </span>
        )
      }
    },
    { 
      header: 'Description', 
      cell: (row) => (
        <span className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 max-w-[200px] block truncate" title={row.description || ''}>
          {row.description || '—'}
        </span>
      ) 
    },
    { 
      header: 'Target Month', 
      cell: (row) => (
        <span className="text-xs font-bold text-slate-650 dark:text-slate-400">
          {new Date(row.target_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      )
    },
    { 
      header: 'Amount', 
      align: 'right', 
      cell: (row) => {
        const isCredit = row.amount < 0 || row.adjustment_type.includes('credit')
        return (
          <div className="text-right">
            <p className={cn(
              "text-[13.5px] font-black font-mono leading-none",
              isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
            )}>
              ₹{Math.abs(row.amount)}
            </p>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {isCredit ? 'Credit' : 'Charge'}
            </p>
          </div>
        )
      } 
    },
    { 
      header: 'Status', 
      align: 'center', 
      cell: (row) => {
        if (row.refund_status === 'requested') return <StatusBadge status="Refund Pending" />;
        if (row.refund_status === 'processed') return <StatusBadge status="Refunded" />;
        return <StatusBadge status={row.is_applied ? 'Applied' : 'Pending'} />;
      }
    },
    { 
      header: 'Actions', 
      align: 'center', 
      cell: (row) => {
        if (row.refund_status === 'requested') {
          return (
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={() => handleRefundAction(row.id, 'process')} 
                disabled={isProcessing} 
                className="px-3 h-7 bg-emerald-600 hover:bg-emerald-600/95 text-white text-[10.5px] font-bold rounded-lg shadow-3xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process
              </button>
              <button 
                onClick={() => handleRefundAction(row.id, 'reject')} 
                disabled={isProcessing} 
                className="px-3 h-7 bg-red-600 hover:bg-red-600/95 text-white text-[10.5px] font-bold rounded-lg shadow-3xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          )
        }
        return <span className="text-xs text-slate-300 dark:text-slate-600 font-mono">—</span>;
      }
    }
  ]

  /* ── PAYMENT COLUMNS ── */
  const paymentColumns: ColumnDef<Payment>[] = [
    { 
      header: 'Date', 
      cell: (row) => (
        <span className="text-xs font-bold text-slate-550 dark:text-slate-400">
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    { 
      header: 'Customer', 
      cell: (row) => renderCustomerCell(row.profiles?.full_name, row.id) 
    },
    { 
      header: 'Method', 
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 shadow-3xs">
          <Coins size={11} className="text-slate-400 dark:text-slate-500" />
          <span>{row.payment_type.replace('_', ' ').toUpperCase()}</span>
        </span>
      )
    },
    { 
      header: 'Amount', 
      align: 'right', 
      cell: (row) => (
        <span className="text-[13.5px] font-black text-slate-800 dark:text-slate-200 font-mono">
          ₹{row.amount}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      align: 'center', 
      cell: (row) => <StatusBadge status={row.status} /> 
    },
  ]


  // Compute summaries
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.net_due || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalExtraMilk = invoices.reduce((sum, inv) => sum + (inv.extra_charges || 0), 0);
  const totalCredits = invoices.reduce((sum, inv) => sum + (inv.skip_credit || 0) + (inv.pause_credit || 0), 0);

  const filterList = (list: any[]) => list.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = item.profiles?.full_name?.toLowerCase().includes(q)
      const matchesId = item.id.toLowerCase().includes(q)
      if (!matchesName && !matchesId) return false
    }
    return true
  })
  
  const filteredInvoices = filterList(invoices)
  const filteredAdjustments = filterList(adjustments)
  const filteredPayments = filterList(payments)

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminHeader 
          title="Billing & Payments" 
          description="Manage customer invoices, adjustments, refund actions, and records." 
          icon={CreditCard} 
        />
        
        {/* MONTH PICKER */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm">
          <div className="pl-2 pr-1 text-slate-400">
            <CalendarDays size={16} />
          </div>
          <select 
            value={currentMonth}
            onChange={(e) => router.push(`/admin/billing?month=${e.target.value}`)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 outline-none pr-3 py-1 cursor-pointer appearance-none"
          >
            {/* Generate last 12 months as options */}
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
              const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return <option key={val} value={val}>{label}</option>
            })}
          </select>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileText size={12}/> Total Billed</p>
          <p className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-slate-200 mt-2">₹{totalBilled.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12}/> Total Collected</p>
          <p className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">₹{totalCollected.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Receipt size={12}/> Extra Milk Revenue</p>
          <p className="text-2xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-2">₹{totalExtraMilk.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={12}/> Credits Debited</p>
          <p className="text-2xl font-black font-mono tracking-tight text-purple-600 dark:text-purple-400 mt-2">₹{totalCredits.toFixed(2)}</p>
        </div>
      </div>
      
      {/* TABS NAVIGATION & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex overflow-x-auto hide-scrollbar w-full sm:w-auto">
        {[
          { id: 'invoices', label: 'Invoices', icon: FileText },
          { id: 'adjustments', label: 'Adjustments', icon: Settings2 },
          { id: 'payments', label: 'Payments', icon: Receipt }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all relative cursor-pointer outline-none",
                isActive 
                  ? "border-[#014DA4] dark:border-blue-400 text-[#014DA4] dark:text-blue-400 font-black" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <Icon size={16} className={isActive ? "stroke-[2.5]" : ""} />
              <span>{tab.label}</span>
            </button>
          )
        })}
        </div>

        <div className="relative w-full sm:w-64 pb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 mb-1.5" size={14} />
          <input 
            type="text"
            placeholder="Search customer or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* RENDER ACTIVE TAB SHEET */}
      <div className="pt-2">
        {activeTab === 'invoices' && <DataTable data={filteredInvoices} columns={invoiceColumns} onView={setViewingEntry} />}
        {activeTab === 'adjustments' && <DataTable data={filteredAdjustments} columns={adjustmentColumns} onView={setViewingEntry} />}
        {activeTab === 'payments' && <DataTable data={filteredPayments} columns={paymentColumns} onView={setViewingEntry} />}
      </div>

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Billing Details"
        data={viewingEntry}
      />
    </div>
  )
}
