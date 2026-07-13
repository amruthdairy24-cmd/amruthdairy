'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Play } from 'lucide-react'
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
      className="relative min-h-[66vh] md:min-h-screen flex flex-col overflow-hidden"
    >
      {/* ── Background carousel (mobile & desktop) ── */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-all duration-[1200ms]',
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

      {/* ── White gradient: left → center (mobile) ── */}
      <div
        className="block md:hidden absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.15) 75%, transparent 100%)',
        }}
      />

      {/* ── Mobile Content (visible only on mobile) ── */}
      <div className="md:hidden relative z-10 flex flex-col justify-center min-h-[66vh] pt-20 pb-10 px-5">
        <div className="flex flex-col items-start text-left max-w-[280px]">
          {/* Headline */}
          <h1 className="font-cabinet text-[28px] font-extrabold text-[#013378] mb-2 leading-[1.18]">
            Fresh Milk<br />
            Delivered<br />
            <span className="relative inline-block text-yellow-400 font-extrabold whitespace-nowrap">
              Before
              <svg
                className="absolute left-0 -bottom-1 w-full h-1.5"
                viewBox="0 0 100 8"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path d="M0 4 Q50 0 100 4 L100 5 Q50 2 0 6 Z" fill="#FFC72C" />
              </svg>
            </span>
            <br />
            <span className="font-extrabold text-[#013378]">Sunrise.</span>
          </h1>

          {/* Tagline */}
          <p className="font-cabinet text-[10.5px] text-gray-500 leading-relaxed mb-4 max-w-[210px] font-normal">
            Pure cow milk delivered directly from our farm to your doorstep every morning.
            No preservatives. No compromise.
          </p>

          {/* Subscribe Today button */}
          <button
            onClick={handleSubscribeClick}
            id="mobile-hero-subscribe"
            className="font-cabinet inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-[10px] bg-[#02429C] text-white font-semibold text-[13px] transition-all duration-200 cursor-pointer mb-3.5 shadow-md hover:shadow-lg hover:scale-105"
          >
            Subscribe Today
            <ArrowRight size={14} strokeWidth={2.2} />
          </button>

          {/* Watch Our Story */}
          <Link
            href="#our-story"
            id="mobile-hero-watch-story"
            className="inline-flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full border-[1.5px] border-sky-400 bg-white flex items-center justify-center text-sky-500 shadow-sm group-hover:bg-sky-50 transition-all flex-shrink-0">
              <Play size={10} fill="currentColor" className="ml-0.5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11.5px] font-extrabold text-[#013378]">Watch Our Story</span>
              <span className="text-[9px] font-medium text-gray-400 mt-0.5">30 sec reel</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Desktop Content (visible only on desktop) ── */}
      <div className="hidden md:flex absolute bottom-0 left-0 right-0 z-10 relative flex-1 items-center max-w-7xl mx-auto w-full px-8">
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-10 items-center w-full">

          {/* LEFT: text */}
          <div className="flex flex-col items-start text-left">
            <h1 className="font-cabinet text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#013378] mb-4">
              Fresh Milk Delivered <br />
              <span className="relative inline-block text-yellow-400 font-extrabold">
                Before
                <svg
                  className="absolute left-0 -bottom-2 w-full"
                  viewBox="0 0 250 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 10 Q125 -2 250 10 L250 11 Q125 5 0 16 Z"
                    fill="#FFC72C"
                  />
                </svg>
              </span>
              {' '}
              <span className="font-bold font-extrabold">Sunrise.</span>
            </h1>

            <p className="font-cabinet text-[12px] text-gray-500 max-w-[500px] mb-6 font-normal">
              Pure Cow Milk delivered directly from our farm to your doorstep every morning.{' '}
              No preservatives. No compromise.
            </p>

            <div className="flex flex-row gap-4 items-center">
              <button
                onClick={handleSubscribeClick}
                id="desktop-hero-subscribe"
                className="font-cabinet inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[10px] bg-[#02429C] text-white font-medium text-[15px] hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                Subscribe Today
                <ArrowRight size={16} strokeWidth={1.8} />
              </button>

              <Link
                href="#our-story"
                id="desktop-hero-watch-story"
                className="inline-flex items-center gap-3 bg-transparent font-bold text-xs tracking-wider uppercase group hover:scale-105 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-full border-[1.5px] border-sky-500 bg-white flex items-center justify-center text-sky-600 shadow-[0_2px_8px_rgba(2,132,199,0.05)] group-hover:bg-sky-50 transition-all flex-shrink-0">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-extrabold text-[#013378]">Watch Our Story</span>
                  <span className="text-[10px] font-medium text-[#013378] normal-case tracking-normal mt-0.5">30 sec reel</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide dots — desktop only ── */}
      <div className="hidden md:flex absolute bottom-0 left-1/2 -translate-x-1/2 gap-2 z-20 mb-10">
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

      {/* ── Mobile Wavy bottom divider (visible on mobile only) ── */}
      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-10 pointer-events-none md:hidden" />
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none md:hidden">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C150,90 350,90 500,40 C650,-10 850,-10 1000,40 C1150,90 1350,90 1440,40 L1440,120 L0,120 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* ── Desktop Wavy bottom divider (visible on desktop only) ── */}
      <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-white z-10 pointer-events-none hidden md:block" />
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none hidden md:block">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-[50px] lg:h-[70px] block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C150,110 350,110 500,85 C650,60 850,65 1000,90 C1150,110 1350,110 1440,95 L1440,120 L0,120 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </svg>
      </div>

    </section>
  )
}
