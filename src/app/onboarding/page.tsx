'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, MapPin, CreditCard, CheckCircle,
  ArrowRight, User, Home, Building2, FileText,
  Phone, ShieldCheck, Clock, Leaf, ChevronDown,
  Package, Tag, Milk, AlertCircle, Sprout
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DELIVERY_AREAS, QUANTITY_OPTIONS, DELIVERY_TIME_PROMISE } from '@/lib/constants'
import { fetchMilkPricesClient, calculateDailyRate, calculateMonthlyAmount, getDaysInMonth } from '@/lib/billing'
import SubscriptionCalendar from '@/components/SubscriptionCalendar'

type OnboardingStep = 1 | 2 | 3 | 'success' | 'waitlist'

const FEATURES = [
  { icon: ShieldCheck, label: 'Pure & Natural', desc: '100% farm fresh A2 milk' },
  { icon: Clock, label: 'On-Time Delivery', desc: `${DELIVERY_TIME_PROMISE} everyday` },
  { icon: Leaf, label: 'No Preservatives', desc: 'No chemicals, no compromise' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('Padil')
  const [landmark, setLandmark] = useState('')
  const [floorNotes, setFloorNotes] = useState('')

  // Step 2
  const [quantity, setQuantity] = useState(1.0)
  const [startDate, setStartDate] = useState('')
  const [minAllowedDate, setMinAllowedDate] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [excludedDates, setExcludedDates] = useState<string[]>([])

  // Admin-managed pricing
  const [milkPrices, setMilkPrices] = useState<Record<string, number>>({})
  const [priceLoading, setPriceLoading] = useState(true)

  // Calculations
  const [proRataDays, setProRataDays] = useState(0)
  const [proRataAmount, setProRataAmount] = useState(0)
  const [monthlyAmount, setMonthlyAmount] = useState(0)
  const [dailyRate, setDailyRate] = useState(0)
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null)

  const handleExcludedDatesChange = useCallback((dates: string[]) => {
    setExcludedDates(dates)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const minDateParam = params.get('min_date')
    const quantityParam = params.get('quantity')
    
    if (quantityParam) {
      setQuantity(Number(quantityParam))
    }

    if (minDateParam) {
      setMinAllowedDate(minDateParam)
      setStartDate(minDateParam)
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      setMinAllowedDate(tomorrowStr)
      setStartDate(tomorrowStr)
    }
  }, [])

  // Fetch admin-managed price on mount
  useEffect(() => {
    async function loadPrice() {
      setPriceLoading(true)
      const prices = await fetchMilkPricesClient()
      setMilkPrices(prices)
      setPriceLoading(false)
    }
    loadPrice()
  }, [])

  useEffect(() => {
    if (!startDate || Object.keys(milkPrices).length === 0) return
    const dRate = calculateDailyRate(quantity, milkPrices)
    const start = new Date(startDate)
    const startYear = start.getFullYear()
    const startMonth = start.getMonth() + 1
    const mAmount = calculateMonthlyAmount(dRate, startYear, startMonth)
    setDailyRate(dRate)
    setMonthlyAmount(mAmount)
    const daysInMonth = getDaysInMonth(startYear, startMonth)
    const remaining = daysInMonth - start.getDate() + 1
    setProRataDays(remaining)
    setProRataAmount(Math.round(remaining * dRate * 100) / 100)
  }, [quantity, startDate, milkPrices, excludedDates])

  useEffect(() => {
    fetch('/api/customer/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          if (data.subscription) {
            window.location.href = '/dashboard'
            return
          }
          if (data.profile) {
            setFullName(data.profile.full_name || '')
            setAddress(data.profile.address || '')
            setArea(data.profile.area || 'Padil')
            setLandmark(data.profile.landmark || '')
            setFloorNotes(data.profile.floor_notes || '')
            
            // If they already have an address saved, we can safely jump to Step 2
            if (data.profile.address && data.profile.address.trim() !== '') {
              setStep(2)
            }
          }
        }
      }).catch(() => {})
  }, [])

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!address.trim()) { setError('Please enter your delivery address.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, address, area, landmark, floor_notes: floorNotes })
      })
      const data = await res.json()
      if (data.success) setStep(2)
      else setError(data.message || 'Failed to save profile.')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (new Date(startDate) < new Date(minAllowedDate)) { setError(`Start date must be ${new Date(minAllowedDate).toLocaleDateString('en-IN')} or later.`); return }
    setError(''); setStep(3)
  }

  async function handlePayment() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/subscription/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, start_date: startDate, excluded_dates: excludedDates })
      })
      const data = await res.json()
      if (data.success) {
        setStep('success')
        setTimeout(() => { window.location.href = '/dashboard' }, 2000)
      } else if (data.waitlisted) {
        setWaitlistPosition(data.position)
        setStep('waitlist')
        setTimeout(() => { window.location.href = '/dashboard' }, 4000)
      } else {
        setError(data.message || 'Failed to create subscription.')
      }
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">

      {/* ── TOP BRAND BAR ──────────────────────── */}
      <div className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/85 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center">
            <Sprout size={16} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Amruth Milk</p>
            <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 tracking-wider uppercase mt-1">SUBSCRIPTION PORTAL</p>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 md:gap-8">

        {/* LEFT PANEL */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#0f2e5c] via-blue-950 to-blue-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg min-h-[450px]">
          <div className="relative z-10">
            <p className="text-xs font-bold text-blue-200/80 uppercase tracking-widest mb-2">Let's get started!</p>
            <div className="w-12 h-1 bg-blue-400 rounded-full mb-6" />
            <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-tight mb-4">
              Fresh milk,<br />
              delivered<br />
              just for you.
            </h2>
            <p className="text-sm text-blue-100/70 leading-relaxed max-w-sm mb-6">
              Tell us a few details so we can deliver pure, farm-fresh milk to your doorstep.
            </p>
          </div>

          {/* Bottle visual */}
          <div className="relative w-40 h-56 mx-auto my-8 flex items-end justify-center z-10">
            {/* Splash decorative */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
            {/* Bottle */}
            <div className="relative w-16 bg-white/15 border-2 border-white/25 rounded-2xl flex flex-col items-center p-1 shadow-inner backdrop-blur-sm animate-float">
              <div className="w-10 h-3 bg-teal-500 rounded-t-md border-b border-black/10" />
              <div className="w-6 h-6 bg-white/20 border-x-2 border-white/25" />
              <div className="w-full flex-1 bg-gradient-to-b from-white/90 to-white/95 rounded-b-xl relative overflow-hidden flex flex-col items-center justify-center p-2 min-h-[100px]">
                <div className="absolute top-0 left-1 w-0.5 h-full bg-white/40 blur-[0.5px]" />
                <div className="bg-white/90 border border-teal-100 rounded-lg p-1.5 flex flex-col items-center justify-center gap-0.5 shadow-sm w-10 h-10">
                  <Sprout size={12} className="text-teal-600" />
                  <span className="text-[7px] font-black text-teal-800 text-center leading-none uppercase">Amruth</span>
                </div>
              </div>
            </div>
            {/* Glass */}
            <div className="relative w-10 h-14 bg-white/20 border-2 border-white/25 rounded-b-xl rounded-t-sm shadow-inner backdrop-blur-sm -ml-4 -mb-2">
              <div className="absolute bottom-0 inset-x-0 bg-white/95 h-3/4 rounded-b-lg" />
            </div>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10 relative z-10">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">{label}</p>
                  <p className="text-[11px] text-blue-200/70 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Stepper */}
          {step !== 'success' && step !== 'waitlist' && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative transition-all duration-300 overflow-hidden">
              {[
                { num: 1, label: 'Details', sub: 'Delivery address' },
                { num: 2, label: 'Plan', sub: 'Choose quantity' },
                { num: 3, label: 'Review', sub: 'Confirm & pay' },
              ].map(({ num, label, sub }, i) => {
                const done = (step as number) > num
                const active = step === num
                return (
                  <div key={num} className="flex-1 flex items-center gap-3 relative z-10 px-2">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-200', 
                      done 
                        ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                        : active 
                          ? 'bg-blue-600 dark:bg-blue-500 text-white border-4 border-blue-100 dark:border-blue-900/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                    )}>
                      {num}
                    </div>
                    <div className="hidden sm:block text-left min-w-0">
                      <p className={cn('text-xs font-black text-slate-450 dark:text-slate-500 leading-none', active ? 'text-slate-900 dark:text-white' : '')}>{label}</p>
                      <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>
                    </div>
                  </div>
                )
              })}
              {/* Active indicator bar */}
              <div
                className="absolute bottom-0 h-1 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ left: `${((step as number) - 1) * 33.33}%`, width: '33.33%' }}
              />
            </div>
          )}

          {/* Form area */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">

              {/* STEP 1 */}
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">Onboarding Details</h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Please provide your morning milk delivery address details.</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <User size={12} /> Full Name
                      </label>
                      <div className="relative flex items-center">
                        <User size={14} className="absolute left-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Ravi Nayak"
                          value={fullName}
                          onChange={e => { setFullName(e.target.value); setError('') }}
                          className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Area + Landmark */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <MapPin size={12} /> Delivery Locality / Area
                        </label>
                        <div className="relative flex items-center">
                          <MapPin size={14} className="absolute left-4 text-slate-400 dark:text-slate-555 pointer-events-none z-10" />
                          <select
                            value={area}
                            onChange={e => setArea(e.target.value)}
                            className="w-full h-11 pl-11 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                          >
                            {DELIVERY_AREAS.map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 text-slate-450 dark:text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Building2 size={12} /> Landmark (Optional)
                        </label>
                        <div className="relative flex items-center">
                          <Building2 size={14} className="absolute left-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Opposite Central Park"
                            value={landmark}
                            onChange={e => setLandmark(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Home size={12} /> Delivery Street Address
                      </label>
                      <div className="relative flex items-start">
                        <Home size={14} className="absolute left-4 top-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
                        <textarea
                          placeholder="House No 12-B, Rose Villa, 2nd Cross road..."
                          value={address}
                          onChange={e => { setAddress(e.target.value); setError('') }}
                          rows={2}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Floor notes */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <FileText size={12} /> Floor / Delivery Instructions (Optional)
                      </label>
                      <div className="relative flex items-center">
                        <FileText size={14} className="absolute left-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="2nd Floor, leave bag on door handle"
                          value={floorNotes}
                          onChange={e => setFloorNotes(e.target.value)}
                          className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {error && <p className="p-3 bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

                    <button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading
                        ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><span>Continue to Plan Selection</span><ArrowRight size={16} /></>
                      }
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">Choose Your Plan</h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Select your daily quantity and subscription start date.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePlanSubmit} className="space-y-4">
                    {/* Quantity selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Daily Milk Quantity</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {QUANTITY_OPTIONS.map(({ litres, label }) => {
                          const qtyMonthly = Object.keys(milkPrices).length > 0
                            ? calculateMonthlyAmount(calculateDailyRate(litres, milkPrices), startDate ? new Date(startDate).getFullYear() : new Date().getFullYear(), startDate ? new Date(startDate).getMonth() + 1 : new Date().getMonth() + 1)
                            : 0
                          const isActive = quantity === litres
                          return (
                            <button
                              key={litres}
                              type="button"
                              onClick={() => setQuantity(litres)}
                              className={cn(
                                'relative flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-900',
                                isActive 
                                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30' 
                                  : 'border-slate-200 dark:border-slate-800'
                              )}
                            >
                              {isActive && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">✓</div>
                              )}
                              <span className="text-base font-black text-slate-900 dark:text-white font-mono">{label}</span>
                              <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 mt-1">{priceLoading ? '...' : `₹${Math.round(qtyMonthly)}/mo`}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Start date + daily rate */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start Date</label>
                        <div className="relative flex items-center">
                          <Calendar size={14} className="absolute left-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
                          <input
                            type="date"
                            value={startDate}
                            min={minAllowedDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Daily Rate</label>
                        <div className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 px-4 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Rate per day</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white font-mono">₹{dailyRate.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery notes */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Delivery Notes (Optional)</label>
                      <div className="relative flex items-center">
                        <FileText size={14} className="absolute left-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Keep milk inside bag on door handle"
                          value={deliveryNotes}
                          onChange={e => setDeliveryNotes(e.target.value)}
                          className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Day Picker Calendar */}
                    {startDate && (
                      <SubscriptionCalendar
                        startDate={startDate}
                        onExcludedDatesChange={handleExcludedDatesChange}
                        initialExcludedDates={excludedDates}
                        maxMonthsAhead={1}
                      />
                    )}

                    {/* Monthly preview card */}
                    <div className="bg-slate-50/80 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>Monthly Amount</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">₹{monthlyAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>First payment (pro-rata)</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 font-mono">
                          ₹{proRataAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {error && <p className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setStep(1)} className="px-5 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm">
                        Back
                      </button>
                      <button type="submit" className="flex-1 h-12 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all border-none flex items-center justify-center gap-2 disabled:opacity-50">
                        Review Plan Details <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0">
                      <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">Confirm Subscription</h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Review your plan and complete payment.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Summary */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { label: 'Plan Quantity', icon: <Package size={13} />, value: `${quantity} Litre${quantity > 1 ? 's' : ''} / Day` },
                        { label: 'Starting Date', icon: <Calendar size={13} />, value: new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                        { label: 'Monthly Rate', icon: <Tag size={13} />, value: `₹${monthlyAmount.toFixed(2)}` },
                        { label: 'Delivery Area', icon: <MapPin size={13} />, value: area },
                        { label: 'Address', icon: <Home size={13} />, value: address },
                      ].map(({ label, icon, value }) => (
                        <div key={label} className="flex justify-between items-center p-3.5 text-xs font-bold bg-white dark:bg-slate-900">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            {icon}
                            {label}
                          </span>
                          <span className="text-slate-900 dark:text-white text-right max-w-xs truncate">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pro-rata invoice */}
                    <div className="bg-slate-50/85 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white mb-2 pb-2 border-b border-slate-205/50 dark:border-slate-800/50">Pro-Rata Invoice (First Month)</p>
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span>Days remaining in {new Date(startDate).toLocaleString('en-IN', { month: 'long' })}</span>
                        <span>{proRataDays} days</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span>{proRataDays} days × ₹{dailyRate.toFixed(2)}/day</span>
                        <span>₹{proRataAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <span>Total Due Today</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{proRataAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {error && <p className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="px-5 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm">
                        Back
                      </button>
                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 h-12 bg-emerald-650 dark:bg-emerald-600 hover:bg-emerald-750 dark:hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all border-none flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading
                          ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <><CreditCard size={15} /><span>Pay ₹{proRataAmount.toFixed(2)} securely</span></>
                        }
                      </button>
                    </div>

                    <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1.5 justify-center mt-3">
                      <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-450" />
                      Your payment is secured and processed instantly.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                    className="relative w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full flex items-center justify-center mb-5 shadow-sm"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-450/20 dark:bg-emerald-400/10 animate-ping" />
                    <CheckCircle size={36} className="text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 font-display">Subscription Confirmed!</h2>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-sm">
                    Payment of <strong>₹{proRataAmount.toFixed(2)}</strong> confirmed.
                    <br />Your milk delivery starts soon! <Milk size={14} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  </p>
                  <div className="w-full max-w-xs h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.8 }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Redirecting to your dashboard...</p>
                </motion.div>
              )}

              {/* WAITLIST SUCCESS */}
              {step === 'waitlist' && (
                <motion.div
                  key="waitlist"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                    className="relative w-16 h-16 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-full flex items-center justify-center mb-5 shadow-sm"
                  >
                    <Clock size={36} className="text-amber-600 dark:text-amber-400" />
                  </motion.div>
                  <h2 className="text-xl font-black text-amber-600 dark:text-amber-450 leading-tight mb-2 font-display">Added to Waitlist!</h2>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-sm">
                    Daily capacity is currently full. You have been placed on the waitlist at <strong>Position #{waitlistPosition}</strong>.
                    <br />We will notify you as soon as delivery slots open! <Milk size={14} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  </p>
                  <div className="w-full max-w-xs h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3.8 }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Redirecting to your dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Assistance bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0">
                <Phone size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">Need assistance?</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-450 mt-1">Our support team is here to help you.</p>
              </div>
            </div>
            <a href="tel:+919876543210" className="inline-flex items-center gap-1.5 px-4 h-9 bg-slate-50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-[11px] font-extrabold text-blue-600 dark:text-blue-400 transition-all">
              <Phone size={13} />
              +91 98765 43210
            </a>
          </div>

        </div>
      </div>

      {/* Bottom trust note */}
      <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1.5 justify-center py-6 border-t border-slate-200/50 dark:border-slate-900 mt-8">
        <ShieldCheck size={13} className="text-slate-400 dark:text-slate-550" />
        Your information is safe with us and will never be shared.
      </div>
    </div>
  )
}