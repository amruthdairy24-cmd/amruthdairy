// app/subscribe/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Calendar, MapPin, CreditCard,
  ChevronRight, ChevronLeft, ArrowRight,
  User, Phone, FileText, Milk, Clock,
  Tag, Truck, Leaf, ShieldCheck, Package,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DELIVERY_AREAS, DELIVERY_TIME_PROMISE } from '@/lib/constants'
import { fetchMilkPricesClient, calculateDailyRate, calculateMonthlyAmountWithExclusions, getDaysInMonth } from '@/lib/billing'
import SubscriptionCalendar from '@/components/SubscriptionCalendar'

type StepNum = 1 | 2 | 3

export default function SubscribePage() {
  const [step, setStep] = useState<StepNum>(1)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [fullname, setFullname] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('Padil')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [orderId] = useState(`AMR-${Math.floor(10000 + Math.random() * 90000)}`)

  // Admin-managed pricing
  const [milkPrices, setMilkPrices] = useState<Record<string, number>>({})
  const [priceLoading, setPriceLoading] = useState(true)

  // Day-picker state
  const [excludedDates, setExcludedDates] = useState<string[]>([])

  // Session & Auth state variables
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate pricing dynamically based on admin price + selected days
  const dailyRate = calculateDailyRate(1.0, milkPrices) // 1L subscription
  const startDateObj = new Date(startDate)
  const startYear = startDateObj.getFullYear()
  const startMonth = startDateObj.getMonth() + 1
  const daysInMonth = getDaysInMonth(startYear, startMonth)
  const excludedSet = new Set(excludedDates)
  const monthlyPrice = Object.keys(milkPrices).length > 0 ? calculateMonthlyAmountWithExclusions(dailyRate, startYear, startMonth, excludedSet) : 0
  const deliveryDays = daysInMonth - excludedDates.filter(d => d.startsWith(`${startYear}-${String(startMonth).padStart(2, '0')}`)).length

  const handleExcludedDatesChange = useCallback((dates: string[]) => {
    setExcludedDates(dates)
  }, [])

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/customer/dashboard')
        const data = await res.json()
        if (data.success) {
          setIsLoggedIn(true)
          if (data.profile) {
            setFullname(data.profile.full_name || '')
            const cleanPhone = (data.profile.phone || '').replace(/\D/g, '')
            setPhone(cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone)
            setAddress(data.profile.address || '')
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    checkUser()
  }, [])

  // Fetch admin-managed price
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
    if (resendCountdown > 0) {
      intervalRef.current = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [resendCountdown])

  useEffect(() => {
    if (showOtp) {
      setTimeout(() => {
        (document.getElementById('sub-otp-0') as HTMLInputElement)?.focus()
      }, 100)
    }
  }, [showOtp])

  async function sendOtpCode() {
    setFormError('')
    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (data.success) {
        setShowOtp(true)
        setResendCountdown(30)
      } else {
        setFormError(data.message || 'Failed to send OTP')
      }
    } catch {
      setFormError('Network error sending OTP.')
    } finally {
      setOtpLoading(false)
    }
  }

  async function verifyOtpCode(code: string) {
    if (code.length !== 6) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: code })
      })
      const data = await res.json()
      if (data.success) {
        const profileRes = await fetch('/api/customer/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullname,
            address: address,
            area: area,
          })
        })
        const profileData = await profileRes.json()
        if (profileData.success) {
          setIsLoggedIn(true)
          setShowOtp(false)
          setStep(2)
        } else {
          setOtpError(profileData.message || 'Failed to initialize profile details.')
        }
      } else {
        setOtpError(data.message || 'Verification failed. Try again.')
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => { (document.getElementById('sub-otp-0') as HTMLInputElement)?.focus() }, 50)
      }
    } catch {
      setOtpError('Network error verifying OTP.')
    } finally {
      setOtpLoading(false)
    }
  }

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      const next = document.getElementById(`sub-otp-${index + 1}`) as HTMLInputElement
      next?.focus()
    }
    if (newOtp.every(d => d !== '') && value) {
      verifyOtpCode(newOtp.join(''))
    }
  }

  function handleOtpKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`sub-otp-${index - 1}`) as HTMLInputElement
      prev?.focus()
    }
  }

  async function handleNextFromStep1() {
    if (!fullname.trim()) { setFormError('Please enter your full name'); return }
    if (phone.length !== 10) { setFormError('Please enter a valid 10-digit mobile number'); return }
    if (!address.trim()) { setFormError('Please enter your delivery address'); return }
    setFormError('')
    
    if (isLoggedIn) {
      setStep(2)
    } else {
      await sendOtpCode()
    }
  }

  async function handlePayment() {
    setIsPaying(true)
    setFormError('')
    try {
      const res = await fetch('/api/subscription/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: 1.0,
          start_date: startDate,
          excluded_dates: excludedDates
        })
      })
      if (res.status === 401) {
        setFormError('You must be logged in to subscribe.')
        setIsPaying(false)
        return
      }
      const data = await res.json()
      if (data.success) { setPaymentSuccess(true) }
      else { setFormError(data.message || 'Failed to create subscription') }
    } catch { setFormError('Network error. Please try again.') }
    finally { setIsPaying(false) }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .split('/').join('-')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream-50 dark:bg-warm-white text-slate-800 dark:text-slate-100 pb-20 transition-colors duration-300">

        {/* ── HERO HEADER SECTION ─────────────────── */}
        <div className="relative overflow-hidden bg-brand-primary text-white p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 milk-drop-pattern rounded-b-[40px] shadow-lg mb-12">
          
          {/* Left hero text */}
          <div className="flex-1 max-w-2xl flex flex-col gap-6 z-10">
            <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-extrabold tracking-wider uppercase text-cream-50 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-ping" />
              100% PURE • FARM FRESH
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight">
              Start Your Milk Subscription
            </h1>
            <p className="text-slate-300 font-medium text-sm sm:text-base leading-relaxed">
              Pure, farm-fresh milk delivered to your doorstep daily.<br />
              Standard 1 Litre/Day subscription.
            </p>

            {/* Stepper */}
            <div className="flex items-center gap-4 mt-4 overflow-x-auto py-2 no-scrollbar">
              {[
                { num: 1, label: 'DETAILS' },
                { num: 2, label: 'REVIEW' },
                { num: 3, label: 'PAY' },
              ].map(({ num, label }, i) => {
                const done = step > num
                const active = step === num
                return (
                  <div key={num} className="flex items-center gap-2 flex-shrink-0">
                    {i > 0 && (
                      <div className={cn('w-8 sm:w-12 h-0.5 bg-white/20 rounded', step > num ? 'bg-brand-secondary' : '')} />
                    )}
                    <button
                      onClick={() => num < step && setStep(num as StepNum)}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer',
                        done ? 'bg-brand-secondary text-white shadow-[0_0_12px_rgba(2,132,199,0.4)]' : active ? 'bg-white text-brand-primary font-black shadow-lg scale-110 ring-4 ring-white/10' : 'bg-white/10 text-white border border-white/15'
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : num}
                    </button>
                    <span className={cn('text-[10px] font-extrabold tracking-wider text-slate-300 select-none uppercase', active ? 'text-white font-black' : '')}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right hero - bottle + splash */}
          <div className="hidden lg:flex items-center justify-center relative w-72 h-80 opacity-90 pointer-events-none z-10" aria-hidden>
            {/* Milk splash bg */}
            <div className="absolute w-72 h-72 rounded-full bg-brand-secondary/20 blur-[60px] animate-pulse" />
            
            {/* Tailwind Vector Bottle */}
            <div className="w-32 h-64 border border-white/20 rounded-[28px] bg-white/5 backdrop-blur-md p-3 flex flex-col items-center justify-center relative shadow-2xl z-20">
              <div className="w-10 h-6 border border-white/20 rounded-t-xl bg-white/10 absolute -top-6" />
              <div className="w-1 h-full bg-white/10 absolute left-1/2 -translate-x-1/2 top-0" />
              <div className="text-center flex flex-col items-center justify-center">
                <div className="text-3xl mb-2">🐄</div>
                <div className="text-xs font-black tracking-widest text-white leading-none">AMRUTH</div>
                <div className="text-[6px] font-bold text-slate-300 tracking-wider mt-1">PURE A2 MILK</div>
                <div className="w-8 h-0.5 bg-brand-secondary my-2" />
                <div className="text-[5px] text-slate-300 font-medium">100% Pure & Natural<br />Farm Fresh</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {!paymentSuccess ? (
              <motion.div
                key="wizard"
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >

                {/* LEFT: Form Card */}
                <div className="lg:col-span-8 p-6 sm:p-8 rounded-brand-2xl border border-border/40 dark:border-slate-800/80 bg-white dark:bg-cream-100 shadow-[0_4px_24px_var(--shadow)] flex flex-col gap-6">
                  <AnimatePresence mode="wait">

                    {/* STEP 1 */}
                    {step === 1 && (
                      showOtp ? (
                        <motion.div
                          key="otp-verification"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          transition={{ duration: 0.25 }}
                        >
                          {/* Card header */}
                          <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-200/50 dark:border-amber-900/30 text-amber-500 flex-shrink-0">
                              <Smartphone size={20} />
                            </div>
                            <div>
                              <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">Verify Your Mobile</h2>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                We sent a 6-digit OTP code to <strong className="text-slate-900 dark:text-white">+91 {phone}</strong>
                              </p>
                            </div>
                          </div>

                          {/* OTP Boxes */}
                          <div className="grid grid-cols-6 gap-2 sm:gap-3 py-1 my-6 max-w-[380px] mx-auto">
                            {otp.map((digit, i) => (
                              <input
                                key={i}
                                id={`sub-otp-${i}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleOtpChange(e.target.value, i)}
                                onKeyDown={e => handleOtpKeyDown(e, i)}
                                className={cn(
                                  'w-full aspect-square text-center text-lg font-bold text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all',
                                  otpError ? 'border-red-500 ring-2 ring-red-500/10' : digit ? 'border-brand-secondary ring-2 ring-brand-secondary/10 bg-white dark:bg-slate-900' : ''
                                )}
                              />
                            ))}
                          </div>

                          {otpError && (
                            <p className="text-xs font-bold text-red-500 flex items-center justify-center gap-1.5 mt-2 mb-4">⚠️ {otpError}</p>
                          )}

                          <div className="text-center text-xs py-1 mb-6">
                            {resendCountdown > 0 ? (
                              <span className="text-slate-400 dark:text-slate-500 font-semibold">
                                Resend code in <strong className="text-slate-700 dark:text-slate-300">{resendCountdown}s</strong>
                              </span>
                            ) : (
                              <button onClick={sendOtpCode} className="font-bold text-brand-secondary hover:underline cursor-pointer bg-transparent border-none">
                                Resend OTP Code
                              </button>
                            )}
                          </div>

                          {/* CTA Row */}
                          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 mt-4 flex items-center justify-between gap-4">
                            <button
                              onClick={() => {
                                setShowOtp(false)
                                setOtp(['', '', '', '', '', ''])
                                setOtpError('')
                              }}
                              className="px-5 h-12 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer flex-1"
                            >
                              <ChevronLeft size={14} /> Back
                            </button>
                            <button
                              onClick={() => verifyOtpCode(otp.join(''))}
                              disabled={otpLoading || otp.some(d => d === '')}
                              className="px-6 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:translate-y-0 flex-[2]"
                            >
                              {otpLoading ? (
                                <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Verifying...</>
                              ) : (
                                <>Verify & Continue <ChevronRight size={14} /></>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="s1"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-col gap-6"
                        >
                          {/* Card header */}
                          <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-200/50 dark:border-blue-900/30 text-brand-secondary flex-shrink-0">
                              <MapPin size={20} />
                            </div>
                            <div>
                              <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">Delivery Details</h2>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Where should we deliver your fresh milk?</p>
                            </div>
                          </div>

                          {/* Fields grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 py-2">
                            {/* Full Name */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                                <User size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> Full Name
                              </label>
                              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-12 relative">
                                <User size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 flex-shrink-0 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Ravi Nayak"
                                  value={fullname}
                                  onChange={e => { setFullname(e.target.value); setFormError('') }}
                                  className="w-full pl-11 pr-4 h-full text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400"
                                />
                              </div>
                            </div>

                            {/* Mobile */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> Mobile Number (10-Digit)
                              </label>
                              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-12">
                                <span className="flex items-center gap-1 px-4 h-full border-r border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900 select-none">
                                  <Phone size={12} /> +91
                                </span>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={10}
                                  placeholder="98765 43210"
                                  value={phone}
                                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFormError('') }}
                                  className="w-full px-4 h-full text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 disabled:opacity-60"
                                  disabled={isLoggedIn}
                                />
                              </div>
                            </div>

                            {/* Full Delivery Address */}
                            <div className="flex flex-col gap-2 sm:col-span-2">
                              <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> Full Delivery Address
                              </label>
                              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-24 relative">
                                <MapPin size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 flex-shrink-0 pointer-events-none top-4" />
                                <textarea
                                  placeholder="Flat/House No, Building, Street, Landmark"
                                  value={address}
                                  onChange={e => { setAddress(e.target.value); setFormError('') }}
                                  rows={2}
                                  className="w-full pl-11 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 min-h-[72px] resize-none"
                                />
                              </div>
                            </div>

                            {/* Start Date */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> Subscription Start Date
                              </label>
                              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-12 relative">
                                <Calendar size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 flex-shrink-0 pointer-events-none" />
                                <input
                                  type="date"
                                  value={startDate}
                                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                  onChange={e => setStartDate(e.target.value)}
                                  className="w-full pl-11 pr-4 h-full text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400"
                                />
                              </div>
                            </div>

                            {/* Area */}
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> Select Area / Locality
                              </label>
                              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-12 relative">
                                <MapPin size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 flex-shrink-0 pointer-events-none" />
                                <select
                                  value={area}
                                  onChange={e => setArea(e.target.value)}
                                  className="w-full pl-11 pr-10 h-full text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 cursor-pointer appearance-none"
                                >
                                  {DELIVERY_AREAS.map((a: string) => (
                                    <option key={a} value={a} className="dark:bg-slate-900">{a} (Mangalore)</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="flex flex-col gap-2 sm:col-span-2">
                              <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                                <FileText size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> Delivery Notes (Optional)
                              </label>
                              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-12 relative">
                                <FileText size={14} className="absolute left-4 text-slate-400 dark:text-slate-500 flex-shrink-0 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Ring bell or leave bag at the door"
                                  value={notes}
                                  onChange={e => setNotes(e.target.value)}
                                  className="w-full pl-11 pr-4 h-full text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Error */}
                          {formError && (
                            <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 mt-2">⚠️ {formError}</p>
                          )}

                          {/* Delivery banner */}
                          <div className="sm:col-span-2 mb-2 p-5 rounded-brand-md border border-blue-200/50 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/25 flex gap-4 text-slate-700 dark:text-slate-300 text-xs font-semibold relative overflow-hidden shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brand-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Quick & Reliable Delivery</p>
                              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                                We ensure your milk reaches you fresh, on time, every morning. Delivered before 7:00 AM.
                              </p>
                            </div>
                          </div>

                          {/* CTA */}
                          <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 mt-4">
                            <button onClick={handleNextFromStep1} className="w-full px-6 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer">
                              Continue to Review <ChevronRight size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                      <motion.div
                        key="s2"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-6"
                      >
                        <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-200/50 dark:border-blue-900/30 text-brand-secondary flex-shrink-0">
                            <Package size={20} />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">Review Subscription</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Confirm your details before proceeding to payment</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 my-1">
                          <p className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase pb-2 border-b border-slate-100 dark:border-slate-800/40">Subscription Outline</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                              { label: 'Plan', val: 'Standard Monthly' },
                              { label: 'Volume', val: '1 Litre / Day', blue: true },
                              { label: 'Delivery Days', val: `${deliveryDays} days this month` },
                              { label: 'Start Date', val: formatDate(startDate) },
                            ].map(r => (
                              <div key={r.label}>
                                <p className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">{r.label}</p>
                                <p className={cn('text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1', r.blue ? 'text-brand-secondary font-black' : '')}>{r.val}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Day Picker Calendar */}
                        <SubscriptionCalendar
                          startDate={startDate}
                          onExcludedDatesChange={handleExcludedDatesChange}
                          initialExcludedDates={excludedDates}
                          maxMonthsAhead={1}
                        />

                        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 my-1">
                          <p className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase pb-2 border-b border-slate-100 dark:border-slate-800/40">Delivery Address</p>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{fullname}</p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">+91 {phone}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{address}, {area}, Mangalore</p>
                          {notes && (
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-200/20 dark:border-amber-900/20">📝 {notes}</div>
                          )}
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 mt-4 flex items-center justify-between gap-4">
                          <button onClick={() => setStep(1)} className="px-5 h-12 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer">
                            <ChevronLeft size={14} /> Back
                          </button>
                          <button onClick={() => setStep(3)} className="px-6 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer">
                            Proceed to Payment <ChevronRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                      <motion.div
                        key="s3"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-6"
                      >
                        <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-200/50 dark:border-blue-900/30 text-brand-secondary flex-shrink-0">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">Confirm & Pay</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Review your subscription invoice details</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 my-1">
                          <p className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase pb-2 border-b border-slate-100 dark:border-slate-800/40">Order Invoice</p>
                          <div className="flex flex-col gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between items-center">
                              <span>Milk (1L/Day × {deliveryDays} days)</span>
                              <span>₹{priceLoading ? '...' : monthlyPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Daily rate</span>
                              <span>₹{priceLoading ? '...' : dailyRate.toFixed(2)}/day</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Delivery charge</span>
                              <span className="text-green-500 font-extrabold">FREE</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-200/60 dark:border-slate-800/80 pt-4 text-sm font-extrabold text-slate-800 dark:text-slate-200">
                            <span>Amount Due</span>
                            <span className="text-lg font-black text-brand-primary dark:text-white">₹{priceLoading ? '...' : monthlyPrice.toFixed(0)}</span>
                          </div>
                        </div>

                        {formError && <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 mt-2">⚠️ {formError}</p>}

                        <button
                          onClick={handlePayment}
                          disabled={isPaying}
                          className="w-full h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:translate-y-0 mt-2"
                        >
                          {isPaying ? (
                            <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Securing Connection...</>
                          ) : (
                            <><CreditCard size={15} /> Pay ₹{priceLoading ? '...' : monthlyPrice.toFixed(0)} securely</>
                          )}
                        </button>

                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-3 select-none">
                          <Check size={12} className="text-green-500" />
                          <span>256-bit SSL Encrypted · Powered by Razorpay</span>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 mt-4 flex items-center justify-between gap-4">
                          <button onClick={() => setStep(2)} className="px-5 h-12 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer">
                            <ChevronLeft size={14} /> Back
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT: Subscription Summary Card */}
                <div className="lg:col-span-4 p-6 rounded-brand-2xl border border-border/40 dark:border-slate-800/80 bg-white dark:bg-cream-100 shadow-[0_4px_24px_var(--shadow)] flex flex-col gap-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-brand-secondary flex items-center justify-center flex-shrink-0">
                      <Milk size={20} />
                    </div>
                    <h3 className="font-extrabold font-display text-slate-900 dark:text-white text-base tracking-tight">Your Subscription</h3>
                  </div>

                  {/* Mini bottle + plan info */}
                  <div className="flex gap-4 items-center p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
                    {/* Mini bottle */}
                    <div className="w-12 h-20 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-1 flex flex-col items-center justify-center relative shadow-sm flex-shrink-0 select-none">
                      <div className="w-4 h-2.5 border border-slate-200 dark:border-slate-800 rounded-t bg-slate-200/50 dark:bg-slate-800 absolute -top-2.5" />
                      <div className="text-center flex flex-col items-center justify-center">
                        <span className="text-[10px]">🐄</span>
                        <span className="text-[5px] font-black tracking-tighter text-slate-500 leading-none mt-0.5">AMRUTH</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Standard Plan</p>
                      <p className="text-sm font-black text-brand-secondary mt-0.5">1 Litre / Day</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-slate-400 dark:text-slate-500">Daily Delivery</span>
                        <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-extrabold">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Details list */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    {[
                      { icon: Package, label: 'Quantity', val: '1 Litre / Day' },
                      { icon: Clock, label: 'Delivery Time', val: 'Before 7:00 AM' },
                      { icon: Tag, label: 'Plan Type', val: 'Daily Subscription' },
                      { icon: MapPin, label: 'Price', val: priceLoading ? 'Loading...' : `₹${dailyRate.toFixed(2)} / Day` },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Icon size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0" /> {label}
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Monthly estimate */}
                  <div className="p-4 rounded-xl border border-border/30 dark:border-slate-800/60 bg-cream-50 dark:bg-slate-900/60 mt-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase leading-none">Estimated Monthly</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">({daysInMonth} Days)</p>
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">No additional taxes</p>
                      </div>
                      <div className="flex items-baseline font-black text-slate-800 dark:text-white">
                        <span className="text-sm mr-0.5 text-slate-400 dark:text-slate-500">₹</span>
                        <span className="text-2xl font-black font-display tracking-tight text-brand-primary dark:text-white">{priceLoading ? '...' : monthlyPrice.toLocaleString()}</span>
                        <span className="text-xs text-amber-500 ml-1">✦</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    {[
                      { icon: Leaf, label: 'Farm Fresh', desc: 'Direct from our farm' },
                      { icon: ShieldCheck, label: 'Pure A2', desc: '100% Natural' },
                      { icon: Truck, label: 'Morning', desc: 'Before 7 AM daily' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex flex-col items-center text-center p-2.5 rounded-xl border border-slate-100/40 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-900/20">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-brand-secondary flex items-center justify-center mb-1.5">
                          <Icon size={16} />
                        </div>
                        <p className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 uppercase leading-snug">{label}</p>
                        <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              // SUCCESS
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto p-6 sm:p-8 rounded-brand-2xl border border-border/40 dark:border-slate-800/80 bg-white dark:bg-cream-100 shadow-[0_4px_24px_var(--shadow)] flex flex-col items-center text-center gap-6 my-10"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 dark:text-green-400 flex items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-green-500/5 animate-ping absolute" />
                  <Check size={40} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight">Subscription Confirmed!</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Thank you! Your standard 1L/day delivery starts from{' '}
                  {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.
                </p>
                <div className="w-full flex flex-col gap-3 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Order ID</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">#{orderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Amount Paid</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">₹{monthlyPrice.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Starts From</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatDate(startDate)}</span>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full px-6 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer mt-2"
                >
                  Go to Dashboard <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  )
}