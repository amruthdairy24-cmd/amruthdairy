'use client'

import { useState, useEffect } from 'react'
import { User, MapPin, Phone, Edit3, Save, AlertCircle, CheckCircle, Milk, FileText, Calendar, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DELIVERY_AREAS } from '@/lib/constants'

interface ProfileData {
  full_name: string
  phone: string
  address: string
  area: string
  landmark: string
  floor_notes: string
}

export default function AccountPage() {
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

  async function loadData() {
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
        setProfile(pData); setEditForm(pData);
      }

      const dashRes = await fetch('/api/customer/dashboard')
      const dashJson = await dashRes.json()
      if (dashJson.success) {
        setSubscription(dashJson.subscription || null)
        setCurrentMonth(dashJson.current_month || null)
      }
    } catch (err) {
      setError('Failed to load account details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

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

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 gap-5">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 dark:text-white font-display tracking-tight mb-1 flex items-center gap-2">
            <User size={24} className="text-slate-400 dark:text-slate-500" /> My Account
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Manage your profile, delivery details, and subscription info.</p>
        </div>
        {!isEditing && (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-extrabold text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in shadow-sm">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden">

        <div className="p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-black text-white border border-white/20 backdrop-blur-md shadow-inner">
              {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </div>
            <div>
              <h2 className="text-[22px] font-black font-display text-white">{profile.full_name || 'Customer'}</h2>
              <p className="text-xs text-blue-200/80 font-semibold flex items-center gap-1.5 mt-1">
                <Phone size={13} />
                {profile.phone || 'No phone'}
              </p>
              {subscription && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-100 border border-white/10 backdrop-blur-md">
                  <Milk size={10} />
                  <span>{subscription.quantity_litres}L Daily · Since {memberSince}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name *</label>
                <input
                  required
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Your full name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone</label>
                <input
                  disabled
                  type="text"
                  value={editForm.phone}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 px-4 text-sm font-bold text-slate-400 dark:text-slate-500 outline-none cursor-not-allowed opacity-85"
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
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm appearance-none cursor-pointer"
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
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-sm"
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
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  placeholder="Near temple, opposite park..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Floor / Gate Notes</label>
                <input
                  type="text"
                  value={editForm.floor_notes}
                  onChange={e => setEditForm({ ...editForm, floor_notes: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  placeholder="2nd floor, left gate..."
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={cancelEditing}
                className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm border-none cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
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
          <div className="p-6 md:p-8 space-y-4 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Full Name</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{profile.full_name || '—'}</p>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Phone</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{profile.phone || '—'}</p>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Delivery Area</p>
              <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={16} className="text-blue-600 dark:text-blue-500" />
                {profile.area || '—'}
              </p>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Address</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{profile.address || '—'}</p>
              {profile.landmark && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-2">Landmark: {profile.landmark}</p>
              )}
              {profile.floor_notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">Notes: {profile.floor_notes}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {subscription && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-55 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450 flex items-center justify-center">
                <Milk size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daily Plan</p>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none mt-1">{subscription.quantity_litres}L</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              ₹{subscription.daily_rate?.toFixed(2)} / day
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-55 dark:bg-amber-950/30 border border-amber-200/45 dark:border-amber-900/30 text-amber-600 dark:text-amber-450 flex items-center justify-center">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Bill</p>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none mt-1">₹{subscription.monthly_amount?.toFixed(0)}</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Net due: ₹{(currentMonth?.net_due || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-250/45 dark:border-blue-900/30 text-blue-650 dark:text-blue-450 flex items-center justify-center">
                <Calendar size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Member Since</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white mt-1">{memberSince}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                subscription.status === 'active' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' 
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[20px] p-5 flex items-start gap-4">
        <Shield size={20} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
          <p>Your account is secured via phone OTP authentication. All payment data is encrypted and processed through Razorpay's PCI-DSS compliant gateway. For account deletion or phone number changes, please contact our support team.</p>
        </div>
      </div>

    </div>
  )
}
