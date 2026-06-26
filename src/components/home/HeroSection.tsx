'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, ShieldCheck, Truck, MapPin, ArrowRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const slides = [
  { src: '/images/bg/amruthmilk-og-banner.png', alt: 'Amruth Dairy Premium Farm Fresh Milk Bottles' },
  { src: '/images/bg/amruthmilk-og-banner.png', alt: 'Amruth Dairy Fresh Cow and Milk' },
  { src: '/images/bg/amruthmilk-og-banner.png', alt: 'Amruth Dairy Delicious Fresh Butter and Cheese' },
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col overflow-hidden py-38"
    >
      {/* ── Background carousel ── */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[1200ms] ',
              isMounted && currentSlide === index
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            )}
            style={{ backgroundImage: `url(${slide.src})` }}
            aria-hidden={currentSlide !== index}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-8 md:relative md:bottom-auto md:left-auto md:right-auto md:flex-1 md:flex md:items-center md:max-w-7xl md:mx-auto md:w-full md:px-8 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-10 items-center w-full">

          {/* LEFT: TEXT CONTENT */}
          <div className="flex flex-col items-start text-left">

            {/* Badge */}
            {/* <div className="inline-flex items-center gap-1.5 px-2 py-1 text-yellow-500 bg-white rounded-[5px] text-[10px] shadow-sm tracking-widest mb-4 s">
              <ShieldCheck size={14} />
              100% Pure • Farm Fresh
            </div> */}

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold  text-[#ffff]  leading-[1.05] tracking-tight mb-4">
              <span className='text-[#FFC72C] drop-shadow-md'>Fresh Milk</span> Delivered <br />
              <span className="relative inline-block text-white font-bold">
                Before
                <svg
                  className="absolute left-0 -bottom-2 w-full"
                  viewBox="0 0 250 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="
      M0 10
      Q125 -2 250 10
      L250 11
      Q125 5 0 16
      Z
    "
                    fill="#FFC72C"
                  />
                </svg>
              </span>
              {' '}
              <span className="text-yellow-400 font-bold">Sunrise.</span>
            </h1>

            {/* Subheading */}
            <p className="text-[10px] sm:text-[12px] text-gray-700 max-w-[320px] md:max-w-[500px] mb-6 font-normal">
              Pure A2 Cow Milk delivered directly from our farm to your doorstep every morning.{' '}
              No preservatives. No compromise.
            </p>

            {/* Features */}
            <div className="flex flex-row gap-4 md:gap-6 mb-7">
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
            </div>

            {/* Actions */}
            <div className="flex flex-row gap-4 items-center">
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[10px] bg-[#02429C] text-white font-medium text-[15px]  hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                Subscribe
                <ArrowRight size={16} strokeWidth={1.8} />
              </Link>

              <Link
                href="#our-story"
                className="hidden sm:inline-flex items-center gap-3 bg-transparent font-bold text-xs tracking-wider uppercase group hover:scale-105 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-full border-[1.5px] border-sky-500 bg-white flex items-center justify-center text-sky-600 shadow-[0_2px_8px_rgba(2,132,199,0.05)] group-hover:bg-sky-50 transition-all flex-shrink-0">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-extrabold text-white">Watch Our Story</span>
                  <span className="text-[10px] font-medium text-white/70 normal-case tracking-normal mt-0.5">Watch Reels</span>
                </div>
              </Link>
            </div>

            {/* Slide dots — mobile only */}
            <div className="flex md:hidden justify-center gap-2 mt-4 w-full">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    'h-2 rounded-full border-none cursor-pointer transition-all duration-500 p-0',
                    currentSlide === idx ? 'w-6 bg-sky-600' : 'w-2 bg-sky-600/25'
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN SPACER */}
          <div className="hidden md:block" />
        </div>
      </div>

      {/* ── Slide dots — desktop only ── */}
      <div className="hidden md:flex absolute bottom-[160px] left-1/2 -translate-x-1/2 gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={cn(
              'h-2 rounded-full border-none cursor-pointer transition-all duration-500 p-0',
              currentSlide === idx ? 'w-6 bg-sky-600' : 'w-2 bg-sky-600/25'
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* ── Floating delivery card — desktop only ── */}
      {/* <div className="hidden md:flex absolute bottom-[130px] right-[calc(50%-540px)] z-20 bg-white border border-slate-950/4 rounded-brand-lg py-4 px-6 items-center gap-3.5 shadow-card">
        <div className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center">
          <Clock size={20} className="text-sky-600" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-600">Tomorrow Delivery</span>
          <span className="text-xl font-black text-slate-950 leading-tight mt-0.5">6:00 AM</span>
          <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider mt-0.5">Before Sunrise</span>
        </div>
      </div> */}
    </section>
  )
}