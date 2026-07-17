'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, MapPin, Phone, Edit3, Save, AlertCircle, CheckCircle, Milk, FileText, Calendar, Shield, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DELIVERY_AREAS } from '@/lib/constants'
import { useDashboardData } from '@/contexts/DashboardDataContext'

interface ProfileData {
  full_name: string
  phone: string
  address: string
  area: string
  landmark: string
  floor_notes: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
} as const

export default function AccountPage() {
  const { data, loading: contextLoading, refetch } = useDashboardData()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '', phone: '', address: '', area: '', landmark: '', floor_notes: ''
  })
  const [editForm, setEditForm] = useState<ProfileData>({
    full_name: '', phone: '', address: '', area: '', landmark: '', floor_notes: ''
  })

  const [subscription, setSubscription] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState<any>(null)
  const [latestPaidMonth, setLatestPaidMonth] = useState<string | null>(null)

  function getNextRenewalDate(latestPaidMonthStr: string | null, subStatus: string) {
    const currentDate = new Date()
    const curMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    let baseMonthStr = latestPaidMonthStr

    const currentMonthStr = `${currentYear}-${String(curMonth).padStart(2, '0')}-01`
    if ((subStatus === 'active' || subStatus === 'paused') && (!baseMonthStr || baseMonthStr < currentMonthStr)) {
      baseMonthStr = currentMonthStr
    }

    if (!baseMonthStr) {
      const currentMonthDate = new Date(currentYear, curMonth - 1, 1)
      return currentMonthDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const parts = baseMonthStr.split('-')
    if (parts.length < 2) return 'N/A'
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const nextMonthDate = new Date(year, month, 1)
    return nextMonthDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  async function loadProfile() {
    try {
      setLoading(true)
      const profileRes = await fetch('/api/customer/profile')
      const profileJson = await profileRes.json()
      if (profileJson.success && profileJson.profile) {
        const p = profileJson.profile
        const pData = {
          full_name: p.full_name || '', phone: p.phone || '', address: p.address || '',
          area: p.area || '', landmark: p.landmark || '', floor_notes: p.floor_notes || ''
        }
        setProfile(pData); setEditForm(pData)
      }
    } catch (err) {
      setError('Failed to load account details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (data) {
      setSubscription(data.subscription || null)
      setCurrentMonth(data.current_month || null)
      setLatestPaidMonth(data.latest_paid_month || null)
    }
  }, [data])

  async function loadData() {
    await Promise.all([loadProfile(), refetch()])
  }

  function startEditing() {
    setEditForm({ ...profile })
    setIsEditing(true)
    setError(''); setSuccessMsg('')
  }

  function cancelEditing() {
    setIsEditing(false)
    setError(''); setSuccessMsg('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.full_name || !editForm.address || !editForm.area) {
      return setError('Name, address, and area are required.')
    }

    setSaving(true); setError(''); setSuccessMsg('')

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editForm.full_name, address: editForm.address, area: editForm.area,
          landmark: editForm.landmark, floor_notes: editForm.floor_notes
        })
      })
      const json = await res.json()
      if (json.success) {
        setProfile({ ...editForm })
        setIsEditing(false)
        setSuccessMsg('Profile updated successfully!')
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setError(json.message || 'Failed to update profile')
      }
    } catch (err) {
      setError('Network error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const memberSince = subscription?.start_date
    ? new Date(subscription.start_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'N/A'

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
        <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
        <div className="h-[280px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full space-y-6 relative"
    >
      {/* Ambient background auras */}
      <div className="absolute -top-32 -right-32 w-[320px] h-[320px] bg-gradient-to-br from-blue-500/5 to-sky-400/5 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute top-[50%] -left-32 w-[260px] h-[260px] bg-gradient-to-tr from-blue-400/5 to-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />

      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#014DA4]/10 text-[#014DA4] dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <User size={20} className="stroke-[2.3]" />
            </div>
            <span>My Account</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-2 pl-1">
            Manage your profile, delivery details, and subscription info.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-white dark:bg-slate-900 border border-border dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer self-start sm:self-center"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        )}
      </motion.div>

      {/* ── Success banner ── */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm z-10"
        >
          <CheckCircle size={15} />
          {successMsg}
        </motion.div>
      )}

      {/* ── Hero Banner — matches dashboard #014DA4 blue ── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-[#014DA4] dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 text-white shadow-lg border border-white/10 dark:border-slate-800 z-10"
      >
        {/* Decorative glows */}
        <div className="absolute -top-6 -right-6 w-56 h-56 rounded-full pointer-events-none filter blur-[55px] opacity-25 bg-amber-300 dark:opacity-10" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none filter blur-[45px] opacity-15 bg-sky-300" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar circle */}
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner flex items-center justify-center text-3xl font-black text-white select-none flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-white/50 mb-1">Customer Account</p>
              <h2 className="text-[22px] font-black font-display text-white leading-tight">
                {profile.full_name || 'Customer'}
              </h2>
              <p className="text-xs text-blue-200/80 font-semibold flex items-center gap-1.5 mt-1.5">
                <Phone size={12} />
                {profile.phone || 'No phone on file'}
              </p>
              {subscription && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-100 border border-white/10 backdrop-blur-md">
                  <Milk size={10} />
                  <span>{subscription.quantity_litres}L Daily · Since {memberSince}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery area pill — right side */}
          {profile.area && (
            <div className="hidden sm:flex flex-col items-end gap-1.5">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-white/40">Delivery Zone</p>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-3 py-2 backdrop-blur-md">
                <MapPin size={13} className="text-white/70" />
                <span className="text-sm font-black text-white">{profile.area}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Subscription Stats Row ── */}
      {subscription && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 z-10 relative">

          {/* Daily Plan */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Milk size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daily Plan</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                  {subscription.quantity_litres === 0.5 ? '½' : subscription.quantity_litres}L
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
              ₹{subscription.daily_rate?.toFixed(2)} / day
            </div>
          </div>

          {/* Monthly Bill */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Bill</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                  ₹{subscription.monthly_amount?.toFixed(0)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
              Net due: ₹{(currentMonth?.net_due || 0).toFixed(2)}
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#014DA4]/10 border border-[#014DA4]/20 text-[#014DA4] dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Member Since</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white mt-1 leading-tight">{memberSince}</p>
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                subscription.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {subscription.status}
              </span>
            </div>
          </div>

          {/* Next Renewal */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                <RefreshCw size={17} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Next Renewal</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white mt-1 leading-tight">
                  {getNextRenewalDate(latestPaidMonth, subscription.status)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              Due on 1st of month
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Profile Details Card ── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden z-10 relative">

        {/* Card header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-[#014DA4]" />
            <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-200 tracking-tight">Profile Details</h3>
          </div>
          {isEditing && (
            <span className="text-[10px] font-black text-[#014DA4] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Editing
            </span>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="p-6 md:p-7 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name *</label>
                <input
                  required
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#014DA4]/20 focus:border-[#014DA4] transition-all shadow-sm"
                  placeholder="Your full name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone</label>
                <input
                  disabled
                  type="text"
                  value={editForm.phone}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-400 dark:text-slate-500 outline-none cursor-not-allowed opacity-75"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Phone cannot be changed</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Delivery Area *</label>
              <div className="relative">
                <select
                  required
                  value={editForm.area}
                  onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#014DA4]/20 focus:border-[#014DA4] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">Select area</option>
                  {DELIVERY_AREAS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Address *</label>
              <textarea
                required
                rows={2}
                value={editForm.address}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#014DA4]/20 focus:border-[#014DA4] resize-none shadow-sm"
                placeholder="House/flat number, street, building"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Landmark</label>
                <input
                  type="text"
                  value={editForm.landmark}
                  onChange={e => setEditForm({ ...editForm, landmark: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#014DA4]/20 focus:border-[#014DA4] shadow-sm"
                  placeholder="Near temple, opposite park..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Floor / Gate Notes</label>
                <input
                  type="text"
                  value={editForm.floor_notes}
                  onChange={e => setEditForm({ ...editForm, floor_notes: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#014DA4]/20 focus:border-[#014DA4] shadow-sm"
                  placeholder="2nd floor, left gate..."
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cancelEditing}
                className="flex-1 h-11 rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/90 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm border-none cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={14} strokeWidth={2.5} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 md:p-7 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-border/40 dark:border-slate-700/50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Full Name</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{profile.full_name || '—'}</p>
              </div>
              <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-border/40 dark:border-slate-700/50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Phone</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{profile.phone || '—'}</p>
              </div>
            </div>
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-border/40 dark:border-slate-700/50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Delivery Area</p>
              <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={15} className="text-[#014DA4] dark:text-blue-400" />
                {profile.area || '—'}
              </p>
            </div>
            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-border/40 dark:border-slate-700/50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Address</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{profile.address || '—'}</p>
              {profile.landmark && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                  <span className="font-black">Landmark:</span> {profile.landmark}
                </p>
              )}
              {profile.floor_notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  <span className="font-black">Notes:</span> {profile.floor_notes}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Security Notice ── */}
      <motion.div
        variants={itemVariants}
        className="bg-slate-50/50 dark:bg-slate-900/30 border border-border/50 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3.5 z-10 relative"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield size={16} className="text-slate-400 dark:text-slate-500" />
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
          <p className="font-black text-slate-600 dark:text-slate-300 mb-0.5">Account Security</p>
          <p>Your account is secured via phone OTP authentication. All payment data is encrypted and processed through Razorpay's PCI-DSS compliant gateway. For account deletion or phone number changes, please contact our support team.</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
