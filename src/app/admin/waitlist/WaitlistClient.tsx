'use client'

import { Users } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface WaitlistEntry {
  id: string;
  quantity_litres: number;
  status: string;
  created_at: string;
  profiles: { full_name: string; area: string };
}

export function WaitlistClient({ data }: { data: WaitlistEntry[] }) {
  const columns: ColumnDef<WaitlistEntry>[] = [
    { header: 'Name', cell: (row) => row.profiles?.full_name || 'Unknown' },
    { header: 'Area/Pin', cell: (row) => row.profiles?.area || 'N/A' },
    { header: 'Requested Plan', cell: (row) => `${row.quantity_litres}L Custom` },
    { 
      header: 'Days Waiting', 
      align: 'right',
      cell: (row) => {
        const days = Math.floor((new Date().getTime() - new Date(row.created_at).getTime()) / (1000 * 3600 * 24))
        return `${days} Days`
      }
    },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div>
      <AdminHeader title="Waitlist" description="Manage potential customers waiting for slot availability." icon={Users} actionLabel="Add to Waitlist" />
      <DataTable data={data} columns={columns} />
    </div>
  )
}
