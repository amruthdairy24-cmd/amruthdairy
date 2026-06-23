'use client'

import { CreditCard } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

export function BillingClient({ data }: { data: Payment[] }) {
  const columns: ColumnDef<Payment>[] = [
    { header: 'Date', cell: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Customer', cell: (row) => row.profiles?.full_name || 'Unknown' },
    { header: 'Type', cell: (row) => row.payment_type.replace('_', ' ').toUpperCase() },
    { header: 'Amount', align: 'right', cell: (row) => `₹${row.amount}` },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div>
      <AdminHeader title="Billing & Payments" description="Manage invoices, payments, and outstanding balances." icon={CreditCard} />
      <DataTable data={data} columns={columns} />
    </div>
  )
}
