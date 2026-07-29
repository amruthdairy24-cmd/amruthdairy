'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, FileText, Settings2, Receipt, Coins, CalendarDays, Search } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'
import { cn } from '@/lib/utils'
import { isCreditAdjustmentType } from '@/lib/billing'
import toast from 'react-hot-toast'
import { SelectCustomerModal } from '@/components/admin/SelectCustomerModal'
import { AdminPaymentModal } from '@/components/admin/AdminPaymentModal'

interface Invoice {
  id: string;
  customer_id: string;
  billing_month: string;
  net_due: number;
  amount_paid: number;
  payment_status: string;
  extra_charges: number;
  skip_credit: number;
  pause_credit: number;
  profiles: { 
    full_name: string;
    subscriptions: { daily_rate: number }[] | { daily_rate: number };
  };
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
  method?: string;
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
  const [adjustmentViewMode, setAdjustmentViewMode] = useState<'log' | 'summary'>('log');

  // Payment Modal state
  const [showSelectCustomer, setShowSelectCustomer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [paymentDefaultAmount, setPaymentDefaultAmount] = useState<number | undefined>(undefined);

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
        toast.success(`Refund ${action}ed successfully.`);
        window.location.reload();
      } else {
        toast.error(data.message || `Failed to ${action} refund`);
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
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

  // Helper to calculate true net due for a given invoice
  const calculateTrueDue = (row: Invoice) => {
    const d = new Date(row.billing_month);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    let dailyRate = 0;
    if (Array.isArray(row.profiles?.subscriptions) && row.profiles.subscriptions.length > 0) {
      dailyRate = row.profiles.subscriptions[0].daily_rate || 0;
    } else if (row.profiles?.subscriptions && !Array.isArray(row.profiles.subscriptions)) {
      dailyRate = (row.profiles.subscriptions as any).daily_rate || 0;
    }
    const baseSubscription = dailyRate * daysInMonth;
    const customerAdjustments = adjustments.filter(a => a.profiles?.full_name === row.profiles?.full_name);
    const referralCredits = customerAdjustments
      .filter(a => a.adjustment_type === 'referral_credit' || a.adjustment_type === 'credit')
      .reduce((sum, a) => sum + Math.abs(a.amount), 0);
    const totalCredits = (row.skip_credit || 0) + (row.pause_credit || 0) + referralCredits;
    const totalExtra = (row.extra_charges || 0);
    const realNetDue = Math.max(0, baseSubscription + totalExtra - totalCredits);
    return row.net_due > 0 ? row.net_due : realNetDue;
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
      header: 'Breakdown / Verdict', 
      cell: (row) => {
        // Calculate Base
        const d = new Date(row.billing_month);
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        
        let dailyRate = 0;
        if (Array.isArray(row.profiles?.subscriptions) && row.profiles.subscriptions.length > 0) {
          dailyRate = row.profiles.subscriptions[0].daily_rate || 0;
        } else if (row.profiles?.subscriptions && !Array.isArray(row.profiles.subscriptions)) {
          dailyRate = (row.profiles.subscriptions as any).daily_rate || 0;
        }

        const baseSubscription = dailyRate * daysInMonth;
        
        // Calculate Credits
        const customerAdjustments = adjustments.filter(a => a.profiles?.full_name === row.profiles?.full_name);
        const referralCredits = customerAdjustments
          .filter(a => a.adjustment_type === 'referral_credit' || a.adjustment_type === 'credit')
          .reduce((sum, a) => sum + Math.abs(a.amount), 0);
          
        const totalCredits = (row.skip_credit || 0) + (row.pause_credit || 0) + referralCredits;
        const totalExtra = (row.extra_charges || 0);

        // The verdict logic: Extra Expenses vs Credits
        const extraMinusCredits = totalExtra - totalCredits;
        
        const isCarryForward = extraMinusCredits < 0;
        const isAddedToBill = extraMinusCredits > 0;
        const verdictAmount = Math.abs(extraMinusCredits);

        return (
          <div className="flex flex-col gap-1.5 w-[240px]">
            {/* Breakdown row */}
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400">Base Subscription</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">₹{baseSubscription}</span>
            </div>
            {(totalExtra > 0 || totalCredits > 0) && (
              <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-100 dark:border-slate-800 pt-1">
                <span className="text-slate-400">Extras & Credits</span>
                <div className="flex gap-2 font-mono">
                  {totalExtra > 0 && <span className="text-amber-500">+₹{totalExtra}</span>}
                  {totalCredits > 0 && <span className="text-emerald-500">-₹{totalCredits}</span>}
                </div>
              </div>
            )}
            
            {/* Verdict Badge */}
            {(isCarryForward || isAddedToBill) && (
              <div className={cn(
                "mt-0.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex justify-between items-center",
                isCarryForward 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50"
              )}>
                <span>Verdict:</span>
                <span>{isCarryForward ? `Carry Forward ₹${verdictAmount}` : `Added to Bill +₹${verdictAmount}`}</span>
              </div>
            )}
            {!isCarryForward && !isAddedToBill && (
                <div className="mt-0.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 flex justify-between items-center">
                  <span>Verdict:</span>
                  <span>Balanced (₹0)</span>
                </div>
            )}
          </div>
        )
      }
    },
    { 
      header: 'Net Due', 
      align: 'right', 
      cell: (row) => {
        const displayDue = calculateTrueDue(row);

        return (
          <span className="text-[14.5px] font-black text-slate-800 dark:text-slate-200 font-mono">
            ₹{displayDue}
          </span>
        )
      } 
    },
    { 
      header: 'Paid', 
      align: 'right', 
      cell: (row) => {
        return (
          <span className={cn(
            "text-[14.5px] font-bold font-mono",
            row.amount_paid > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
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
        const displayDue = calculateTrueDue(row);
        const isPaid = row.payment_status === 'paid' || (displayDue > 0 && row.amount_paid >= displayDue) || (displayDue === 0 && row.amount_paid === 0 && row.payment_status === 'paid');
        return <StatusBadge status={isPaid ? 'Paid' : 'Pending'} />
      } 
    },
    { 
      header: 'Actions', 
      align: 'center', 
      cell: (row) => {
        const displayDue = calculateTrueDue(row);
        const isPaid = row.payment_status === 'paid' || (displayDue > 0 && row.amount_paid >= displayDue) || (displayDue === 0 && row.amount_paid === 0 && row.payment_status === 'paid');
        if (isPaid || displayDue === 0) return <span className="text-xs text-slate-300 dark:text-slate-600 font-mono">—</span>;
        
        return (
          <button 
            onClick={() => {
              setSelectedCustomerId(row.customer_id) 
              setSelectedCustomerName(row.profiles?.full_name || 'Customer')
              setPaymentDefaultAmount(Math.max(0, displayDue - row.amount_paid))
              setShowPaymentModal(true)
            }}
            className="px-3 h-7 bg-purple-600 hover:bg-purple-600/95 text-white text-[10.5px] font-bold rounded-lg shadow-3xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
          >
            Record Payment
          </button>
        )
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
        const isCredit = row.amount < 0 || isCreditAdjustmentType(row.adjustment_type)
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
        const isCredit = row.amount < 0 || isCreditAdjustmentType(row.adjustment_type)
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

  /* ── ADJUSTMENT SUMMARY COLUMNS ── */
  interface AdjustmentSummary {
    id: string;
    customer_id: string;
    customer_name: string;
    skip_credits: number;
    referral_credits: number;
    extra_milk: number;
    verdict_amount: number;
    is_carry_forward: boolean;
    is_added_to_bill: boolean;
  }

  const customerSummaries: AdjustmentSummary[] = invoices.map(inv => {
    const customerAdjustments = adjustments.filter(a => a.profiles?.full_name === inv.profiles?.full_name);
    const referralCredits = customerAdjustments
      .filter(a => a.adjustment_type === 'referral_credit' || a.adjustment_type === 'credit')
      .reduce((sum, a) => sum + Math.abs(a.amount), 0);
      
    const skipCredits = (inv.skip_credit || 0) + (inv.pause_credit || 0);
    const extraMilk = inv.extra_charges || 0;
    const extraMinusCredits = extraMilk - (skipCredits + referralCredits);
    
    return {
      id: inv.customer_id || inv.id, // DataTable requires an 'id' for React keys
      customer_id: inv.customer_id || inv.id,
      customer_name: inv.profiles?.full_name || 'Unknown',
      skip_credits: skipCredits,
      referral_credits: referralCredits,
      extra_milk: extraMilk,
      verdict_amount: Math.abs(extraMinusCredits),
      is_carry_forward: extraMinusCredits < 0,
      is_added_to_bill: extraMinusCredits > 0,
    }
  });

  const adjustmentSummaryColumns: ColumnDef<AdjustmentSummary>[] = [
    { 
      header: 'Customer', 
      cell: (row) => renderCustomerCell(row.customer_name, row.customer_id) 
    },
    { 
      header: 'Skip Credits', 
      align: 'right', 
      cell: (row) => <span className="text-[13.5px] font-black font-mono text-emerald-600 dark:text-emerald-400">₹{row.skip_credits}</span> 
    },
    { 
      header: 'Referral Credits', 
      align: 'right', 
      cell: (row) => <span className="text-[13.5px] font-black font-mono text-emerald-600 dark:text-emerald-400">₹{row.referral_credits}</span> 
    },
    { 
      header: 'Extra Milk', 
      align: 'right', 
      cell: (row) => <span className="text-[13.5px] font-black font-mono text-amber-600 dark:text-amber-400">₹{row.extra_milk}</span> 
    },
    { 
      header: 'Verdict', 
      align: 'center', 
      cell: (row) => {
        if (row.is_carry_forward) return <span className="text-[10px] uppercase tracking-wider font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1.5 rounded-lg shadow-sm">Carry Forward ₹{row.verdict_amount}</span>;
        if (row.is_added_to_bill) return <span className="text-[10px] uppercase tracking-wider font-black text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-2.5 py-1.5 rounded-lg shadow-sm">Added to Bill ₹{row.verdict_amount}</span>;
        return <span className="text-[10px] uppercase tracking-wider font-black text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg shadow-sm">Balanced ₹0</span>;
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
          <span>{(row.method || row.payment_type).replace('_', ' ').toUpperCase()}</span>
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
  const totalBilled = invoices.reduce((sum, inv) => sum + calculateTrueDue(inv), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalExtraMilk = invoices.reduce((sum, inv) => sum + (inv.extra_charges || 0), 0);
  const totalCredits = invoices.reduce((sum, inv) => {
    const customerAdjustments = adjustments.filter(a => a.profiles?.full_name === inv.profiles?.full_name);
    const referralCredits = customerAdjustments
      .filter(a => a.adjustment_type === 'referral_credit' || a.adjustment_type === 'credit')
      .reduce((s, a) => s + Math.abs(a.amount), 0);
    return sum + (inv.skip_credit || 0) + (inv.pause_credit || 0) + referralCredits;
  }, 0);

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
  const filteredSummaries = filterList(customerSummaries)

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminHeader 
          title="Billing & Payments" 
          description="Manage customer invoices, adjustments, refund actions, and records." 
          icon={CreditCard}
          actionLabel="Record Payment"
          onAction={() => {
            setPaymentDefaultAmount(undefined)
            setShowSelectCustomer(true)
          }}
          hideSearchRow={true}
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
              d.setDate(1); // Set to 1st of the month to avoid overflow on 31st
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
        {activeTab === 'adjustments' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit shadow-inner">
              <button 
                onClick={() => setAdjustmentViewMode('log')}
                className={cn(
                  "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all", 
                  adjustmentViewMode === 'log' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Detailed Log
              </button>
              <button 
                onClick={() => setAdjustmentViewMode('summary')}
                className={cn(
                  "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all", 
                  adjustmentViewMode === 'summary' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Customer Summaries
              </button>
            </div>
            
            {adjustmentViewMode === 'log' ? (
              <DataTable data={filteredAdjustments} columns={adjustmentColumns} onView={setViewingEntry} />
            ) : (
              <DataTable data={filteredSummaries} columns={adjustmentSummaryColumns} onView={setViewingEntry} />
            )}
          </div>
        )}
        {activeTab === 'payments' && <DataTable data={filteredPayments} columns={paymentColumns} onView={setViewingEntry} />}
      </div>

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Billing Details"
        data={viewingEntry}
      />

      {/* Select Customer Modal for Record Payment */}
      <SelectCustomerModal 
        isOpen={showSelectCustomer}
        onClose={() => setShowSelectCustomer(false)}
        actionContext={{ title: 'Record Payment', subtitle: 'Select customer to receive payment' }}
        filter="unpaid"
        onSelect={(customerId, customerName) => {
          setShowSelectCustomer(false)
          setSelectedCustomerId(customerId)
          setSelectedCustomerName(customerName)
          
          // Look up their invoice for the current month to compute default amount
          const invoice = invoices.find(inv => inv.customer_id === customerId);
          if (invoice) {
            const displayDue = calculateTrueDue(invoice);
            setPaymentDefaultAmount(Math.max(0, displayDue - invoice.amount_paid));
          } else {
            setPaymentDefaultAmount(undefined);
          }
          
          setShowPaymentModal(true)
        }}
      />

      {/* Admin Payment Modal */}
      {selectedCustomerId && selectedCustomerName && (
        <AdminPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedCustomerId(null)
            setSelectedCustomerName(null)
            setPaymentDefaultAmount(undefined)
          }}
          onSuccess={() => {
            router.refresh()
          }}
          customerId={selectedCustomerId}
          customerName={selectedCustomerName}
          defaultAmount={paymentDefaultAmount}
          targetMonth={currentMonth}
        />
      )}
    </div>
  )
}
