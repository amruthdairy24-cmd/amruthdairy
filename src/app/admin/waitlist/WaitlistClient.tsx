'use client'

import { useState } from 'react'
import { Users, MessageCircle, X, RefreshCcw } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'
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
  const [viewingEntry, setViewingEntry] = useState<WaitlistEntry | null>(null)

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

          <button
            onClick={() => setViewingEntry(row)}
            className="inline-flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#014DA4] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors cursor-pointer w-[30px] h-[30px]" 
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
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
          window.location.reload()
        }}
      />

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Waitlist Entry Details"
        data={viewingEntry}
      />
    </div>
  )
}
