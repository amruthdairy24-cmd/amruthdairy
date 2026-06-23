'use client'

import { Users } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  area: string;
  is_active: boolean;
  created_at: string;
}

export function CustomersClient({ data }: { data: Customer[] }) {
  const columns: ColumnDef<Customer>[] = [
    { header: 'Name', accessorKey: 'full_name' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Area/Pin', accessorKey: 'area' },
    { 
      header: 'Joined', 
      cell: (row) => new Date(row.created_at).toLocaleDateString() 
    },
    { 
      header: 'Status', 
      align: 'center',
      cell: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} /> 
    },
  ]

  return (
    <div>
      <AdminHeader 
        title="Customers" 
        description="Manage your customer database and profiles." 
        icon={Users} 
        actionLabel="Add Customer"
      />
      <DataTable data={data} columns={columns} />
    </div>
  )
}
