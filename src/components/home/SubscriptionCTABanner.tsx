'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SubscriptionCTABanner() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/customer/dashboard')
      .then(r => r.json())
      .then(d => setIsLoggedIn(d.success === true))
      .catch(() => setIsLoggedIn(false))
  }, [])

  function handleClick() {
    if (isLoggedIn) {
      router.push('/onboarding')
    } else {
      router.push('/login?redirect=/onboarding')
    }
  }

  return (
    <>
      {/* ── Mobile CTA banner (hidden on md+) ── */}
      <section className="md:hidden px-4 pb-6 bg-white">
        <div
          id="mobile-subscription-cta"
          className="relative flex flex-row items-center justify-between rounded-2xl overflow-hidden pl-28 pr-4 py-4 min-h-[110px] shadow-sm"
          style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)', border: '1px solid #BFDBFE' }}
        >
          {/* Left: Amruth milk can image absolute positioned flush with bottom/left */}
          <div className="absolute left-0 bottom-0 w-28 h-[100%] pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/mobile_can_splash.png"
              alt="Amruth milk can"
              className="w-full h-full object-contain object-left-bottom"
            />
          </div>

          {/* Middle/Content: Text */}
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-cabinet text-[15px] font-extrabold text-[#013378] leading-tight mb-1">
              Start Your Daily<br />Milk Subscription
            </h3>
            <p className="text-[10px] text-gray-500 leading-snug mb-2.5">
              Choose your plan and enjoy fresh milk delivered daily.
            </p>
            {/* Easy • Flexible • Hassle Free tag */}
            <div className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
              <span className="text-[9.5px] font-semibold text-gray-500">
                Easy &bull; Flexible &bull; Hassle Free
              </span>
            </div>
          </div>

          {/* Right: Arrow button */}
          <button
            onClick={handleClick}
            id="mobile-cta-arrow"
            aria-label="Start Subscription"
            className="flex-shrink-0 w-11 h-11 rounded-full bg-[#02429C] flex items-center justify-center text-white shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <ArrowRight size={20} strokeWidth={2.2} />
          </button>
        </div>
      </section>
    </>
  )
}
