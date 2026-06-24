'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, ShieldCheck, Truck, Users, Droplet, MapPin, Sparkles, ArrowRight, Play } from 'lucide-react'
import { TransparentImage } from '@/components/ui/TransparentImage'
import { cn } from '@/lib/utils'

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  const slides = [
    {
      src: '/images/image-hero.png',
      alt: 'Amruth Dairy Fresh Cow and Milk'
    },
    {
      src: '/images/cutout-2.png',
      alt: 'Amruth Dairy Premium Farm Fresh Milk Bottles'
    },
    {
      src: '/images/cutout-3.png',
      alt: 'Amruth Dairy Delicious Fresh Butter and Cheese'
    }
  ]

  useEffect(() => {
    setIsMounted(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000) // Transition slide every 6 seconds
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <section 
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-28 pb-40 md:pb-48 bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-white dark:from-[#0f1115] dark:via-[#171923] dark:to-[#0f1115]"
    >
      {/* Sky/Cloud background texture behind the cow on the right */}
      <div 
        className="absolute top-0 right-0 w-[55%] h-[80%] opacity-60 pointer-events-none bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.8)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_60%_40%,rgba(23,25,35,0.8)_0%,transparent_70%)]"
      />

      <div className="container-page relative z-10 w-full mb-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-10 items-center text-center md:text-left">
          
          {/* LEFT: TEXT CONTENT */}
          <div className="z-10 flex flex-col items-center md:items-start">
            {/* Tag/Badge */}
            <div className="inline-flex items-center gap-1.5 border border-sky-500/12 bg-white dark:bg-warm-white dark:border-border rounded-full px-4 py-1.5 text-sky-600 dark:text-sky-400 text-xs font-extrabold uppercase tracking-widest mb-7 shadow-[0_2px_6px_rgba(2,132,199,0.04)]">
              <ShieldCheck size={14} />
              100% Pure • Farm Fresh
            </div>

            {/* Headline */}
            <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-slate-950 dark:text-white leading-none tracking-tight mb-6">
              Fresh Milk <br />
              Delivered <br />
              <span className="text-sky-600 dark:text-sky-400 font-bold">Before Sunrise.</span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-brown-600 leading-relaxed max-w-[520px] mb-9 font-normal">
              Pure A2 Cow Milk delivered directly from our farm to your doorstep every morning. No preservatives. No compromise.
            </p>

            {/* Features (Elegant horizontal line style) */}
            <div className="flex flex-wrap gap-6 mb-11 justify-center md:justify-start">
              {/* Feature 1 */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center border border-sky-100/50 dark:border-sky-900/20">
                  <ShieldCheck size={18} className="text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white leading-none">Pure &</span>
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white leading-none mt-0.5">Natural</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center border border-sky-100/50 dark:border-sky-900/20">
                  <Truck size={18} className="text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white leading-none">Daily Fresh</span>
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white leading-none mt-0.5">Delivery</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center border border-sky-100/50 dark:border-sky-900/20">
                  <MapPin size={18} className="text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white leading-none">Direct</span>
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white leading-none mt-0.5">From Farm</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start">
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-b from-sky-400 to-sky-650 text-white font-medium text-[15px] border border-sky-650/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_rgba(3,105,161,0.2)] hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                Subscribe
                <ArrowRight size={16} strokeWidth={1.8} />
              </Link>

              {/* Watch story link */}
              <Link
                href="#our-story"
                className="inline-flex items-center gap-3 h-13 bg-transparent text-slate-950 dark:text-white font-bold text-xs tracking-wider uppercase group hover:scale-105 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-full border-[1.5px] border-sky-500 bg-white dark:bg-warm-white flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-[0_2px_8px_rgba(2,132,199,0.05)] group-hover:bg-sky-50 dark:group-hover:bg-sky-950/20 transition-all">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
                <div className="flex flex-col items-flex-start text-left leading-tight">
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white">Watch Our Story</span>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-brown-600 normal-case tracking-normal mt-0.5">Watch Reels</span>
                </div>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN SPACER FOR DESKTOP ABSOLUTE POSITIONING */}
          <div className="hidden md:block" />

        </div>
      </div>

      {/* ABSOLUTE POSITIONED GIANT IMAGE SHOWCASE - BLEEDS TO RIGHT OF SCREEN */}
      <div className="relative md:absolute w-full md:w-[46vw] h-[480px] md:h-[700px] right-0 md:right-5 bottom-0 md:bottom-[115px] flex items-end justify-center md:justify-end overflow-visible z-2 pointer-events-none max-w-lg md:max-w-none mx-auto md:mx-0">
        {/* Render both cutout images with butter smooth slider transitions */}
        {slides.map((slide, index) => {
          const isActive = currentSlide === index
          return (
            <div
              key={index}
              className={cn(
                'absolute top-0 left-0 w-full h-full flex items-end justify-end transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                isActive && isMounted 
                  ? 'opacity-100 translate-x-0 scale-100 z-2' 
                  : 'opacity-0 translate-x-[50px] scale-95 z-1 pointer-events-none'
              )}
            >
              <TransparentImage 
                src={slide.src} 
                alt={slide.alt}
                className="w-full h-full max-h-[480px] md:max-h-[700px] pointer-events-auto"
              />
            </div>
          )
        })}

        {/* Floating Tomorrow Delivery Card */}
        <div className="absolute bottom-[20px] left-[20px] md:bottom-[70px] md:left-[60px] z-12 bg-white dark:bg-warm-white dark:border-border border border-slate-950/4 rounded-brand-lg p-4 md:py-4 md:px-6 flex items-center gap-3.5 shadow-card pointer-events-auto">
          <div className="w-11 h-11 rounded-full bg-sky-50 dark:bg-sky-950/20 flex items-center justify-center">
            <Clock size={20} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-600 dark:text-brown-600">Tomorrow Delivery</span>
            <span className="text-xl font-black text-slate-950 dark:text-white leading-tight mt-0.5">6:00 AM</span>
            <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider mt-0.5">Before Sunrise</span>
          </div>
        </div>

        {/* Slide Indicators / Dots */}
        <div className="absolute bottom-[15px] left-1/2 -translate-x-1/2 flex gap-2 z-15 pointer-events-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                'h-2 rounded-full border-none cursor-pointer transition-all duration-500 p-0',
                currentSlide === idx 
                  ? 'w-6 bg-sky-600 dark:bg-sky-400' 
                  : 'w-2 bg-sky-600/25 dark:bg-sky-400/20'
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* SVG Milk Curve Wave Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] rotate-180 z-5">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative display-block w-[calc(100%+1.3px)] h-[90px]">
          <path d="M0,0 C150,90 350,10 600,70 C850,120 1050,40 1200,0 L1200,120 L0,120 Z" className="fill-cream-50"></path>
        </svg>
      </div>

      {/* FLOATING STATS BAR */}
      <div className="relative md:absolute bottom-auto md:bottom-6 left-auto md:left-1/2 md:-translate-x-1/2 w-full md:w-[90%] max-w-[1100px] bg-white dark:bg-warm-white rounded-brand-xl p-6 md:py-6 md:px-10 shadow-card border border-slate-950/4 dark:border-border z-20 mt-10 md:mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Stat 1 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-600 dark:bg-sky-500 flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black text-slate-950 dark:text-white leading-tight">5000+</span>
              <span className="text-xs font-bold text-slate-600 dark:text-brown-600 mt-0.5">Happy Families</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-550 dark:bg-sky-400 flex items-center justify-center flex-shrink-0">
              <Droplet size={22} className="text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black text-slate-950 dark:text-white leading-tight">100%</span>
              <span className="text-xs font-bold text-slate-600 dark:text-brown-600 mt-0.5">Pure Milk</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-600 dark:bg-sky-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black text-slate-950 dark:text-white leading-tight">50+</span>
              <span className="text-xs font-bold text-slate-600 dark:text-brown-600 mt-0.5">Healthy Cows</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-550 dark:bg-sky-400 flex items-center justify-center flex-shrink-0">
              <Truck size={22} className="text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black text-slate-950 dark:text-white leading-tight">Daily</span>
              <span className="text-xs font-bold text-slate-600 dark:text-brown-600 mt-0.5">On-Time Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}