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
        // Logged in! Save their profile details
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
      <main className="sub-page-root">

        {/* ── HERO HEADER SECTION ─────────────────── */}
        <div className="sub-hero">
          {/* Left hero text */}
          <div className="sub-hero-left">
            <div className="sub-pure-badge">
              <span className="sub-pure-dot" />
              100% PURE • FARM FRESH
            </div>
            <h1 className="sub-hero-title">
              Start Your Milk Subscription
            </h1>
            <p className="sub-hero-desc">
              Pure, farm-fresh milk delivered to your doorstep daily.<br />
              Standard 1 Litre/Day subscription.
            </p>

            {/* Stepper */}
            <div className="sub-stepper">
              {[
                { num: 1, label: 'DETAILS' },
                { num: 2, label: 'REVIEW' },
                { num: 3, label: 'PAY' },
              ].map(({ num, label }, i) => {
                const done = step > num
                const active = step === num
                return (
                  <div key={num} className="sub-stepper-item">
                    {i > 0 && (
                      <div className={cn('sub-stepper-line', step > num ? 'sub-stepper-line-done' : '')} />
                    )}
                    <button
                      onClick={() => num < step && setStep(num as StepNum)}
                      className={cn(
                        'sub-step-circle',
                        done ? 'sub-step-done' : active ? 'sub-step-active' : 'sub-step-idle'
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : num}
                    </button>
                    <span className={cn('sub-step-label', active ? 'sub-step-label-active' : '')}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right hero - bottle + splash */}
          <div className="sub-hero-right" aria-hidden>
            {/* Milk splash bg */}
            <div className="sub-splash-bg" />
            <div className="sub-splash-arc-l" />
            <div className="sub-splash-arc-r" />
            <div className="sub-drop sub-drop-1" />
            <div className="sub-drop sub-drop-2" />
            <div className="sub-drop sub-drop-3" />
            <div className="sub-drop sub-drop-4" />
            {/* Bottle */}
            <div className="sub-bottle">
              <div className="sub-bottle-cap" />
              <div className="sub-bottle-neck" />
              <div className="sub-bottle-body">
                <div className="sub-bottle-shine" />
                <div className="sub-bottle-label">
                  <div className="sub-bottle-label-cow">🐄</div>
                  <div className="sub-bottle-label-name">Amruth<br />Dairy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────── */}
        <div className="sub-content">
          <AnimatePresence mode="wait">
            {!paymentSuccess ? (
              <motion.div
                key="wizard"
                className="sub-wizard-layout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >

                {/* LEFT: Form Card */}
                <div className="sub-form-card">
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
                          <div className="sub-form-card-header">
                            <div className="sub-form-card-icon" style={{ backgroundColor: '#fff8e8', borderColor: '#fdeef3' }}>
                              <Smartphone size={20} color="#f59e0b" />
                            </div>
                            <div>
                              <h2 className="sub-form-card-title">Verify Your Mobile</h2>
                              <p className="sub-form-card-sub">
                                We sent a 6-digit OTP code to <strong style={{ color: '#0f172a' }}>+91 {phone}</strong>
                              </p>
                            </div>
                          </div>

                          {/* OTP Boxes */}
                          <div className="otp-boxes" style={{ maxWidth: '380px', margin: '24px auto' }}>
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
                                  'otp-box',
                                  otpError ? 'otp-box-error' : digit ? 'otp-box-filled' : ''
                                )}
                                style={{
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '10px',
                                  background: '#fffdf7',
                                }}
                              />
                            ))}
                          </div>

                          {otpError && (
                            <p className="sub-error" style={{ textAlign: 'center', marginBottom: 12 }}>⚠️ {otpError}</p>
                          )}

                          <div className="resend-row" style={{ marginBottom: 24 }}>
                            {resendCountdown > 0 ? (
                              <span className="resend-timer" style={{ fontSize: '13px' }}>
                                Resend code in <strong style={{ color: '#f59e0b' }}>{resendCountdown}s</strong>
                              </span>
                            ) : (
                              <button onClick={sendOtpCode} className="resend-btn" style={{ color: '#f59e0b', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                Resend OTP Code
                              </button>
                            )}
                          </div>

                          {/* CTA Row */}
                          <div className="sub-form-footer sub-form-footer-row" style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => {
                                setShowOtp(false)
                                setOtp(['', '', '', '', '', ''])
                                setOtpError('')
                              }}
                              className="sub-btn-back"
                              style={{ flex: 1 }}
                            >
                              <ChevronLeft size={14} /> Back
                            </button>
                            <button
                              onClick={() => verifyOtpCode(otp.join(''))}
                              disabled={otpLoading || otp.some(d => d === '')}
                              className="sub-btn-primary"
                              style={{ flex: 2 }}
                            >
                              {otpLoading ? (
                                <><span className="sub-spinner" /> Verifying...</>
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
                        >
                          {/* Card header */}
                          <div className="sub-form-card-header">
                            <div className="sub-form-card-icon">
                              <MapPin size={20} color="#2563eb" />
                            </div>
                            <div>
                              <h2 className="sub-form-card-title">Delivery Details</h2>
                              <p className="sub-form-card-sub">Where should we deliver your fresh milk?</p>
                            </div>
                          </div>

                          {/* Fields grid */}
                          <div className="sub-fields-grid">
                            {/* Full Name */}
                            <div className="sub-field">
                              <label className="sub-label">
                                <User size={12} className="sub-label-icon" /> Full Name
                              </label>
                              <div className="sub-input-wrap">
                                <User size={14} className="sub-input-icon" />
                                <input
                                  type="text"
                                  placeholder="Ravi Nayak"
                                  value={fullname}
                                  onChange={e => { setFullname(e.target.value); setFormError('') }}
                                  className="sub-input"
                                />
                              </div>
                            </div>

                            {/* Full Delivery Address */}
                            <div className="sub-field">
                              <label className="sub-label">
                                <MapPin size={12} className="sub-label-icon" /> Full Delivery Address
                              </label>
                              <div className="sub-input-wrap">
                                <MapPin size={14} className="sub-input-icon" style={{ alignSelf: 'flex-start', marginTop: 14 }} />
                                <textarea
                                  placeholder="Flat/House No, Building, Street, Landmark"
                                  value={address}
                                  onChange={e => { setAddress(e.target.value); setFormError('') }}
                                  rows={2}
                                  className="sub-input sub-textarea"
                                />
                              </div>
                            </div>

                            {/* Mobile */}
                            <div className="sub-field">
                              <label className="sub-label">
                                <Phone size={12} className="sub-label-icon" /> Mobile Number (10-Digit)
                              </label>
                              <div className="sub-phone-wrap">
                                <span className="sub-phone-prefix">
                                  <Phone size={12} /> +91
                                </span>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={10}
                                  placeholder="98765 43210"
                                  value={phone}
                                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFormError('') }}
                                  className="sub-input sub-phone-input"
                                  disabled={isLoggedIn}
                                />
                              </div>
                            </div>

                            {/* Start Date */}
                            <div className="sub-field">
                              <label className="sub-label">
                                <Calendar size={12} className="sub-label-icon" /> Subscription Start Date
                              </label>
                              <div className="sub-input-wrap">
                                <Calendar size={14} className="sub-input-icon" />
                                <input
                                  type="date"
                                  value={startDate}
                                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                  onChange={e => setStartDate(e.target.value)}
                                  className="sub-input"
                                />
                              </div>
                            </div>

                            {/* Area */}
                            <div className="sub-field">
                              <label className="sub-label">
                                <MapPin size={12} className="sub-label-icon" /> Select Area / Locality
                              </label>
                              <div className="sub-input-wrap sub-select-wrap">
                                <MapPin size={14} className="sub-input-icon" />
                                <select
                                  value={area}
                                  onChange={e => setArea(e.target.value)}
                                  className="sub-input sub-select"
                                >
                                  {DELIVERY_AREAS.map((a: string) => (
                                    <option key={a} value={a}>{a} (Mangalore)</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="sub-field">
                              <label className="sub-label">
                                <FileText size={12} className="sub-label-icon" /> Delivery Notes (Optional)
                              </label>
                              <div className="sub-input-wrap">
                                <FileText size={14} className="sub-input-icon" />
                                <input
                                  type="text"
                                  placeholder="Ring bell or leave bag at the door"
                                  value={notes}
                                  onChange={e => setNotes(e.target.value)}
                                  className="sub-input"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Error */}
                          {formError && (
                            <p className="sub-error">⚠️ {formError}</p>
                          )}

                          {/* Delivery banner */}
                          <div className="sub-delivery-banner">
                            <div className="sub-delivery-banner-icon">
                              <Truck size={20} color="#2563eb" />
                            </div>
                            <div>
                              <p className="sub-delivery-banner-title">Quick & Reliable Delivery</p>
                              <p className="sub-delivery-banner-desc">
                                We ensure your milk reaches you fresh, on time, every morning.
                              </p>
                            </div>
                            {/* Farm sketch (CSS) */}
                            <div className="sub-farm-sketch" aria-hidden>
                              <div className="farm-barn" />
                              <div className="farm-tree farm-tree-1" />
                              <div className="farm-tree farm-tree-2" />
                            </div>
                          </div>

                          {/* CTA */}
                          <div className="sub-form-footer">
                            <button onClick={handleNextFromStep1} className="sub-btn-primary sub-btn-full">
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
                      >
                        <div className="sub-form-card-header">
                          <div className="sub-form-card-icon">
                            <Package size={20} color="#2563eb" />
                          </div>
                          <div>
                            <h2 className="sub-form-card-title">Review Subscription</h2>
                            <p className="sub-form-card-sub">Confirm your details before proceeding to payment</p>
                          </div>
                        </div>

                        <div className="sub-review-block">
                          <p className="sub-review-block-title">Subscription Outline</p>
                          <div className="sub-review-grid">
                            {[
                              { label: 'Plan', val: 'Standard Monthly' },
                              { label: 'Volume', val: '1 Litre / Day', blue: true },
                              { label: 'Delivery Days', val: `${deliveryDays} days this month` },
                              { label: 'Start Date', val: formatDate(startDate) },
                            ].map(r => (
                              <div key={r.label}>
                                <p className="sub-review-key">{r.label}</p>
                                <p className={cn('sub-review-val', r.blue ? 'sub-review-val-blue' : '')}>{r.val}</p>
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

                        <div className="sub-review-block">
                          <p className="sub-review-block-title">Delivery Address</p>
                          <p className="sub-review-name">{fullname}</p>
                          <p className="sub-review-phone">+91 {phone}</p>
                          <p className="sub-review-addr">{address}, {area}, Mangalore</p>
                          {notes && (
                            <div className="sub-review-notes">📝 {notes}</div>
                          )}
                        </div>

                        <div className="sub-form-footer sub-form-footer-row">
                          <button onClick={() => setStep(1)} className="sub-btn-back">
                            <ChevronLeft size={14} /> Back
                          </button>
                          <button onClick={() => setStep(3)} className="sub-btn-primary">
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
                      >
                        <div className="sub-form-card-header">
                          <div className="sub-form-card-icon">
                            <CreditCard size={20} color="#2563eb" />
                          </div>
                          <div>
                            <h2 className="sub-form-card-title">Confirm & Pay</h2>
                            <p className="sub-form-card-sub">Review your subscription invoice details</p>
                          </div>
                        </div>

                        <div className="sub-invoice">
                          <p className="sub-invoice-title">Order Invoice</p>
                          <div className="sub-invoice-rows">
                            <div className="sub-invoice-row">
                              <span>Milk (1L/Day × {deliveryDays} days)</span>
                              <span>₹{priceLoading ? '...' : monthlyPrice.toFixed(2)}</span>
                            </div>
                            <div className="sub-invoice-row">
                              <span>Daily rate</span>
                              <span>₹{priceLoading ? '...' : dailyRate.toFixed(2)}/day</span>
                            </div>
                            <div className="sub-invoice-row">
                              <span>Delivery charge</span>
                              <span className="sub-invoice-free">FREE</span>
                            </div>
                          </div>
                          <div className="sub-invoice-total">
                            <span>Amount Due</span>
                            <span className="sub-invoice-total-amt">₹{priceLoading ? '...' : monthlyPrice.toFixed(0)}</span>
                          </div>
                        </div>

                        {formError && <p className="sub-error">{formError}</p>}

                        <button
                          onClick={handlePayment}
                          disabled={isPaying}
                          className="sub-pay-btn"
                        >
                          {isPaying ? (
                            <><span className="sub-spinner" /> Securing Connection...</>
                          ) : (
                            <><CreditCard size={15} /> Pay ₹{priceLoading ? '...' : monthlyPrice.toFixed(0)} securely</>
                          )}
                        </button>

                        <div className="sub-secure-row">
                          <Check size={12} color="#22c55e" />
                          <span>256-bit SSL Encrypted · Powered by Razorpay</span>
                        </div>

                        <div className="sub-form-footer sub-form-footer-row" style={{ marginTop: 16 }}>
                          <button onClick={() => setStep(2)} className="sub-btn-back">
                            <ChevronLeft size={14} /> Back
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT: Subscription Summary Card */}
                <div className="sub-summary-card">
                  <div className="sub-summary-header">
                    <div className="sub-summary-header-icon">
                      <Milk size={20} color="#2563eb" />
                    </div>
                    <h3 className="sub-summary-title">Your Subscription</h3>
                  </div>

                  {/* Mini bottle + plan info */}
                  <div className="sub-plan-row">
                    {/* Mini bottle */}
                    <div className="sub-mini-bottle">
                      <div className="sub-mini-cap" />
                      <div className="sub-mini-neck" />
                      <div className="sub-mini-body">
                        <span className="sub-mini-label-text">🐄<br /><span style={{fontSize:6}}>Amruth<br/>Dairy</span></span>
                      </div>
                    </div>
                    <div className="sub-plan-info">
                      <p className="sub-plan-name">Standard Plan</p>
                      <p className="sub-plan-qty">1 Litre / Day</p>
                      <div className="sub-plan-tags">
                        <span>Daily Delivery</span>
                        <span className="sub-plan-tag-active">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Details list */}
                  <div className="sub-details-list">
                    {[
                      { icon: Package, label: 'Quantity', val: '1 Litre / Day' },
                      { icon: Clock, label: 'Delivery Time', val: 'Before 7:00 AM' },
                      { icon: Tag, label: 'Plan Type', val: 'Daily Subscription' },
                      { icon: MapPin, label: 'Price', val: priceLoading ? 'Loading...' : `₹${dailyRate.toFixed(2)} / Day` },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="sub-detail-row">
                        <span className="sub-detail-label">
                          <Icon size={13} className="sub-detail-icon" /> {label}
                        </span>
                        <span className="sub-detail-val">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Monthly estimate */}
                  <div className="sub-monthly-box">
                    <div className="sub-monthly-row">
                      <div>
                        <p className="sub-monthly-label">Estimated Monthly</p>
                        <p className="sub-monthly-days">({daysInMonth} Days)</p>
                        <p className="sub-monthly-tax">No additional taxes</p>
                      </div>
                      <div className="sub-monthly-price">
                        <span className="sub-monthly-rupee">₹</span>
                        <span className="sub-monthly-amt">{priceLoading ? '...' : monthlyPrice.toLocaleString()}</span>
                        <span className="sub-monthly-star">✦</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="sub-feature-pills">
                    {[
                      { icon: Leaf, label: 'Farm Fresh', desc: 'Direct from our farm' },
                      { icon: ShieldCheck, label: 'No Preservatives', desc: '100% Pure & Natural' },
                      { icon: Truck, label: 'On-Time Delivery', desc: 'Before 7 AM, Everyday' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="sub-feature-pill">
                        <div className="sub-feature-pill-icon">
                          <Icon size={16} color="#2563eb" />
                        </div>
                        <p className="sub-feature-pill-label">{label}</p>
                        <p className="sub-feature-pill-desc">{desc}</p>
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
                className="sub-success"
              >
                <div className="sub-success-icon">
                  <div className="sub-success-ping" />
                  <Check size={40} color="#16a34a" />
                </div>
                <h2 className="sub-success-title">Subscription Confirmed!</h2>
                <p className="sub-success-desc">
                  Thank you! Your standard 1L/day delivery starts from{' '}
                  {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.
                </p>
                <div className="sub-success-card">
                  <div className="sub-success-row">
                    <span>Order ID</span>
                    <span className="sub-success-mono">#{orderId}</span>
                  </div>
                  <div className="sub-success-row">
                    <span>Amount Paid</span>
                    <span className="sub-success-mono">₹{monthlyPrice.toFixed(0)}</span>
                  </div>
                  <div className="sub-success-row">
                    <span>Starts From</span>
                    <span className="sub-success-mono">{formatDate(startDate)}</span>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="sub-btn-primary"
                  style={{ marginTop: 8 }}
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