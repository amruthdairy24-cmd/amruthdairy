'use client'

import { useState } from 'react'
import { Users, MessageCircle, X, RefreshCcw } from 'lucide-react'
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return
    
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/waitlist/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlist_id: id, status: newStatus })
      })
      const json = await res.json()
      if (json.success) {
        window.location.reload()
      } else {
        alert(json.message || 'Failed to update status')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setUpdatingId(null)
    }
  }

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
          {(row.status === 'waiting' || row.status === 'notified') && (
            <button
              onClick={() => {
                setSelectedEntry(row)
                setNotifyModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-colors"
            >
              <MessageCircle size={14} />
              <span>{row.status === 'notified' ? 'Notify Again' : 'Notify'}</span>
            </button>
          )}
          
          {(row.status === 'waiting' || row.status === 'notified') && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'cancelled')}
              disabled={updatingId === row.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          )}

          {row.status === 'cancelled' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'waiting')}
              disabled={updatingId === row.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RefreshCcw size={14} />
              <span>Re-open</span>
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
