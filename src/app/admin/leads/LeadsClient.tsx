'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare, Phone, Calendar, Trash2, Search, Send, Sparkles, CheckCircle, ExternalLink, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subscriber {
  id: string
  phone: string
  status: string
  created_at: string
}

interface Stats {
  total_subscribers: number
  new_this_month: number
}

const TEMPLATES = [
  {
    id: 'welcome',
    title: '🎁 Welcome & Trial Offer',
    text: 'Hello! Thank you for subscribing to Amruth Dairy. Get 100% pure, unpasteurized farm-fresh cow milk delivered by 7 AM. Book your trial plan today at https://amruthfarmkudla.com'
  },
  {
    id: 'trial_promo',
    title: '🥛 3-Day Farm Milk Trial',
    text: 'Hi! Experience farm-fresh milk straight from our Kudla farm. No chemicals, no preservatives. Subscribe now at https://amruthfarmkudla.com/subscribe'
  },
  {
    id: 'schedule_update',
    title: '🚚 Morning Delivery Update',
    text: 'Good morning from Amruth Dairy! Our dawn milking is complete and fresh milk is out for delivery before 7:00 AM. Stay fresh!'
  }
]

export default function LeadsClient({
  initialSubscribers,
  initialStats
}: {
  initialSubscribers: Subscriber[]
  initialStats: Stats
}) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id)
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].text)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [newLeadNotification, setNewLeadNotification] = useState<string | null>(null)

  // Real-time polling for new leads every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/leads')
        const data = await res.json()
        if (data.success && Array.isArray(data.subscribers)) {
          const fetched: Subscriber[] = data.subscribers
          setSubscribers(prev => {
            if (fetched.length > prev.length) {
              const newest = fetched[0]
              if (newest) {
                setNewLeadNotification(`🎉 New Lead Received! +91 ${newest.phone}`)
                setTimeout(() => setNewLeadNotification(null), 7000)
              }
            }
            return fetched
          })
          if (data.stats) setStats(data.stats)
        }
      } catch (err) {
        console.error('Leads polling error:', err)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const tmpl = TEMPLATES.find(t => t.id === templateId)
    if (tmpl) {
      setCustomMessage(tmpl.text)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/leads')
      const data = await res.json()
      if (data.success) {
        setSubscribers(data.subscribers || [])
        setStats(data.stats || { total_subscribers: 0, new_this_month: 0 })
      }
    } catch (err) {
      console.error('Refresh error', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscriber lead?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSubscribers(prev => prev.filter(s => s.id !== id))
        setStats(prev => ({ ...prev, total_subscribers: Math.max(0, prev.total_subscribers - 1) }))
      }
    } catch (err) {
      console.error('Delete lead error', err)
    } finally {
      setDeletingId(null)
    }
  }

  const getWhatsAppLink = (phone: string) => {
    const cleanDigits = phone.replace(/\D/g, '')
    const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(customMessage)}`
  }

  const filteredSubscribers = subscribers.filter(s =>
    s.phone.includes(search.trim())
  )

  return (
    <div className="space-y-6">

      {/* Real-time New Lead Notification Toast */}
      {newLeadNotification && (
        <div className="bg-emerald-600 text-white font-bold p-4 rounded-2xl shadow-xl border border-emerald-400 flex items-center justify-between animate-bounce">
          <span className="flex items-center gap-2 text-sm font-black">
            <Sparkles size={18} /> {newLeadNotification}
          </span>
          <button
            type="button"
            onClick={() => setNewLeadNotification(null)}
            className="text-white hover:text-emerald-100 font-bold text-xs bg-white/20 px-3 py-1 rounded-lg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 mb-2">
            <MessageSquare size={12} /> STAY FRESH Marketing Leads
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
            Newsletter Leads & WhatsApp Reachout
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            View phone numbers submitted via website footer & send prefilled WhatsApp messages.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-bold text-xs transition-all cursor-pointer border-none disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stay Fresh Leads</p>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {stats.total_subscribers}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 mt-1">Ready for WhatsApp outreach</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Phone size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New This Month</p>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {stats.new_this_month}
            </p>
            <p className="text-[11px] font-bold text-sky-600 mt-1">Recent website signups</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Direct Redirection</p>
            <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              100%
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-1">wa.me prefilled link ready</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Send size={22} />
          </div>
        </div>
      </div>

      {/* WhatsApp Message Configuration Box */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 rounded-2xl text-white shadow-lg border border-emerald-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black font-display flex items-center gap-2">
            <Send size={18} className="text-emerald-400" /> WhatsApp Message Toolbar (wa.me)
          </h3>
          <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30">
            Prefilled WhatsApp Links
          </span>
        </div>

        {/* Template Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTemplateChange(t.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                selectedTemplate === t.id
                  ? "bg-white/15 border-emerald-400 text-white font-bold shadow-md"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              )}
            >
              <span className="text-xs font-extrabold">{t.title}</span>
              <span className="text-[10px] text-slate-300/80 line-clamp-1 mt-1">{t.text}</span>
            </button>
          ))}
        </div>

        {/* Custom Message Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
            Active WhatsApp Message Content (Will be attached to wa.me links):
          </label>
          <textarea
            rows={2}
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans leading-relaxed"
            placeholder="Type custom message to send on WhatsApp..."
          />
        </div>
      </div>

      {/* Subscriber List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Subscribed Numbers ({filteredSubscribers.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No newsletter subscribers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-extrabold">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">WhatsApp Phone Number</th>
                  <th className="py-3.5 px-4">Subscribed Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action (wa.me)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredSubscribers.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white font-mono text-sm">
                      +91 {sub.phone}
                    </td>

                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(sub.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                        <CheckCircle size={10} /> Active Subscriber
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={getWhatsAppLink(sub.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow-sm transition-all text-decoration-none"
                        >
                          <Send size={12} />
                          <span>Send WhatsApp</span>
                          <ExternalLink size={10} />
                        </a>

                        <button
                          onClick={() => handleDelete(sub.id)}
                          disabled={deletingId === sub.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none disabled:opacity-50"
                          title="Delete Lead"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
