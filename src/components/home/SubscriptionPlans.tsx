'use client'

import Link from 'next/link'
import { Check, Milk } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const features = [
  '1 Litre Daily Fresh Delivery',
  'Flexible: Add extra or skip anytime',
  '100% Pure A2 Cow Milk',
  'No Hidden Charges',
  'Secure Online Payments'
]

export function SubscriptionPlans() {
  return (
    <section 
      id="plans" 
      className="bg-gradient-to-b from-[#F8FAFC] via-[#FDFBF7] to-white dark:from-[#0f1115] dark:via-[#171923] dark:to-[#0f1115] py-28 relative"
    >
      {/* Top Cream wave decoration */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-[#F8FAFC] dark:bg-[#0f1115]" />

      <div className="container-page relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center mb-16 flex flex-col items-center">
            <div className="inline-flex items-center bg-white dark:bg-warm-white border border-sky-500/15 text-sky-600 dark:text-sky-400 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest mb-4.5 shadow-[0_2px_6px_rgba(2,132,199,0.04)]">
              Standard Subscription
            </div>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium text-slate-950 dark:text-white tracking-tight leading-tight mb-4">
              One Simple Plan. Full Flexibility.
            </h2>
            <p className="text-sm sm:text-base text-slate-605 dark:text-brown-650 font-medium max-w-[500px] mx-auto">
              We believe in keeping things simple. A standard 1 Litre daily delivery, with complete freedom to adjust as needed.
            </p>
          </div>
        </ScrollReveal>

        {/* Single Wide Plan Card */}
        <ScrollReveal direction="up" delay={150} duration={900}>
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border-2 border-sky-500 relative flex flex-col md:flex-row items-stretch shadow-[0_20px_50px_rgba(2,132,199,0.08)] overflow-hidden">
            {/* Left/Top Side: Details & Pricing */}
            <div className="flex-1 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-slate-100 dark:border-border flex flex-col justify-center text-left">
              <div className="inline-flex bg-sky-600 dark:bg-sky-500 text-white text-[11px] font-extrabold uppercase px-4 py-1.5 rounded-full tracking-wider mb-6 w-fit shadow-[0_4px_12px_rgba(2,132,199,0.2)]">
                Standard Monthly
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center text-sky-600 dark:text-sky-450 flex-shrink-0">
                  <Milk size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white leading-none">1 Litre / Day</h3>
                </div>
              </div>

              <div className="flex items-baseline gap-2 my-8">
                <span className="text-5xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tighter leading-none font-mono-num">
                  ₹1,699
                </span>
                <span className="text-sm sm:text-base text-slate-600 dark:text-brown-600 font-bold uppercase tracking-widest">
                  / month
                </span>
              </div>

              <Link href="/subscribe" className="no-underline">
                <div className="w-full h-[60px] rounded-xl bg-gradient-to-b from-sky-400 to-sky-650 text-white font-bold text-base flex items-center justify-center border border-sky-650/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_8px_20px_rgba(3,105,161,0.25)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  Start Subscription
                </div>
              </Link>
            </div>

            {/* Right/Bottom Side: Features */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/40 p-8 sm:p-12 flex flex-col justify-center text-left">
              <h4 className="text-lg font-extrabold text-slate-950 dark:text-white mb-6">
                Everything you need
              </h4>
              <div className="flex flex-col gap-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                    <span className="text-sm sm:text-base text-slate-600 dark:text-brown-600 font-semibold">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
