// app/(public)/subscribe/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { motion } from 'framer-motion'
import {
  ArrowRight, Check, Leaf, ShieldCheck, Truck, Clock,
  MapPin, Star, Milk, RefreshCw, BadgeCheck, CalendarDays,
  Smartphone, X, ChevronDown
} from 'lucide-react'
import { DELIVERY_AREAS, DELIVERY_TIME_PROMISE } from '@/lib/constants'
import { fetchMilkPricesClient, calculateDailyRate, getDaysInMonth } from '@/lib/billing'
import { cn } from '@/lib/utils'

// ─── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Priya Shetty',
    area: 'Padil, Mangalore',
    text: 'Getting fresh milk at 6 AM every day has changed our mornings. No more running to the store!',
    rating: 5,
    avatar: 'PS',
  },
  {
    name: 'Ramesh Nayak',
    area: 'Kadri, Mangalore',
    text: "The quality is unmatched. You can taste the difference — it's genuinely farm-fresh.",
    rating: 5,
    avatar: 'RN',
  },
  {
    name: 'Sunita Rao',
    area: 'Bejai, Mangalore',
    text: 'I love being able to skip delivery days when travelling. So convenient!',
    rating: 5,
    avatar: 'SR',
  },
]

// ─── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Leaf, title: 'Farm Fresh Milk', desc: 'Sourced daily from our own cows. No middlemen, no storage delays.', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  { icon: ShieldCheck, title: 'No Preservatives', desc: 'Pure and natural — absolutely nothing added. Just milk as nature intended.', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  { icon: Truck, title: 'Before 7 AM Delivery', desc: `${DELIVERY_TIME_PROMISE} — every single morning, right at your door.`, color: 'text-[#0284C7]', bg: 'bg-sky-50 border-sky-100' },
  { icon: CalendarDays, title: 'Flexible Skip Days', desc: 'Travelling? Pause or skip individual days from your dashboard, anytime.', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  { icon: RefreshCw, title: 'Monthly Billing', desc: 'Simple monthly billing — no surprises, no hidden charges, pay as you go.', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  { icon: Smartphone, title: 'Easy Management', desc: 'Control your subscription, track deliveries, and view bills from your phone.', color: 'text-[#0f2e5c]', bg: 'bg-slate-50 border-slate-100' },
]

// ─── How it works ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up in under 2 minutes with just your email. No credit card needed upfront.' },
  { step: '02', title: 'Set Your Delivery Details', desc: 'Tell us your address, area, and when you\'d like to start. Choose your litre quantity.' },
  { step: '03', title: 'Milk at Your Doorstep', desc: 'Wake up to fresh farm milk every morning. Manage everything from the app.' },
]

// ─── Quantity plans ────────────────────────────────────────────────────────────
const PLANS = [
  { litres: 0.5, label: '½ Litre / Day', tag: 'Solo', desc: 'Perfect for a single person' },
  { litres: 1.0, label: '1 Litre / Day', tag: 'Popular', desc: 'Ideal for a small family', highlight: true },
  { litres: 1.5, label: '1½ Litres / Day', tag: 'Family', desc: 'Great for 3–4 members' },
  { litres: 2.0, label: '2 Litres / Day', tag: 'Large', desc: 'For larger households' },
]

export default function SubscribePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [ctaLoading, setCtaLoading] = useState(false)
  const [milkPrices, setMilkPrices] = useState<Record<string, number>>({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  // ── Check auth ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/customer/dashboard')
        const data = await res.json()
        setIsLoggedIn(data.success === true)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  // ── Load prices ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadPrices() {
      setPriceLoading(true)
      const prices = await fetchMilkPricesClient()
      setMilkPrices(prices)
      setPriceLoading(false)
    }
    loadPrices()
  }, [])

  // ── CTA handler ────────────────────────────────────────────────────────────
  async function handleSubscribe() {
    setCtaLoading(true)
    if (isLoggedIn === null) {
      // Re-check auth if we don't have a result yet
      try {
        const res = await fetch('/api/customer/dashboard')
        const data = await res.json()
        if (data.success) {
          router.push('/onboarding')
        } else {
          router.push('/login?redirect=/onboarding')
        }
      } catch {
        router.push('/login?redirect=/onboarding')
      }
    } else if (isLoggedIn) {
      router.push('/onboarding')
    } else {
      router.push('/login?redirect=/onboarding')
    }
    setCtaLoading(false)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getMonthlyEstimate = (litres: number) => {
    if (priceLoading || !Object.keys(milkPrices).length) return null
    const daily = calculateDailyRate(litres, milkPrices)
    const now = new Date()
    const days = getDaysInMonth(now.getFullYear(), now.getMonth() + 1)
    return Math.round(daily * days)
  }

  const getDaily = (litres: number) => {
    if (priceLoading || !Object.keys(milkPrices).length) return null
    return calculateDailyRate(litres, milkPrices)
  }

  const faqs = [
    { q: 'When does delivery happen?', a: `We deliver fresh milk ${DELIVERY_TIME_PROMISE} every morning, 7 days a week including Sundays and public holidays.` },
    { q: 'Can I skip a delivery day?', a: 'Yes! You can skip individual days or pause your subscription entirely from your dashboard. Just make the change before 9 PM the previous night.' },
    { q: 'Which areas do you deliver to?', a: `We currently deliver to ${DELIVERY_AREAS.slice(0, 5).join(', ')}, and more areas across Mangalore.` },
    { q: 'How is billing calculated?', a: 'Billing is calculated on a per-day basis. If you skip a day, you are not charged for it. Your bill is generated monthly based on actual delivery days.' },
    { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time from your dashboard. No lock-in period, no cancellation fees.' },
    { q: 'What quantity should I choose?', a: 'For a single person, ½ litre is usually enough. A family of 3–4 typically needs 1–1.5 litres. You can always change your quantity from the dashboard.' },
  ]

  // ── Animated number counter ────────────────────────────────────────────────
  const stats = [
    { val: '200+', label: 'Happy Families' },
    { val: '7', label: 'Days a Week' },
    { val: '100%', label: 'Pure Milk' },
    { val: '< 7 AM', label: 'Delivered By' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-800 overflow-x-hidden">

        {/* ══════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#02429C] pt-28 pb-24 px-5">
          {/* Decorative blobs */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#0284C7]/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-[360px] h-[360px] rounded-full bg-[#0f2e5c]/60 blur-[80px] pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center gap-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-extrabold tracking-widest uppercase text-white/80"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              100% Pure · Farm Fresh · Mangalore
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-cabinet text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight max-w-3xl"
            >
              Fresh Milk at Your Door,{' '}
              <span className="text-yellow-400">Every Morning</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-300 font-medium text-base sm:text-lg max-w-xl leading-relaxed"
            >
              Pure cow milk delivered from our farm directly to your doorstep — before you wake up, every day.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 mt-2"
            >
              <button
                onClick={handleSubscribe}
                disabled={ctaLoading}
                className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-[12px] bg-white text-[#0f2e5c] font-bold text-[15px] hover:bg-yellow-400 hover:text-[#0f2e5c] transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-black/20"
              >
                {ctaLoading ? (
                  <span className="w-5 h-5 border-2 border-[#0f2e5c]/30 border-t-[#0f2e5c] rounded-full animate-spin" />
                ) : (
                  <>
                    Start My Subscription
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
              <Link
                href="#how-it-works"
                className="text-white/70 hover:text-white text-sm font-semibold underline underline-offset-4 transition-colors"
              >
                See how it works
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-4 mt-4"
            >
              {[
                { icon: BadgeCheck, label: 'No lock-in' },
                { icon: CalendarDays, label: 'Skip any day' },
                { icon: X, label: 'Cancel anytime' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-white/60 text-xs font-semibold">
                  <Icon size={14} className="text-green-400" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════════════════════ */}
        <section className="bg-[#0F2E5C] py-5">
          <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {stats.map(({ val, label }) => (
              <div key={label} className="flex flex-col">
                <span className="font-cabinet text-2xl font-bold text-white">{val}</span>
                <span className="text-xs font-semibold text-white/70 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FEATURES GRID
        ══════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#0284C7]">Why Amruth Dairy</span>
              <h2 className="font-cabinet text-3xl sm:text-4xl font-bold text-[#0f2e5c] mt-2">
                Milk the way it should be
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-lg mx-auto leading-relaxed">
                We are not just delivering milk — we are bringing you a healthier, simpler morning routine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border mb-4', bg)}>
                    <Icon size={20} className={color} />
                  </div>
                  <h3 className="font-cabinet font-bold text-slate-900 text-[15px] mb-1.5">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            PRICING / PLANS
        ══════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 bg-white" id="plans">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#0284C7]">Pricing</span>
              <h2 className="font-cabinet text-3xl sm:text-4xl font-bold text-[#0f2e5c] mt-2">
                Simple, transparent pricing
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-lg mx-auto">
                Pay only for what you receive. Skip a day, don&apos;t pay for it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLANS.map(({ litres, label, tag, desc, highlight }) => {
                const monthly = getMonthlyEstimate(litres)
                const daily = getDaily(litres)
                return (
                  <motion.div
                    key={litres}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                    className={cn(
                      'relative flex flex-col rounded-2xl border p-6 transition-all duration-200',
                      highlight
                        ? 'bg-[#02429C] border-[#0f2e5c] shadow-xl shadow-[#0f2e5c]/20'
                        : 'bg-white border-slate-200 hover:border-[#0284C7]/50 hover:shadow-md'
                    )}
                  >
                    {highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-400 text-[#0f2e5c] text-[10px] font-extrabold tracking-wider uppercase">
                        Most Popular
                      </div>
                    )}
                    <div className={cn('text-[10px] font-extrabold uppercase tracking-widest mb-2', highlight ? 'text-white/50' : 'text-slate-400')}>{tag}</div>
                    <div className={cn('font-cabinet font-bold text-lg leading-tight mb-1', highlight ? 'text-white' : 'text-[#0f2e5c]')}>{label}</div>
                    <div className={cn('text-xs mb-5 leading-relaxed', highlight ? 'text-white/60' : 'text-slate-400')}>{desc}</div>

                    <div className="mt-auto">
                      <div className={cn('text-[11px] font-semibold mb-1', highlight ? 'text-white/50' : 'text-slate-400')}>
                        {priceLoading ? 'Loading price...' : `₹${daily?.toFixed(2) ?? '—'} / day`}
                      </div>
                      <div className={cn('font-cabinet text-2xl font-bold', highlight ? 'text-white' : 'text-[#0f2e5c]')}>
                        {priceLoading ? (
                          <span className="text-base font-medium opacity-50">Calculating...</span>
                        ) : (
                          <>₹{monthly?.toLocaleString() ?? '—'}<span className={cn('text-sm font-medium ml-1', highlight ? 'text-white/50' : 'text-slate-400')}>/mo</span></>
                        )}
                      </div>
                      <button
                        onClick={handleSubscribe}
                        className={cn(
                          'mt-4 w-full h-11 rounded-[10px] text-sm font-bold transition-all duration-200 hover:scale-[1.02]',
                          highlight
                            ? 'bg-white text-[#0f2e5c] hover:bg-yellow-400'
                            : 'bg-[#02429C] text-white hover:bg-[#0F2E5C]'
                        )}
                      >
                        Get Started
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <p className="text-center text-xs text-slate-400 font-medium mt-6">
              Estimated for a 30-day month. Actual billing varies based on delivery days and skips. No taxes applied.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 bg-slate-50" id="how-it-works">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#0284C7]">Process</span>
              <h2 className="font-cabinet text-3xl sm:text-4xl font-bold text-[#0f2e5c] mt-2">
                Start in 3 simple steps
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-slate-200" />
              {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#02429C] text-white flex items-center justify-center font-cabinet font-bold text-xl mb-5 relative z-10 shadow-lg shadow-[#0f2e5c]/20">
                    {step}
                  </div>
                  <h3 className="font-cabinet font-bold text-[#0f2e5c] text-base mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-[240px] mx-auto">{desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <button
                onClick={handleSubscribe}
                disabled={ctaLoading}
                className="inline-flex items-center gap-2 h-13 px-8 rounded-[12px] bg-[#02429C] text-white font-bold text-[15px] hover:bg-[#0F2E5C] transition-all duration-200 hover:scale-105 disabled:opacity-60 shadow-lg shadow-[#0f2e5c]/20"
              >
                {ctaLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Get Started Now <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            DELIVERY AREAS
        ══════════════════════════════════════════════════════════ */}
        <section className="py-16 px-5 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
              <div className="flex-1 text-center md:text-left">
                <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#0284C7]">Coverage</span>
                <h2 className="font-cabinet text-2xl sm:text-3xl font-bold text-[#0f2e5c] mt-2 mb-3">
                  We deliver across Mangalore
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
                  Our delivery network covers major localities in Mangalore. More areas are being added soon!
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {DELIVERY_AREAS.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                    >
                      <MapPin size={11} className="text-[#0284C7]" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              {/* Map placeholder */}
              <div className="flex-shrink-0 w-full md:w-64 h-52 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-3 border border-slate-200">
                <MapPin size={36} className="text-[#0284C7]" />
                <span className="text-slate-500 text-sm font-medium text-center px-4">Padil, Mangalore<br />&amp; surrounding areas</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 bg-[#02429C]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-white/50">Testimonials</span>
              <h2 className="font-cabinet text-3xl sm:text-4xl font-bold text-white mt-2">
                What our customers say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ name, area, text, rating, avatar }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 backdrop-blur-sm"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} size={14} fill="#facc15" className="text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed flex-1">&ldquo;{text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0284C7]/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{name}</p>
                      <p className="text-white/40 text-xs">{area}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#0284C7]">FAQ</span>
              <h2 className="font-cabinet text-3xl sm:text-4xl font-bold text-[#0f2e5c] mt-2">
                Got questions?
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map(({ q, a }, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-cabinet font-bold text-slate-900 text-sm">{q}</span>
                    <ChevronDown
                      size={16}
                      className={cn('text-slate-400 flex-shrink-0 transition-transform duration-200', faqOpen === i ? 'rotate-180' : '')}
                    />
                  </button>
                  {faqOpen === i && (
                    <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed bg-white border-t border-slate-100">
                      {a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════ */}
        <section className="py-20 px-5 bg-gradient-to-br from-[#0284C7] to-[#0f2e5c]">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Milk size={32} className="text-white" />
            </div>
            <h2 className="font-cabinet text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ready to start your mornings right?
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-md leading-relaxed">
              Join hundreds of Mangalore families who trust Amruth Dairy for their daily milk. Fresh, pure, and on time — every day.
            </p>
            <button
              onClick={handleSubscribe}
              disabled={ctaLoading}
              className="inline-flex items-center gap-2 h-13 px-10 rounded-[12px] bg-white text-[#0f2e5c] font-bold text-[15px] hover:bg-yellow-400 transition-all duration-200 hover:scale-105 disabled:opacity-60 shadow-xl"
            >
              {ctaLoading
                ? <span className="w-5 h-5 border-2 border-[#0f2e5c]/30 border-t-[#0f2e5c] rounded-full animate-spin" />
                : <><Check size={16} strokeWidth={2.5} /> Start My Subscription</>}
            </button>
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/50 text-xs font-medium">
              <span className="flex items-center gap-1"><Check size={12} className="text-green-400" /> No lock-in period</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Skip any day</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Cancel anytime</span>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}