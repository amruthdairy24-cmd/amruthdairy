'use client'

import { useState } from 'react'
import { Users, Phone, MapPin } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'
import { cn } from '@/lib/utils'

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  area: string;
  is_active: boolean;
  created_at: string;
}

export function CustomersClient({ data }: { data: Customer[] }) {
  const [viewingEntry, setViewingEntry] = useState<Customer | null>(null)
  
  // Format dates cleanly like "24 Jun 2026"
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const columns: ColumnDef<Customer>[] = [
    { 
      header: 'Name', 
      cell: (row) => {
        // Generate beautiful gradient avatars based on name initials
        const nameParts = row.full_name ? row.full_name.trim().split(/\s+/) : [];
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : (nameParts[0]?.[0] || 'C').toUpperCase();
          
        // List of bright, premium gradients for avatars
        const gradients = [
          "from-blue-500 to-indigo-600",
          "from-violet-500 to-fuchsia-600",
          "from-emerald-500 to-teal-600",
          "from-amber-500 to-orange-600",
          "from-rose-500 to-pink-600",
          "from-sky-500 to-blue-600"
        ];
        
        // Pick a gradient deterministically based on character code sum of full name
        const charSum = row.full_name ? row.full_name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) : 0;
        const avatarBg = gradients[charSum % gradients.length];

        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs flex-shrink-0",
              avatarBg
            )}>
              {initials}
            </div>
            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {row.full_name || 'Unnamed Customer'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                ID: #{row.id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Phone', 
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-600 dark:text-slate-300">
          <Phone size={13} className="text-slate-400 dark:text-slate-550 flex-shrink-0" />
          <span>{row.phone || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Area/Pin', 
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-600 dark:text-slate-300">
          <MapPin size={13} className="text-slate-400 dark:text-slate-550 flex-shrink-0" />
          <span>{row.area || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Joined', 
      cell: (row) => (
        <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
          {formatDate(row.created_at)}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      align: 'center',
      cell: (row) => (
        <div className="flex justify-center">
          <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} />
        </div>
      ) 
    },
  ]

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Customers" 
        description="Manage your customer database and profiles." 
        icon={Users} 
        actionLabel="Add Customer"
      />
      <DataTable data={data} columns={columns} onView={(row) => setViewingEntry(row)} />

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Customer Details"
        data={viewingEntry}
      />
    </div>
  )
}
