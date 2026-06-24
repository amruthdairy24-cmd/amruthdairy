'use client'

import { useState } from 'react'
import { CreditCard, FileText, Settings2, Receipt } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Invoice {
  id: string;
  billing_month: string;
  net_due: number;
  amount_paid: number;
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

export function BillingClient({ invoices, adjustments, payments }: { invoices: Invoice[], adjustments: Adjustment[], payments: Payment[] }) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'adjustments' | 'payments'>('invoices')
  const [isProcessing, setIsProcessing] = useState(false);

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

  const invoiceColumns: ColumnDef<Invoice>[] = [
    { header: 'Month', cell: (row) => new Date(row.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
    { header: 'Customer', cell: (row) => row.profiles?.full_name || 'Unknown' },
    { header: 'Net Due', align: 'right', cell: (row) => `₹${row.net_due}` },
    { header: 'Paid', align: 'right', cell: (row) => `₹${row.amount_paid}` },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.net_due <= row.amount_paid ? 'Paid' : 'Pending'} /> },
  ]

  const adjustmentColumns: ColumnDef<Adjustment>[] = [
    { header: 'Created', cell: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Customer', cell: (row) => row.profiles?.full_name || 'Unknown' },
    { header: 'Type', cell: (row) => row.adjustment_type.replace('_', ' ').toUpperCase() },
    { header: 'Description', cell: (row) => row.description || '-' },
    { header: 'Target Month', cell: (row) => new Date(row.target_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
    { header: 'Amount', align: 'right', cell: (row) => `₹${Math.abs(row.amount)} ${row.amount < 0 || row.adjustment_type.includes('credit') ? '(Credit)' : '(Charge)'}` },
    { header: 'Status', align: 'center', cell: (row) => {
      if (row.refund_status === 'requested') return <StatusBadge status="Refund Pending" />;
      if (row.refund_status === 'processed') return <StatusBadge status="Refunded" />;
      return <StatusBadge status={row.is_applied ? 'Applied' : 'Pending'} />;
    }},
    { header: 'Actions', align: 'center', cell: (row) => {
      if (row.refund_status === 'requested') {
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => handleRefundAction(row.id, 'process')} disabled={isProcessing} className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-700 disabled:opacity-50">Process</button>
            <button onClick={() => handleRefundAction(row.id, 'reject')} disabled={isProcessing} className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 disabled:opacity-50">Reject</button>
          </div>
        )
      }
      return null;
    }}
  ]

  const paymentColumns: ColumnDef<Payment>[] = [
    { header: 'Date', cell: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Customer', cell: (row) => row.profiles?.full_name || 'Unknown' },
    { header: 'Type', cell: (row) => row.payment_type.replace('_', ' ').toUpperCase() },
    { header: 'Amount', align: 'right', cell: (row) => `₹${row.amount}` },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <AdminHeader title="Billing & Payments" description="Manage invoices, payments, and outstanding balances." icon={CreditCard} />
      
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <FileText size={18} /> Invoices
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'adjustments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Settings2 size={18} /> Adjustments
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Receipt size={18} /> Payments
        </button>
      </div>

      <div className="pt-2">
        {activeTab === 'invoices' && <DataTable data={invoices} columns={invoiceColumns} />}
        {activeTab === 'adjustments' && <DataTable data={adjustments} columns={adjustmentColumns} />}
        {activeTab === 'payments' && <DataTable data={payments} columns={paymentColumns} />}
      </div>
    </div>
  )
}
