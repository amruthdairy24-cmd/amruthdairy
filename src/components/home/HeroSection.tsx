'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Truck, MapPin, ArrowRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const slides = [
  { src: '/images/bg/hero-banner.png', mobileSrc: '/images/bg/mobile-banner-1.png', alt: 'Amruth Dairy Premium Farm Fresh Milk Bottles' },
  { src: '/images/bg/hero-banner-2.png', mobileSrc: '/images/bg/mobile-banner-2.png', alt: 'Amruth Dairy Fresh Cow and Milk' },
  { src: '/images/bg/hero-banner.png', mobileSrc: '/images/bg/mobile-banner-1.png', alt: 'Amruth Dairy Delicious Fresh Butter and Cheese' },
]

export function HeroSection() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    setIsMounted(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/api/customer/dashboard')
      .then(r => r.json())
      .then(d => setIsLoggedIn(d.success === true))
      .catch(() => setIsLoggedIn(false))
  }, [])

  function handleSubscribeClick() {
    if (isLoggedIn) {
      router.push('/onboarding')
    } else {
      router.push('/login?redirect=/onboarding')
    }
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* ── Background carousel ── */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-all duration-[1200ms] ',
              isMounted && currentSlide === index
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            )}
            aria-hidden={currentSlide !== index}
          >
            {/* Desktop Background */}
            <div 
              className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.src})` }}
            />
            {/* Mobile Background */}
            <div 
              className="block md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.mobileSrc || slide.src})` }}
            />
          </div>
        ))}
      </div>

      {/* ── White gradient: left → center (desktop) ── */}
      <div
        className="hidden md:block absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.85) 35%, rgba(255,255,255,0.3) 60%, transparent 100%)',
        }}
      />

      {/* ── White gradient: bottom → center (mobile) ── */}
      <div
        className="block md:hidden absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.90) 10%, rgba(255,255,255,0.4) 50%, transparent 100%)',
        }}
      />

      {/* ── Content ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-8 md:relative md:bottom-auto md:left-auto md:right-auto md:flex-1 md:flex md:items-center md:max-w-7xl md:mx-auto md:w-full md:px-8 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-10 items-center w-full">

          {/* LEFT: TEXT CONTENT */}
          <div className="flex flex-col items-start text-left">
            {/* Headline */}
            <h1 className="font-cabinet text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold  text-[#013378]  mb-4"
            >
              Fresh Milk delivered <br />
              <span className="relative inline-block text-yellow-400  font-bold">
                Before
                <svg
                  className="absolute left-0 -bottom-2 w-full"
                  viewBox="0 0 250 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 10
                     Q125 -2 250 10
                     L250 11
                     Q125 5 0 16
                     Z"
                    fill="#FFC72C"
                  />
                </svg>
              </span>
              {' '}
              <span className="font-bold">Sunrise.</span>
            </h1>

            {/* Subheading */}
            <p className="font-cabinet text-[10px] sm:text-[12px] text-gray-500 max-w-[320px] md:max-w-[500px] mb-6 font-normal">
              Pure Cow Milk delivered directly from our farm to your doorstep every morning.{' '}
              No preservatives. No compromise.
            </p>

            {/* Features */}
            {/* <div className="flex flex-row gap-4 md:gap-6 mb-7">
              {[
                { icon: <ShieldCheck size={15} />, line1: 'Pure &', line2: 'Natural' },
                { icon: <Truck size={15} />, line1: 'Daily Fresh', line2: 'Delivery' },
                { icon: <MapPin size={15} />, line1: 'Direct', line2: 'From Farm' },
              ].map(({ icon, line1, line2 }) => (
                <div key={line1} className="flex items-center gap-2 md:gap-2.5">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-200 flex items-center justify-center border border-sky-100/50 text-[#02429C] flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] md:text-[13px] font-extrabold text-black leading-none">{line1}</span>
                    <span className="text-[11px] md:text-[13px] font-extrabold text-black leading-none mt-0.5">{line2}</span>
                  </div>
                </div>
              ))}
            </div> */}

            {/* Actions */}
            <div className="flex flex-row gap-4 items-center">
              <button
                onClick={handleSubscribeClick}
                className="font-cabinet inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[10px] bg-[#02429C] text-white font-medium text-[15px] hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                Subscribe
                <ArrowRight size={16} strokeWidth={1.8} />
              </button>

              <Link
                href="#our-story"
                className="hidden sm:inline-flex items-center gap-3 bg-transparent font-bold text-xs tracking-wider uppercase group hover:scale-105 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-full border-[1.5px] border-sky-500 bg-white flex items-center justify-center text-sky-600 shadow-[0_2px_8px_rgba(2,132,199,0.05)] group-hover:bg-sky-50 transition-all flex-shrink-0">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-extrabold text-[#013378]">Watch Our Story</span>
                  <span className="text-[10px] font-medium text-[#013378] normal-case tracking-normal mt-0.5">Watch Reels</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide dots — desktop only ── */}
      <div className="hidden sm:flex absolute bottom-0 left-1/2 -translate-x-1/2 gap-2 z-20 mb-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={cn(
              'h-1 rounded-full border-none cursor-pointer transition-all duration-500',
              currentSlide === idx ? 'w-4 bg-sky-600' : 'w-2 bg-sky-600/25'
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </section>
  )
}