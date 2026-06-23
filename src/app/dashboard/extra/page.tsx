'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Calendar, ShieldAlert, CheckCircle, Info } from 'lucide-react'

export default function ExtraMilkPage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [dailyRate, setDailyRate] = useState(82.6667)
  const [baseQty, setBaseQty] = useState(1.0)
  
  const [orderDate, setOrderDate] = useState('')
  const [extraLitres, setExtraLitres] = useState<number>(0.5)
  const [estimatedCharge, setEstimatedCharge] = useState(0)

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success && json.subscription) {
        setDailyRate(json.subscription.daily_rate)
        setBaseQty(json.subscription.quantity_litres || 1.0)
      } else {
        setError(json.message || 'Failed to retrieve subscription details')
      }
    } catch (err) {
      setError('Network error loading page data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setOrderDate(tomorrow.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (baseQty <= 0) return
    const charge = Math.round((dailyRate * (extraLitres / baseQty)) * 100) / 100
    setEstimatedCharge(charge)
  }, [extraLitres, dailyRate, baseQty])

  async function handleExtraSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderDate || extraLitres === undefined) return setError('Please choose a date and quantity.')

    const selected = new Date(orderDate)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0,0,0,0)

    if (selected < tomorrow) return setError('Order date must be tomorrow or later.')

    setError(''); setSuccessMsg(''); setLoading(true)

    try {
      const res = await fetch('/api/extra-milk/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_date: orderDate, extra_litres: extraLitres })
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message || `Confirmed extra ${extraLitres}L for ${orderDate}!`)
      } else {
        setError(json.message || 'Failed to request extra milk')
      }
    } catch (err) {
      setError('Network error submitting request')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-xl space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-44 bg-slate-200 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      
      <div>
        <h1 className="text-[22px] font-black text-[#0f172a] font-display tracking-tight mb-1 flex items-center gap-2">
          <PlusCircle size={24} className="text-[#16a34a]" /> Order Extra Milk
        </h1>
        <p className="text-[13px] font-semibold text-[#64748b]">Need more milk tomorrow? Add a one-time extra order to your delivery.</p>
      </div>

      <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[16px] p-4 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="text-[#d97706] flex-shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-[11px] font-black text-[#b45309] uppercase tracking-wider">9:00 PM Deadline</h4>
          <p className="text-[12px] font-semibold text-[#92400e] mt-1 leading-relaxed">
            Extra orders must be placed before 9:00 PM on the previous night. Booking is subject to daily farm capacity.
          </p>
        </div>
      </div>

      <form onSubmit={handleExtraSubmit} className="bg-white border border-[#e8edf5] rounded-[20px] p-5 sm:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-6">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Select Delivery Date</label>
          <div className="flex items-center h-11 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 gap-2 focus-within:ring-2 focus-within:ring-[#2563eb]/20 focus-within:border-[#2563eb]">
            <Calendar size={15} className="text-[#94a3b8]" />
            <input
              type="date"
              required
              value={orderDate}
              min={(() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                return tomorrow.toISOString().split('T')[0]
              })()}
              onChange={(e) => { setOrderDate(e.target.value); setError(''); setSuccessMsg('') }}
              className="flex-1 h-full bg-transparent text-[13px] font-bold text-[#0f172a] outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Choose Extra Litres</label>
          <div className="grid grid-cols-3 gap-3">
            {[0.5, 1.0, 1.5].map((litres) => (
              <button
                key={litres}
                type="button"
                onClick={() => { setExtraLitres(litres); setError(''); setSuccessMsg('') }}
                className={`h-20 rounded-xl border flex flex-col items-center justify-center p-3 gap-1.5 transition-all ${
                  extraLitres === litres
                    ? 'border-[#2563eb] bg-[#eff6ff] ring-1 ring-[#2563eb] text-[#1e3a8f]'
                    : 'border-[#e8edf5] bg-white hover:bg-[#f8fafc] text-[#64748b]'
                }`}
              >
                <span className="text-[18px] font-black leading-none">+{litres}L</span>
                <span className="text-[10px] font-bold text-[#94a3b8]">Extra Milk</span>
              </button>
            ))}
          </div>
        </div>

        {extraLitres > 0 && (
          <div className="bg-[#f8fafc] border border-[#e8edf5] rounded-xl p-5 space-y-3.5 text-[13px] font-bold text-[#64748b]">
            <div className="flex justify-between items-center pb-3 border-b border-[#e8edf5]">
              <span>Your regular delivery:</span>
              <span className="font-extrabold text-[#0f172a]">{baseQty} Litres</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#e8edf5]">
              <span>Tomorrow&apos;s total:</span>
              <span className="font-extrabold text-[#2563eb]">{(baseQty + extraLitres)} Litres</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><Info size={14} className="text-[#94a3b8]" /> Extra Charge:</span>
              <span className="font-extrabold text-[#ef4444] font-mono text-sm">₹{estimatedCharge.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-[#ef4444] font-bold flex items-center gap-1.5">
            <ShieldAlert size={14} /> {error}
          </p>
        )}

        {successMsg && (
          <p className="text-[12px] text-[#16a34a] font-bold flex items-center gap-1.5">
            <CheckCircle size={14} /> {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !orderDate}
          className="w-full h-11 rounded-xl bg-[#2563eb] hover:bg-[#1e40af] active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <PlusCircle size={14} strokeWidth={2.5} />
              <span>Confirm Extra Order</span>
            </>
          )}
        </button>

      </form>
    </div>
  )
}
