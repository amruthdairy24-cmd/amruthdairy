'use client'

import { BarChart2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Report {
  id: string;
  name: string;
  type: string;
  generatedDate: string;
  status: string;
}

export function ReportsClient({ data }: { data: Report[] }) {
  const columns: ColumnDef<Report>[] = [
    { header: 'Report Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'type' },
    { header: 'Generated', accessorKey: 'generatedDate' },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div>
      <AdminHeader title="Reports" description="Generate and download business intelligence reports." icon={BarChart2} actionLabel="Generate Report" />
      <DataTable data={data} columns={columns} />
    </div>
  )
}
