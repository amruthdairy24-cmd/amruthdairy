'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { OurStoryVideos } from '@/components/our-story/OurStoryVideos'

const PROCESS_STEPS = [
  { emoji: '🐄', title: 'Healthy Cows', desc: 'Pasture-fed cows raised with care and organic fodder.' },
  { emoji: '🥛', title: 'Morning Milking', desc: 'Hygienic milking using modern touch-free automation.' },
  { emoji: '🧪', title: 'Quality Testing', desc: 'Tested for purity and chilled instantly to preserve nutrients.' },
  { emoji: '🍼', title: 'Packing', desc: 'Sealed safely in clean eco-friendly bottles.' },
  { emoji: '🚚', title: 'Doorstep Delivery', desc: 'Delivered in temperature-controlled transit before sunrise.' }
]

export default function OurStoryPage() {
  
  // Hero Parallax Scroll
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "30%"])

  return (
    <>
      <Navbar />
      <main className="overflow-hidden bg-white">
        
        {/* 1. HERO SECTION */}
        <section ref={heroRef} className="relative h-[80vh] md:h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950">
          <motion.div
            style={{ y: heroY }}
            className="absolute inset-0 w-full h-full scale-110"
          >
            <Image
              src="/images/bg/hero-banner-2.png"
              alt="Cinematic Amruth Dairy farm banner"
              fill
              priority
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/60" />
          </motion.div>

          <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 text-white flex flex-col items-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div className="w-8 h-[1px] bg-white/45"></div>
              <span className="text-[11px] md:text-xs font-bold text-sky-300 uppercase tracking-widest">
                OUR STORY
              </span>
              <div className="w-8 h-[1px] bg-white/45"></div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-cabinet tracking-tight leading-tight mb-6"
            >
              Every Drop Has A Story.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-xl md:text-2xl text-white/80 max-w-2xl font-light font-cabinet leading-relaxed mb-10"
            >
              Fresh milk is more than a product.<br className="hidden sm:inline" />
              It is a promise we deliver every single morning.
            </motion.p>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-white/60 text-xs gap-1"
          >
            <span className="uppercase tracking-widest font-sans text-[9px] font-semibold">Scroll to discover</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronDown size={18} />
            </motion.div>
          </motion.div>
        </section>

        {/* 2. OUR BEGINNING */}
        <section className="py-16 md:py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left: Large Image */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] bg-slate-100"
              >
                <Image
                  src="/images/our-story-farm-fresh.png"
                  alt="Amruth Dairy Farm & cows"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
              </motion.div>

              {/* Right: Story content */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-start text-left"
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-[1px] bg-sky-200"></div>
                  <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest">
                    OUR BEGINNING
                  </span>
                </div>

                {/* Heading */}
                <h2 className="text-3xl sm:text-4xl md:text-[40px] font-bold text-black font-cabinet leading-tight tracking-tight mb-6">
                  A Vision of Absolute Purity.
                </h2>

                {/* Content */}
                <div className="space-y-5 text-gray-600 text-sm sm:text-[15px] leading-[1.8] font-sans">
                  <p>
                    Our small dream of starting a cow farm began in 2023. Stepping out of the corporate world and into business was a big decision, but following our dream was always the goal.
                  </p>

                  {/* Highlighted promise block */}
                  <div className="border-l-4 border-[#02429C] pl-4 py-1 bg-blue-50/50 rounded-r-xl">
                    <p className="text-gray-700">
                      With the unwavering support of our family, we started our farm, <strong className="text-gray-900">&ldquo;Amruth Dairy,&rdquo;</strong> with one simple promise: <strong className="text-[#02429C]">Purity is Our Priority</strong>—bringing fresh milk directly from our farm to your family.
                    </p>
                  </div>

                  <p>
                    Dreaming is easy, but giving your 100% to make that dream a reality is what true passion is all about. Our dedication, hard work, and commitment to learning have brought us to where we are today.
                  </p>

                  {/* Divider */}
                  <div className="w-12 h-[1.5px] bg-sky-200 my-1" />

                  <p className="text-gray-500 italic text-sm sm:text-[14px] leading-[1.85]">
                    We are truly grateful to have such wonderful customers who have trusted, supported, and encouraged us throughout this journey. Your love and faith in us inspire us to keep delivering the very best. We will always be thankful for your support.
                  </p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>



        {/* 5. PROCESS SECTION */}
        <section className="py-16 md:py-20 bg-[#F8FAFC] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-[1px] bg-sky-200"></div>
                <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest">
                  OUR PROCESS
                </span>
                <div className="w-8 h-[1px] bg-sky-200"></div>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-4">
                From Farm to Your Home
              </h2>
              <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Step-by-step transparency from the organic farm till our early-morning doorstep drop-off.
              </p>
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 max-w-7xl mx-auto relative px-4">
              {PROCESS_STEPS.map((step, idx) => {
                const isLast = idx === PROCESS_STEPS.length - 1
                return (
                  <div key={step.title} className="relative w-full flex flex-col items-center">
                    {/* Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.12 }}
                      className="relative flex flex-col items-center text-center p-6 bg-white border border-slate-100 rounded-[24px] w-full max-w-[280px] h-[210px] shadow-[0_4px_18px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_28px_rgba(2,66,156,0.04)] transition-all duration-300"
                    >
                      <span className="text-4xl mb-4 select-none">{step.emoji}</span>
                      <h3 className="text-sm font-bold font-cabinet text-black mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                        {step.desc}
                      </p>
                    </motion.div>

                    {/* Connection Arrow (Desktop) */}
                    {!isLast && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.12 + 0.08 }}
                        className="hidden lg:flex absolute left-[100%] top-1/2 -translate-y-1/2 w-8 justify-center z-20 text-[#02429C] font-extrabold"
                      >
                        <span className="text-xl">➔</span>
                      </motion.div>
                    )}

                    {/* Connection Arrow (Mobile) */}
                    {!isLast && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.12 + 0.08 }}
                        className="flex lg:hidden justify-center my-3 text-[#02429C] font-extrabold"
                      >
                        <span className="text-xl">⬇</span>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </section>

        {/* 6. VIDEOS GALLERY */}
        <OurStoryVideos />

        {/* 7. MISSION SECTION */}
        <section className="pt-0 pb-16 md:pt-0 md:pb-20 bg-white relative overflow-hidden">
          {/* Decorative blur shadow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-100 rounded-full filter blur-[100px] opacity-35 pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
            <div className="w-12 h-[1px] bg-[#02429C] mb-8" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-8">
              Our Mission
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 font-light font-cabinet leading-relaxed max-w-3xl">
              “To provide every family with fresh, healthy milk while maintaining the highest standards of hygiene, sustainability and customer care.”
            </p>
            <div className="w-12 h-[1px] bg-[#02429C] mt-8" />
          </div>
        </section>

        {/* 8. CTA SECTION */}
        <section className="pt-0 pb-16 md:pt-0 md:pb-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#02429C] via-[#013b8f] to-[#013378] py-16 md:py-24 px-6 md:px-12 text-center text-white shadow-[0_20px_50px_rgba(2,66,156,0.15)]"
            >
              {/* Blur elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full filter blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6 select-none">
                  <Sparkles size={12} className="text-yellow-400" /> Start Your Morning Fresh
                </span>
                
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold font-cabinet leading-tight tracking-tight mb-6">
                  Join the Amruth Family
                </h2>
                
                <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto font-light font-sans mb-10 leading-relaxed">
                  Experience pure, fresh milk delivered early morning. Zero preservatives. Zero compromises on wellness.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/login?redirect=/onboarding"
                    className="w-full sm:w-auto font-cabinet inline-flex items-center justify-center gap-2 h-12 px-8 rounded-[12px] bg-white text-[#02429C] font-semibold text-[15px] hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer"
                  >
                    Subscribe Today
                    <ArrowRight size={16} strokeWidth={2} />
                  </Link>
                  
                  <Link
                    href="/#products"
                    className="w-full sm:w-auto font-cabinet inline-flex items-center justify-center gap-2 h-12 px-8 rounded-[12px] bg-transparent border-[1.5px] border-white/45 text-white font-semibold text-[15px] hover:bg-white/10 hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    Explore Products
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
