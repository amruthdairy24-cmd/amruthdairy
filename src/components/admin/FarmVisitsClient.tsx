'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, CheckCircle2, User, Phone, MapPin, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from './StatusBadge'

interface FarmVisit {
  id: string
  name: string
  mobile: string
  address: string
  status: string
  created_at: string
}

export default function FarmVisitsClient() {
  const [visits, setVisits] = useState<FarmVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchVisits()
  }, [])

  const fetchVisits = async () => {
    try {
      const res = await fetch('/api/admin/farm-visits')
      const data = await res.json()
      if (data.success) {
        setVisits(data.data)
      } else {
        toast.error('Failed to load farm visits')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/farm-visits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`)
        setVisits(visits.map(v => v.id === id ? { ...v, status: newStatus } : v))
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error updating status')
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(d)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-cabinet tracking-tight">Farm Visits</h1>
          <p className="text-sm text-slate-500 mt-1">Manage farm visit requests</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Visitor Details</th>
                <th className="px-6 py-4 whitespace-nowrap">Address</th>
                <th className="px-6 py-4 whitespace-nowrap">Requested On</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading visits...
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6 text-slate-400" />
                    </div>
                    No visit requests found.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {visit.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={12} />
                            {visit.mobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={visit.address}>
                        {visit.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(visit.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={visit.status} 
                        type={
                          visit.status === 'pending' ? 'warning' :
                          visit.status === 'contacted' ? 'info' :
                          'success'
                        } 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {visit.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(visit.id, 'contacted')}
                            disabled={updating === visit.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/30 transition-colors"
                          >
                            {updating === visit.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Mark Contacted
                          </button>
                        )}
                        {visit.status === 'contacted' && (
                          <button
                            onClick={() => updateStatus(visit.id, 'completed')}
                            disabled={updating === visit.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/30 transition-colors"
                          >
                            {updating === visit.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Mark Completed
                          </button>
                        )}
                        {visit.status === 'completed' && (
                          <span className="text-xs text-emerald-500 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
