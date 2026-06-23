'use client'

import { Truck } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface DeliveryEntry {
  id: string;
  delivery_date: string;
  total_litres: number;
  delivery_status: string;
  profiles: { full_name: string; area: string };
}

export function DeliveriesClient({ data }: { data: DeliveryEntry[] }) {
  const columns: ColumnDef<DeliveryEntry>[] = [
    { header: 'Date', cell: (row) => new Date(row.delivery_date).toLocaleDateString() },
    { header: 'Customer', cell: (row) => row.profiles?.full_name || 'Unknown' },
    { header: 'Area', cell: (row) => row.profiles?.area || 'N/A' },
    { header: 'Total Load', align: 'right', cell: (row) => `${row.total_litres} L` },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.delivery_status} /> },
  ]

  return (
    <div>
      <AdminHeader title="Deliveries" description="Daily dispatch logs and delivery tracking." icon={Truck} />
      <DataTable data={data} columns={columns} />
    </div>
  )
}
