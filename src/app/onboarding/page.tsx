'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, MapPin, CreditCard, CheckCircle,
  ArrowRight, User, Home, Building2, FileText,
  Phone, ShieldCheck, Clock, Leaf, ChevronDown,
  Package, Tag, Sprout, Milk, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DELIVERY_AREAS, QUANTITY_OPTIONS, DELIVERY_TIME_PROMISE } from '@/lib/constants'
import { fetchMilkPricesClient, calculateDailyRate, calculateMonthlyAmount, getDaysInMonth, calculateProRataAmount as calcProRata } from '@/lib/billing'
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
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split('T')[0])
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
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0)
    if (new Date(startDate) < tomorrow) { setError('Start date must be tomorrow or later.'); return }
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
    <div className="ob-root">

      {/* ── TOP BRAND BAR ──────────────────────── */}
      <div className="ob-topbar">
        <div className="ob-brand">
          <div className="ob-brand-icon flex items-center justify-center">
            <Sprout size={16} className="text-teal-600" />
          </div>
          <div>
            <p className="ob-brand-name">Amruth Milk</p>
            <p className="ob-brand-sub">SUBSCRIPTION PORTAL</p>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────── */}
      <div className="ob-layout">

        {/* LEFT PANEL */}
        <div className="ob-left">
          <p className="ob-left-eyebrow">Let's get started!</p>
          <div className="ob-left-accent" />
          <h2 className="ob-left-title">
            Fresh milk,<br />
            delivered<br />
            just for you.
          </h2>
          <p className="ob-left-desc">
            Tell us a few details so we can deliver pure, farm-fresh milk to your doorstep.
          </p>

          {/* Bottle visual */}
          <div className="ob-bottle-wrap">
            {/* Splash */}
            <div className="ob-splash" />
            <div className="ob-splash-l" />
            <div className="ob-splash-r" />
            {/* Bottle */}
            <div className="ob-bottle">
              <div className="ob-bottle-cap" />
              <div className="ob-bottle-neck" />
              <div className="ob-bottle-body">
                <div className="ob-bottle-shine" />
                <div className="ob-bottle-label flex flex-col items-center justify-center gap-1">
                  <Sprout size={14} className="text-teal-600" />
                  <span className="ob-bottle-label-name">Amruth<br/>Dairy</span>
                </div>
              </div>
            </div>
            {/* Glass */}
            <div className="ob-glass">
              <div className="ob-glass-milk" />
            </div>
          </div>

          {/* Feature pills */}
          <div className="ob-features">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="ob-feature">
                <div className="ob-feature-icon">
                  <Icon size={16} color="#2563eb" />
                </div>
                <div>
                  <p className="ob-feature-label">{label}</p>
                  <p className="ob-feature-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="ob-right">

          {/* Stepper */}
          {step !== 'success' && (
            <div className="ob-stepper">
              {[
                { num: 1, label: 'Details', sub: 'Tell us your delivery details' },
                { num: 2, label: 'Plan', sub: 'Choose your plan' },
                { num: 3, label: 'Review', sub: 'Confirm & continue' },
              ].map(({ num, label, sub }, i) => {
                const done = (step as number) > num
                const active = step === num
                return (
                  <div key={num} className="ob-step-item">
                    {i > 0 && (
                      <div className={cn('ob-step-line', (step as number) > num ? 'ob-step-line-done' : '')} />
                    )}
                    <div className={cn('ob-step-circle', done ? 'ob-step-done' : active ? 'ob-step-active' : 'ob-step-idle')}>
                      {num}
                    </div>
                    <div className="ob-step-text">
                      <p className={cn('ob-step-label', active ? 'ob-step-label-active' : '')}>{label}</p>
                      <p className="ob-step-sub">{sub}</p>
                    </div>
                  </div>
                )
              })}
              {/* Active underline */}
              <div
                className="ob-step-underline"
                style={{ left: `${((step as number) - 1) * 33.33}%`, width: '33.33%' }}
              />
            </div>
          )}

          {/* Form area */}
          <div className="ob-form-area">
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
                  <div className="ob-section-header">
                    <div className="ob-section-icon">
                      <MapPin size={18} color="#2563eb" />
                    </div>
                    <div>
                      <h3 className="ob-section-title">Onboarding Details</h3>
                      <p className="ob-section-sub">Please provide your morning milk delivery address details.</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="ob-form">
                    {/* Full Name */}
                    <div className="ob-field">
                      <label className="ob-label">
                        <User size={12} /> Full Name
                      </label>
                      <div className="ob-input-wrap">
                        <User size={14} className="ob-input-icon" />
                        <input
                          type="text"
                          placeholder="Ravi Nayak"
                          value={fullName}
                          onChange={e => { setFullName(e.target.value); setError('') }}
                          className="ob-input"
                          required
                        />
                      </div>
                    </div>

                    {/* Area + Landmark */}
                    <div className="ob-grid-2">
                      <div className="ob-field">
                        <label className="ob-label">
                          <MapPin size={12} /> Delivery Locality / Area
                        </label>
                        <div className="ob-input-wrap ob-select-wrap">
                          <MapPin size={14} className="ob-input-icon" />
                          <select
                            value={area}
                            onChange={e => setArea(e.target.value)}
                            className="ob-input ob-select"
                          >
                            {DELIVERY_AREAS.map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="ob-select-arrow" />
                        </div>
                      </div>

                      <div className="ob-field">
                        <label className="ob-label">
                          <Building2 size={12} /> Landmark (Optional)
                        </label>
                        <div className="ob-input-wrap">
                          <Building2 size={14} className="ob-input-icon" />
                          <input
                            type="text"
                            placeholder="Opposite Central Park"
                            value={landmark}
                            onChange={e => setLandmark(e.target.value)}
                            className="ob-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="ob-field">
                      <label className="ob-label">
                        <Home size={12} /> Delivery Street Address
                      </label>
                      <div className="ob-input-wrap ob-textarea-wrap">
                        <Home size={14} className="ob-input-icon ob-input-icon-top" />
                        <textarea
                          placeholder="House No 12-B, Rose Villa, 2nd Cross road..."
                          value={address}
                          onChange={e => { setAddress(e.target.value); setError('') }}
                          rows={2}
                          className="ob-input ob-textarea"
                          required
                        />
                      </div>
                    </div>

                    {/* Floor notes */}
                    <div className="ob-field">
                      <label className="ob-label">
                        <FileText size={12} /> Floor / Delivery Instructions (Optional)
                      </label>
                      <div className="ob-input-wrap">
                        <FileText size={14} className="ob-input-icon" />
                        <input
                          type="text"
                          placeholder="2nd Floor, leave bag on door handle"
                          value={floorNotes}
                          onChange={e => setFloorNotes(e.target.value)}
                          className="ob-input"
                        />
                      </div>
                    </div>

                    {error && <p className="ob-error flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

                    <button type="submit" disabled={loading} className="ob-btn-primary">
                      {loading
                        ? <span className="ob-spinner" />
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
                  <div className="ob-section-header">
                    <div className="ob-section-icon">
                      <Calendar size={18} color="#2563eb" />
                    </div>
                    <div>
                      <h3 className="ob-section-title">Choose Your Plan</h3>
                      <p className="ob-section-sub">Select your daily quantity and subscription start date.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePlanSubmit} className="ob-form">
                    {/* Quantity selector */}
                    <div className="ob-field">
                      <label className="ob-label-plain">Daily Milk Quantity</label>
                      <div className="ob-qty-grid">
                        {QUANTITY_OPTIONS.map(({ litres, label }) => {
                          const qtyMonthly = Object.keys(milkPrices).length > 0
                            ? calculateMonthlyAmount(calculateDailyRate(litres, milkPrices), startDate ? new Date(startDate).getFullYear() : new Date().getFullYear(), startDate ? new Date(startDate).getMonth() + 1 : new Date().getMonth() + 1)
                            : 0
                          return (
                          <button
                            key={litres}
                            type="button"
                            onClick={() => setQuantity(litres)}
                            className={cn('ob-qty-btn', quantity === litres ? 'ob-qty-active' : '')}
                          >
                            {quantity === litres && (
                              <div className="ob-qty-check">✓</div>
                            )}
                            <span className="ob-qty-litres">{label}</span>
                            <span className="ob-qty-price">{priceLoading ? '...' : `₹${Math.round(qtyMonthly)}/mo`}</span>
                          </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Start date + daily rate */}
                    <div className="ob-grid-2">
                      <div className="ob-field">
                        <label className="ob-label-plain">Start Date</label>
                        <div className="ob-input-wrap">
                          <Calendar size={14} className="ob-input-icon" />
                          <input
                            type="date"
                            value={startDate}
                            min={tomorrowStr}
                            onChange={e => setStartDate(e.target.value)}
                            className="ob-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="ob-field">
                        <label className="ob-label-plain">Daily Rate</label>
                        <div className="ob-rate-box">
                          <span className="ob-rate-label">Rate per day</span>
                          <span className="ob-rate-value">₹{dailyRate.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery notes */}
                    <div className="ob-field">
                      <label className="ob-label-plain">Delivery Notes (Optional)</label>
                      <div className="ob-input-wrap">
                        <FileText size={14} className="ob-input-icon" />
                        <input
                          type="text"
                          placeholder="Keep milk inside bag on door handle"
                          value={deliveryNotes}
                          onChange={e => setDeliveryNotes(e.target.value)}
                          className="ob-input"
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
                    <div className="ob-preview-card">
                      <div className="ob-preview-row">
                        <span>Monthly Amount</span>
                        <span className="ob-preview-val">₹{monthlyAmount.toFixed(2)}</span>
                      </div>
                      <div className="ob-preview-row">
                        <span>First payment (pro-rata)</span>
                        <span className="ob-preview-val ob-preview-val-blue">
                          ₹{proRataAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {error && <p className="ob-error flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

                    <div className="ob-btn-row">
                      <button type="button" onClick={() => setStep(1)} className="ob-btn-back">
                        Back
                      </button>
                      <button type="submit" className="ob-btn-primary ob-btn-grow">
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
                  <div className="ob-section-header">
                    <div className="ob-section-icon">
                      <CreditCard size={18} color="#2563eb" />
                    </div>
                    <div>
                      <h3 className="ob-section-title">Confirm Subscription</h3>
                      <p className="ob-section-sub">Review your plan and complete payment.</p>
                    </div>
                  </div>

                  <div className="ob-form">
                    {/* Summary */}
                    <div className="ob-summary">
                      {[
                        { label: 'Plan Quantity', icon: <Package size={13} />, value: `${quantity} Litre${quantity > 1 ? 's' : ''} / Day` },
                        { label: 'Starting Date', icon: <Calendar size={13} />, value: new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                        { label: 'Monthly Rate', icon: <Tag size={13} />, value: `₹${monthlyAmount.toFixed(2)}` },
                        { label: 'Delivery Area', icon: <MapPin size={13} />, value: area },
                        { label: 'Address', icon: <Home size={13} />, value: address },
                      ].map(({ label, icon, value }) => (
                        <div key={label} className="ob-summary-row">
                          <span className="ob-summary-key flex items-center gap-1.5">
                            {icon}
                            {label}
                          </span>
                          <span className="ob-summary-val">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pro-rata invoice */}
                    <div className="ob-invoice">
                      <p className="ob-invoice-title">Pro-Rata Invoice (First Month)</p>
                      <div className="ob-invoice-row">
                        <span>Days remaining in {new Date(startDate).toLocaleString('en-IN', { month: 'long' })}</span>
                        <span>{proRataDays} days</span>
                      </div>
                      <div className="ob-invoice-row">
                        <span>{proRataDays} days × ₹{dailyRate.toFixed(2)}/day</span>
                        <span>₹{proRataAmount.toFixed(2)}</span>
                      </div>
                      <div className="ob-invoice-total">
                        <span>Total Due Today</span>
                        <span className="ob-invoice-total-amt">₹{proRataAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {error && <p className="ob-error flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

                    <div className="ob-btn-row">
                      <button onClick={() => setStep(2)} className="ob-btn-back">
                        Back
                      </button>
                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="ob-btn-pay ob-btn-grow"
                      >
                        {loading
                          ? <span className="ob-spinner" />
                          : <><CreditCard size={15} /><span>Pay ₹{proRataAmount.toFixed(2)} securely</span></>
                        }
                      </button>
                    </div>

                    <div className="ob-secure-note">
                      <ShieldCheck size={13} color="#16a34a" />
                      Your information is safe with us and will never be shared.
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
                  className="ob-success"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                    className="ob-success-icon"
                  >
                    <div className="ob-success-ping" />
                    <CheckCircle size={36} color="#16a34a" />
                  </motion.div>
                  <h2 className="ob-success-title">Subscription Confirmed!</h2>
                  <p className="ob-success-desc">
                    Payment of <strong>₹{proRataAmount.toFixed(2)}</strong> confirmed.
                    <br />Your milk delivery starts soon! <Milk size={14} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  </p>
                  <div className="ob-success-loader">
                    <motion.div
                      className="ob-success-bar"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.8 }}
                    />
                  </div>
                  <p className="ob-success-redirect">Redirecting to your dashboard...</p>
                </motion.div>
              )}

              {/* WAITLIST SUCCESS */}
              {step === 'waitlist' && (
                <motion.div
                  key="waitlist"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="ob-success"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                    className="ob-success-icon"
                    style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a' }}
                  >
                    <Clock size={36} color="#d97706" />
                  </motion.div>
                  <h2 className="ob-success-title" style={{ color: '#d97706' }}>Added to Waitlist!</h2>
                  <p className="ob-success-desc">
                    Daily capacity is currently full. You have been placed on the waitlist at <strong>Position #{waitlistPosition}</strong>.
                    <br />We will notify you as soon as delivery slots open! <Milk size={14} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  </p>
                  <div className="ob-success-loader">
                    <motion.div
                      className="ob-success-bar"
                      style={{ backgroundColor: '#f59e0b', width: '100%' }}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3.8 }}
                    />
                  </div>
                  <p className="ob-success-redirect">Redirecting to your dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Assistance bar */}
          <div className="ob-assist">
            <div className="ob-assist-left">
              <div className="ob-assist-icon">
                <Phone size={18} color="#2563eb" />
              </div>
              <div>
                <p className="ob-assist-title">Need assistance?</p>
                <p className="ob-assist-sub">Our support team is here to help you.</p>
              </div>
            </div>
            <a href="tel:+919876543210" className="ob-assist-btn">
              <Phone size={13} />
              +91 98765 43210
            </a>
          </div>

        </div>
      </div>

      {/* Bottom trust note */}
      <div className="ob-footer">
        <ShieldCheck size={13} className="ob-footer-icon" />
        Your information is safe with us and will never be shared.
      </div>
    </div>
  )
}