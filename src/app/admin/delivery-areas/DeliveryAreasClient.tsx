'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, Edit2, Save, X, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Area {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export default function DeliveryAreasClient({ initialAreas }: { initialAreas: Area[] }) {
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  
  // Create state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const filteredAreas = areas.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAreaName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/delivery-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAreaName.trim(), is_active: true })
      })
      const data = await res.json()
      if (data.success) {
        setAreas(prev => [...prev, data.area].sort((a, b) => a.name.localeCompare(b.name)))
        setNewAreaName('')
        setShowAddForm(false)
        toast.success('Area added successfully')
      } else {
        toast.error(data.message || 'Failed to add area')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/delivery-areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setAreas(prev => prev.map(a => a.id === id ? data.area : a).sort((a, b) => a.name.localeCompare(b.name)))
        setEditingId(null)
        toast.success('Area updated successfully')
      } else {
        toast.error(data.message || 'Failed to update area')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/delivery-areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      })
      const data = await res.json()
      if (data.success) {
        setAreas(prev => prev.map(a => a.id === id ? data.area : a))
        toast.success(`Area marked as ${!currentStatus ? 'Active' : 'Inactive'}`)
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery area? This action cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/delivery-areas?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setAreas(prev => prev.filter(a => a.id !== id))
        toast.success('Area deleted successfully')
      } else {
        toast.error(data.message || 'Failed to delete area')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Delivery Areas" 
        description="Manage all operational zones and delivery locations."
        icon={MapPin}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search delivery areas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Area
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Enter new area name..." 
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              autoFocus
              required
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50"
            >
              Save
            </button>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm shadow-sm"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Areas List */}
        <div className="space-y-3">
          {filteredAreas.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No delivery areas found. Add a new one to get started.
            </div>
          ) : (
            filteredAreas.map((area) => (
              <div 
                key={area.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm",
                  area.is_active ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-75"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    area.is_active ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  )}>
                    <MapPin size={18} />
                  </div>
                  
                  {editingId === area.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(area.id)} disabled={loading} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                    </div>
                  ) : (
                    <div>
                      <p className={cn("text-base font-bold", area.is_active ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                        {area.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                          area.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {area.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {editingId !== area.id && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button 
                      onClick={() => toggleActiveStatus(area.id, area.is_active)}
                      title={area.is_active ? "Disable Area" : "Enable Area"}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    >
                      {area.is_active ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                    <button 
                      onClick={() => { setEditingId(area.id); setEditName(area.name) }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(area.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  )
}
