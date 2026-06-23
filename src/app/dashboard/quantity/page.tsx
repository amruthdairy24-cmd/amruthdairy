'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, Milk, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUANTITY_OPTIONS = [
  { litres: 0.5, label: '½ L', description: 'Perfect for 1-2 people' },
  { litres: 1.0, label: '1 L', description: 'Most popular choice' },
  { litres: 1.5, label: '1.5 L', description: 'Great for families' },
  { litres: 2.0, label: '2 L', description: 'Large household plan' },
]

export default function QuantityChangePage() {
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const [currentQty, setCurrentQty] = useState(1.0)
  const [currentDailyRate, setCurrentDailyRate] = useState(0)
  const [currentMonthly, setCurrentMonthly] = useState(0)
  const [selectedQty, setSelectedQty] = useState<number | null>(null)
  const [pendingChange, setPendingChange] = useState<{ quantity: number; amount: number } | null>(null)

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success && json.subscription) {
        setCurrentQty(json.subscription.quantity_litres)
        setCurrentDailyRate(json.subscription.daily_rate)
        setCurrentMonthly(json.subscription.monthly_amount)
        if (json.next_month_change) setPendingChange(json.next_month_change)
      } else {
        setError(json.message || 'Failed to load subscription details')
      }
    } catch (err) {
      setError('Network error loading data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedQty || selectedQty === currentQty) return setError('Please select a different quantity than your current plan.')

    setError(''); setSuccessMsg(''); setLoading(true)

    try {
      const res = await fetch('/api/quantity/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_quantity: selectedQty })
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message || 'Quantity change confirmed!')
        setSelectedQty(null)
        await loadData()
      } else {
        setError(json.message || 'Failed to submit change request')
      }
    } catch (err) {
      setError('Network error submitting request')
    } finally {
      setLoading(false)
    }
  }

  const effectiveDate = new Date()
  effectiveDate.setMonth(effectiveDate.getMonth() + 1)
  effectiveDate.setDate(1)
  const effectiveMonthStr = effectiveDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  if (pageLoading) {
    return (
      <div className="max-w-2xl space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="h-32 bg-slate-200 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-[22px] font-black text-[#0f172a] font-display tracking-tight mb-1 flex items-center gap-2">
          <ArrowLeftRight size={24} className="text-[#2563eb]" /> Change Plan Quantity
        </h1>
        <p className="text-[13px] font-semibold text-[#64748b]">Upgrade or downgrade your daily milk delivery amount.</p>
      </div>

      <div className="rounded-[24px] p-6 bg-white border border-[#e8edf5] relative overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#eff6ff] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-black mb-1">Current Plan</p>
            <p className="text-2xl font-black font-display text-[#0f172a]">
              {currentQty === 0.5 ? '½' : currentQty} Litre / Day
            </p>
            <p className="text-[13px] text-[#64748b] font-semibold mt-1">₹{currentDailyRate.toFixed(2)}/day · ₹{currentMonthly.toFixed(2)}/month</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#f8fafc] border border-[#e8edf5] flex items-center justify-center">
            <Milk size={28} className="text-[#2563eb]" />
          </div>
        </div>
      </div>

      {pendingChange && (
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[16px] p-4 flex items-start gap-3 shadow-sm">
          <Info className="text-[#2563eb] flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-[11px] font-black text-[#1e40af] uppercase tracking-wider">Pending Change</h4>
            <p className="text-[12px] font-semibold text-[#1e3a8f] mt-1 leading-relaxed">
              Your plan will change to <strong>{pendingChange.quantity}L/day</strong> starting {effectiveMonthStr}.
              New monthly amount: <strong>₹{pendingChange.amount?.toFixed(2) || '—'}</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[16px] p-4 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="text-[#d97706] flex-shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-[11px] font-black text-[#b45309] uppercase tracking-wider">Change Policy</h4>
          <p className="text-[12px] font-semibold text-[#92400e] mt-1 leading-relaxed">
            Quantity changes take effect from <strong>1st {effectiveMonthStr}</strong>. Your current month's plan and billing remain unchanged. Changes are subject to capacity availability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        <div className="md:col-span-3 space-y-5">
          <form onSubmit={handleSubmit} className="bg-white border border-[#e8edf5] rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Select New Quantity</label>

              <div className="grid grid-cols-2 gap-3">
                {QUANTITY_OPTIONS.map((opt) => {
                  const isCurrent = opt.litres === currentQty
                  const isSelected = opt.litres === selectedQty
                  return (
                    <button
                      key={opt.litres}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => { setSelectedQty(opt.litres); setError(''); setSuccessMsg('') }}
                      className={cn(
                        'h-24 rounded-xl border flex flex-col items-center justify-center p-3 gap-1 transition-all relative',
                        isSelected
                          ? 'border-[#2563eb] bg-[#eff6ff] ring-1 ring-[#2563eb] text-[#1e3a8f]'
                          : isCurrent
                          ? 'border-[#16a34a] bg-[#dcfce7] text-[#14532d] cursor-not-allowed opacity-80'
                          : 'border-[#e8edf5] bg-white hover:bg-[#f8fafc] text-[#64748b] cursor-pointer'
                      )}
                    >
                      {isCurrent && (
                        <span className="absolute top-2 right-2 text-[8px] font-black text-[#16a34a] bg-white/50 border border-[#bbf7d0] px-1.5 py-0.5 rounded-full">
                          CURRENT
                        </span>
                      )}
                      {opt.litres === 1.0 && !isCurrent && (
                        <span className="absolute top-2 right-2 text-[8px] font-black text-[#2563eb] bg-[#eff6ff] border border-[#bfdbfe] px-1.5 py-0.5 rounded-full">
                          POPULAR
                        </span>
                      )}
                      <span className="text-xl font-black leading-none">{opt.label}</span>
                      <span className="text-[9px] font-bold text-inherit opacity-70">{opt.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedQty && selectedQty !== currentQty && (
              <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-xl p-4 space-y-2.5 text-[13px] font-bold text-[#64748b] animate-fade-in">
                <div className="flex items-center justify-center gap-3 pb-3 border-b border-[#e8edf5]">
                  <div className="text-center">
                    <p className="text-[10px] text-[#94a3b8] font-bold mb-1 uppercase tracking-wider">Current</p>
                    <p className="text-lg font-black text-[#0f172a]">{currentQty === 0.5 ? '½' : currentQty}L</p>
                  </div>
                  <ArrowRight size={20} className="text-[#2563eb]" />
                  <div className="text-center">
                    <p className="text-[10px] text-[#94a3b8] font-bold mb-1 uppercase tracking-wider">New</p>
                    <p className="text-lg font-black text-[#2563eb]">{selectedQty === 0.5 ? '½' : selectedQty}L</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Effective from:</span>
                  <span className="font-extrabold text-[#2563eb]">1st {effectiveMonthStr}</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-[12px] text-[#ef4444] font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} /> {error}
              </p>
            )}

            {successMsg && (
              <p className="text-[12px] text-[#16a34a] font-bold flex items-center gap-1.5">
                <CheckCircle size={14} /> {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedQty || selectedQty === currentQty}
              className="w-full h-11 rounded-xl bg-[#2563eb] hover:bg-[#1e40af] active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowLeftRight size={14} strokeWidth={2.5} />
                  <span>Confirm Quantity Change</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest pl-1">How It Works</h3>
          <div className="bg-white border border-[#e8edf5] rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.05)] p-5 space-y-4 text-[13px] font-semibold text-[#64748b] leading-relaxed">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#f8fafc] border border-[#e8edf5] text-[#2563eb] flex items-center justify-center font-black text-[11px] flex-shrink-0">1</div>
              <p>Select your desired new quantity from the options.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#f8fafc] border border-[#e8edf5] text-[#2563eb] flex items-center justify-center font-black text-[11px] flex-shrink-0">2</div>
              <p>Changes apply from <strong>1st of next month</strong>. Current month billing remains unchanged.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#f8fafc] border border-[#e8edf5] text-[#2563eb] flex items-center justify-center font-black text-[11px] flex-shrink-0">3</div>
              <p>If capacity is full, your increase request may be waitlisted.</p>
            </div>
            <div className="h-[1px] bg-[#e8edf5]" />
            <p className="text-[11px] text-[#94a3b8] font-bold">
              Price is calculated based on admin-set tier pricing. Contact support if you need a custom plan.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
