'use client'

import { useState } from 'react'
import { Users, MessageCircle } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { NotifyModal } from './NotifyModal'

interface WaitlistEntry {
  id: string;
  quantity_litres: number;
  requested_start_date: string;
  status: string;
  created_at: string;
  profiles: { full_name: string; phone?: string; area: string };
}

export function WaitlistClient({ data }: { data: WaitlistEntry[] }) {
  const [notifyModalOpen, setNotifyModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)

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
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'waiting' && (
            <button
              onClick={() => {
                setSelectedEntry(row)
                setNotifyModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-colors"
            >
              <MessageCircle size={14} />
              <span>Notify</span>
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <AdminHeader title="Waitlist" description="Manage potential customers waiting for slot availability." icon={Users} actionLabel="Add to Waitlist" />
      <DataTable data={data} columns={columns} />
      
      <NotifyModal
        isOpen={notifyModalOpen}
        onClose={() => {
          setNotifyModalOpen(false)
          setSelectedEntry(null)
        }}
        waitlistEntry={selectedEntry}
        onSuccess={() => {
          // In a real app, we might mutate the SWR cache or refresh the router
          window.location.reload()
        }}
      />
    </div>
  )
}
