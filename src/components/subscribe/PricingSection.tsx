'use client'

import { useState, useEffect, ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sparkles, CheckCircle2, ArrowRight, User, Users,
  Home, Star
} from 'lucide-react'
import { fetchMilkPricesClient, calculateDailyRate, getDaysInMonth } from '@/lib/billing'
import { cn } from '@/lib/utils'

export interface PlanItem {
  litres: number
  label: string
  tag: string
  desc: string
  highlight?: boolean
  icon: ComponentType<{ className?: string }>
  colorTheme: {
    iconBg: string
    iconColor: string
    tagColor: string
    btnStyle: string
  }
}

export const PLANS: PlanItem[] = [
  {
    litres: 0.5,
    label: '½ Litre / Day',
    tag: 'SOLO',
    desc: 'Perfect for a single person',
    icon: User,
    colorTheme: {
      iconBg: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-600',
      tagColor: 'text-emerald-600',
      btnStyle: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80',
    },
  },
  {
    litres: 1.0,
    label: '1 Litre / Day',
    tag: 'POPULAR',
    desc: 'Ideal for a small family',
    highlight: true,
    icon: Users,
    colorTheme: {
      iconBg: 'bg-sky-50 border-sky-100',
      iconColor: 'text-[#02429C]',
      tagColor: 'text-[#0284C7]',
      btnStyle: 'bg-[#02429C] hover:bg-[#0F2E5C] text-white shadow-sm shadow-[#02429C]/20',
    },
  },
  {
    litres: 1.5,
    label: '1½ Litres / Day',
    tag: 'FAMILY',
    desc: 'Great for 3–4 members',
    icon: Users,
    colorTheme: {
      iconBg: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-600',
      tagColor: 'text-purple-600',
      btnStyle: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80',
    },
  },
  {
    litres: 2.0,
    label: '2 Litres / Day',
    tag: 'LARGE',
    desc: 'For larger households',
    icon: Home,
    colorTheme: {
      iconBg: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-600',
      tagColor: 'text-amber-600',
      btnStyle: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80',
    },
  },
]

export interface PricingSectionProps {
  onSubscribe?: (planType?: string) => void
  milkPrices?: Record<string, number>
  priceLoading?: boolean
  className?: string
  id?: string
}

export function PricingSection({
  onSubscribe,
  milkPrices: propsMilkPrices,
  priceLoading: propsPriceLoading,
  className,
  id = 'plans',
}: PricingSectionProps) {
  const router = useRouter()
  const [internalPrices, setInternalPrices] = useState<Record<string, number>>({})
  const [internalLoading, setInternalLoading] = useState(true)

  const prices = propsMilkPrices ?? internalPrices
  const isLoading = propsPriceLoading ?? internalLoading

  useEffect(() => {
    if (propsMilkPrices === undefined) {
      async function loadPrices() {
        setInternalLoading(true)
        const fetched = await fetchMilkPricesClient()
        setInternalPrices(fetched)
        setInternalLoading(false)
      }
      loadPrices()
    }
  }, [propsMilkPrices])

  const handleDefaultSubscribe = async (planType?: string) => {
    if (onSubscribe) {
      onSubscribe(planType)
      return
    }
    const targetPath = planType === 'trial' ? '/onboarding?trial=true' : '/onboarding'
    try {
      const res = await fetch('/api/customer/dashboard')
      const data = await res.json()
      if (data.success) {
        router.push(targetPath)
      } else {
        router.push(`/login?redirect=${encodeURIComponent(targetPath)}`)
      }
    } catch {
      router.push(`/login?redirect=${encodeURIComponent(targetPath)}`)
    }
  }

  const getMonthlyEstimate = (litres: number) => {
    if (isLoading || !Object.keys(prices).length) return null
    const daily = calculateDailyRate(litres, prices)
    const now = new Date()
    const days = getDaysInMonth(now.getFullYear(), now.getMonth() + 1)
    return Math.round(daily * days)
  }

  const getDaily = (litres: number) => {
    if (isLoading || !Object.keys(prices).length) return null
    return calculateDailyRate(litres, prices)
  }

  // Calculate 3-day trial price estimate for 1L/day
  const trialDailyRate = isLoading || !Object.keys(prices).length ? null : calculateDailyRate(1.0, prices)
  const trialTotal = trialDailyRate ? Math.round(trialDailyRate * 3) : null

  return (
    <section className={cn('py-10 px-4 sm:px-5 bg-[#F8FAFC]', className)} id={id}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-7">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-100/70 border border-sky-200 text-[#0284C7] text-[10px] font-extrabold tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3 h-3 text-[#0284C7]" />
            FRESH MILK, DELIVERED DAILY
          </span>
          <h2 className="font-cabinet text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F2E5C] mt-1.5">
            Choose Your Perfect Plan
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
            100% pure cow milk delivered fresh to your door before 7 AM.
          </p>
        </div>

        {/* Layout Grid: Left (Large Trial Box) + Right (2x2 Grid for 4 Plans) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-4.5 items-stretch">

          {/* ══════════════════════════════════════════════════════════
              LEFT SIDE: 3-DAY TRIAL PACK (COMPACT HIGH-CONTRAST CARD)
          ══════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="relative flex flex-col justify-center gap-15 h-full rounded-xl p-4.5 sm:p-5 bg-[#003875] text-white shadow-lg shadow-[#003875]/15 border border-[#003875] overflow-hidden group min-h-[400px]">
              
              {/* Bottom Farm Landscape Image */}
              <div className="absolute inset-x-0 bottom-0 h-[180px] sm:h-[195px] overflow-hidden pointer-events-none z-0">
                <img
                  src="/images/trial_farm_landscape_bottom.png"
                  alt="Farm Landscape"
                  className="w-full h-full object-cover object-bottom"
                />
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#003875] to-transparent pointer-events-none" />
              </div>

              <div className="relative z-10">
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-400 text-[#003875] text-[9px] font-black tracking-wider uppercase shadow-sm">
                
                    3-DAY TRIAL PACK
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/90 bg-[#002754] px-2 py-0.5 rounded border border-white/20">
                    RISK FREE
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-cabinet font-bold text-xl sm:text-2xl text-white mb-4 leading-tight">
                  Try Fresh Farm Milk for 3 Days
                </h3>

                {/* White Pricing Box */}
                <div className="bg-white rounded-lg p-3 text-[#003875] shadow-sm mb-3.5">
                  <div className="text-[9px] font-extrabold text-[#0284C7] uppercase tracking-wider mb-0.5">
                    SPECIAL INTRO PRICE
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-cabinet text-2xl sm:text-3xl font-extrabold text-[#003875]">
                      {isLoading ? '...' : `₹${trialTotal ?? '240'}`}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      / 3 days (1L / day)
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                    {isLoading ? 'Calculating...' : `Just ₹${trialDailyRate?.toFixed(2) ?? '80.00'}/day · Auto-ends after 3 days`}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5 text-[11px] text-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/20" />
                    <span><strong>Delivered before 7 AM</strong> from farm</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/20" />
                    <span><strong>No auto-renewal</strong> – zero hidden fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/20" />
                    <span><strong>100% Pure Milk</strong> – 0 preservatives</span>
                  </li>
                </ul>
              </div>

              {/* Bottom CTA Button over Farm Scenery */}
              <div className="relative z-10 pt-3">
                <button
                  onClick={() => handleDefaultSubscribe('trial')}
                  className="w-full h-9.5 rounded-lg bg-[#0f2e5c] cursor-pointer hover:bg-[#0f3e5b] text-white font-bold text-md flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] shadow-md active:scale-[0.98]"
                >
                  <span>Start 3 Day Trial</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT SIDE: 4 MONTHLY PLANS (2 BOXES PER ROW ON MOBILE)
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4">
            {PLANS.map(({ litres, label, tag, desc, highlight, icon: Icon, colorTheme }, index) => {
              const monthly = getMonthlyEstimate(litres)
              const daily = getDaily(litres)
              return (
                <motion.div
                  key={litres}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className={cn(
                    'relative flex flex-col justify-between rounded-xl border bg-white p-3 sm:p-4.5 transition-all duration-200 hover:shadow-sm',
                    highlight
                      ? 'border-2 border-[#02429C] shadow-md shadow-[#02429C]/10'
                      : 'border-slate-200/90 hover:border-slate-300'
                  )}
                >
                  {highlight && (
                    <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#02429C] text-white text-[7.5px] sm:text-[9px] font-extrabold tracking-wider uppercase flex items-center gap-0.5 sm:gap-1 shadow-sm">
                      <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-white" />
                      POPULAR
                    </div>
                  )}

                  <div>
                    {/* Icon Box */}
                    <div className={cn('w-7 h-7 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center mb-1.5 sm:mb-2', colorTheme.iconBg)}>
                      <Icon className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', colorTheme.iconColor)} />
                    </div>

                    <div className={cn('text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest mb-0.5', colorTheme.tagColor)}>
                      {tag}
                    </div>
                    <div className="font-cabinet font-bold text-xs sm:text-lg text-[#0F2E5C] leading-tight mb-0.5">
                      {label}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 mb-1.5 sm:mb-2 leading-tight sm:leading-relaxed">
                      {desc}
                    </div>
                  </div>

                  <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100">
                    <div className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mb-0">
                      {isLoading ? 'Loading...' : `₹${daily?.toFixed(2) ?? '—'} / day`}
                    </div>
                    <div className="font-cabinet text-lg sm:text-2xl font-extrabold text-[#0F2E5C]">
                      {isLoading ? (
                        <span className="text-[10px] sm:text-xs font-medium opacity-50">Calculating...</span>
                      ) : (
                        <>
                          ₹{monthly?.toLocaleString() ?? '—'}
                          <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 ml-0.5">/mo</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleDefaultSubscribe(litres.toString())}
                      className={cn(
                        'mt-2 sm:mt-2.5 w-full h-8 sm:h-9 rounded-lg text-[10px] sm:text-xs cursor-pointer font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                        colorTheme.btnStyle
                      )}
                    >
                      Subscribe
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
