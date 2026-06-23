'use client'

import { useState, useEffect } from 'react'
import { User, MapPin, Phone, Edit3, Save, X, AlertCircle, CheckCircle, Milk, Calendar, FileText, Shield } from 'lucide-react'
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
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 gap-5">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black text-[#0f172a] font-display tracking-tight mb-1 flex items-center gap-2">
            <User size={24} className="text-[#64748b]" /> My Account
          </h1>
          <p className="text-[13px] font-semibold text-[#64748b]">Manage your profile, delivery details, and subscription info.</p>
        </div>
        {!isEditing && (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-white border border-[#e8edf5] text-[#0f172a] font-extrabold text-[12px] hover:bg-[#f8fafc] shadow-sm transition-all cursor-pointer"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-xl p-3 flex items-center gap-2 text-[12px] font-bold text-[#16a34a] animate-fade-in shadow-sm">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      <div className="bg-white border border-[#e8edf5] rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden">

        <div className="p-6 md:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8f 55%, #1e40af 100%)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-black text-white border border-white/20 backdrop-blur-md shadow-inner">
              {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </div>
            <div>
              <h2 className="text-[22px] font-black font-display text-white">{profile.full_name || 'Customer'}</h2>
              <p className="text-[13px] text-blue-200/80 font-semibold flex items-center gap-1.5 mt-1">
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
          <form onSubmit={handleSave} className="p-6 space-y-5 bg-[#f8fafc]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Full Name *</label>
                <input
                  required
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="h-11 rounded-xl border border-[#e8edf5] bg-white px-4 text-[13px] font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] shadow-sm"
                  placeholder="Your full name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Phone</label>
                <input
                  disabled
                  type="text"
                  value={editForm.phone}
                  className="h-11 rounded-xl border border-[#e8edf5] bg-[#e2e8f0]/40 px-4 text-[13px] font-bold text-[#64748b] outline-none cursor-not-allowed opacity-80"
                />
                <span className="text-[10px] text-[#94a3b8] font-bold">Phone cannot be changed</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Delivery Area *</label>
              <select
                required
                value={editForm.area}
                onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                className="h-11 rounded-xl border border-[#e8edf5] bg-white px-4 text-[13px] font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] appearance-none shadow-sm"
              >
                <option value="">Select area</option>
                {DELIVERY_AREAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Full Address *</label>
              <textarea
                required
                rows={2}
                value={editForm.address}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                className="rounded-xl border border-[#e8edf5] bg-white px-4 py-3 text-[13px] font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] resize-none shadow-sm"
                placeholder="House/flat number, street, building"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Landmark</label>
                <input
                  type="text"
                  value={editForm.landmark}
                  onChange={e => setEditForm({ ...editForm, landmark: e.target.value })}
                  className="h-11 rounded-xl border border-[#e8edf5] bg-white px-4 text-[13px] font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] shadow-sm"
                  placeholder="Near temple, opposite park..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Floor / Gate Notes</label>
                <input
                  type="text"
                  value={editForm.floor_notes}
                  onChange={e => setEditForm({ ...editForm, floor_notes: e.target.value })}
                  className="h-11 rounded-xl border border-[#e8edf5] bg-white px-4 text-[13px] font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] shadow-sm"
                  placeholder="2nd floor, left gate..."
                />
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-[#ef4444] font-bold flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={cancelEditing}
                className="flex-1 h-11 rounded-xl border border-[#e8edf5] bg-white text-[#64748b] font-bold text-[13px] cursor-pointer hover:bg-[#f8fafc] transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-[#2563eb] hover:bg-[#1e40af] active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm border-none cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
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
          <div className="p-6 space-y-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-[16px] p-5">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1.5">Full Name</p>
                <p className="text-[14px] font-black text-[#0f172a]">{profile.full_name || '—'}</p>
              </div>
              <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-[16px] p-5">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1.5">Phone</p>
                <p className="text-[14px] font-black text-[#0f172a]">{profile.phone || '—'}</p>
              </div>
            </div>
            <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-[16px] p-5">
              <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1.5">Delivery Area</p>
              <p className="text-[14px] font-black text-[#0f172a] flex items-center gap-1.5">
                <MapPin size={16} className="text-[#2563eb]" />
                {profile.area || '—'}
              </p>
            </div>
            <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-[16px] p-5">
              <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1.5">Address</p>
              <p className="text-[14px] font-black text-[#0f172a]">{profile.address || '—'}</p>
              {profile.landmark && (
                <p className="text-[12px] text-[#64748b] font-bold mt-2">Landmark: {profile.landmark}</p>
              )}
              {profile.floor_notes && (
                <p className="text-[12px] text-[#64748b] font-bold mt-1">Notes: {profile.floor_notes}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {subscription && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#e8edf5] rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#dcfce7] border border-[#bbf7d0] text-[#16a34a] flex items-center justify-center">
                <Milk size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Daily Plan</p>
                <p className="text-[18px] font-black text-[#0f172a] font-mono leading-none mt-1">{subscription.quantity_litres}L</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-[#64748b]">
              ₹{subscription.daily_rate?.toFixed(2)} / day
            </p>
          </div>

          <div className="bg-white border border-[#e8edf5] rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fef3c7] border border-[#fde68a] text-[#d97706] flex items-center justify-center">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Monthly Bill</p>
                <p className="text-[18px] font-black text-[#0f172a] font-mono leading-none mt-1">₹{subscription.monthly_amount?.toFixed(0)}</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-[#64748b]">
              Net due: ₹{(currentMonth?.net_due || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white border border-[#e8edf5] rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center">
                <Calendar size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Member Since</p>
                <p className="text-[13px] font-black text-[#0f172a] mt-1">{memberSince}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#e8edf5]">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                subscription.status === 'active' ? 'bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]' : 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-[20px] p-5 flex items-start gap-4">
        <Shield size={20} className="text-[#94a3b8] flex-shrink-0" />
        <div className="text-[12px] font-semibold text-[#64748b] leading-relaxed">
          <p>Your account is secured via phone OTP authentication. All payment data is encrypted and processed through Razorpay's PCI-DSS compliant gateway. For account deletion or phone number changes, please contact our support team.</p>
        </div>
      </div>

    </div>
  )
}
