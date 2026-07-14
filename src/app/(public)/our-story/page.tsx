'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Heart,
  ShieldCheck,
  Leaf,
  UsersRound,
  ArrowRight,
  ChevronDown,
  X,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const TIMELINE_DATA = [
  { year: '2020', title: 'The Beginning', desc: 'Started with a handful of healthy cows and a dream to bring pure milk directly to families.' },
  { year: '2021', title: 'Daily Deliveries Began', desc: 'Launched daily delivery routes across neighborhoods to ensure fresh mornings for early customers.' },
  { year: '2022', title: '100 Happy Families', desc: 'Built a foundation of trust, delivering 100% pure, farm-fresh milk to over 100 households.' },
  { year: '2023', title: 'Expanded Our Dairy Farm', desc: 'Upgraded our pastures and facilities to incorporate modern automated, hygienic milking systems.' },
  { year: '2024', title: 'Subscription Model', desc: 'Introduced automatic monthly subscription plans to make morning milk delivery effortless.' },
  { year: 'Today', title: 'Serving Hundreds', desc: 'Delivering nutrition and pure dairy goodness to hundreds of homes before sunrise every day.' }
]

const VALUES = [
  { icon: Heart, title: 'Healthy Cows', desc: 'Happy, pasture-fed cows produce naturally nutritious and tasty milk.', color: 'text-rose-500 bg-rose-50' },
  { icon: ShieldCheck, title: 'Quality First', desc: 'Every batch is rigorously tested for purity, fat content, and hygiene.', color: 'text-emerald-500 bg-emerald-50' },
  { icon: Leaf, title: 'Farm Fresh', desc: 'Chilled immediately at the farm and delivered fresh to your door before sunrise.', color: 'text-amber-500 bg-amber-50' },
  { icon: UsersRound, title: 'Customer Trust', desc: 'We place our families first, maintaining transparent and honest sourcing.', color: 'text-sky-500 bg-sky-50' }
]

const PROCESS_STEPS = [
  { emoji: '🐄', title: 'Healthy Cows', desc: 'Pasture-fed cows raised with care and organic fodder.' },
  { emoji: '🥛', title: 'Morning Milking', desc: 'Hygienic milking using modern touch-free automation.' },
  { emoji: '🧪', title: 'Quality Testing', desc: 'Tested for purity and chilled instantly to preserve nutrients.' },
  { emoji: '🍼', title: 'Packing', desc: 'Sealed safely in clean eco-friendly bottles.' },
  { emoji: '🚚', title: 'Doorstep Delivery', desc: 'Delivered in temperature-controlled transit before sunrise.' }
]

const GALLERY_IMAGES = [
  { src: '/images/amruth_farm_gate.png', alt: 'Entrance to the pristine Amruth Dairy Farm, nestled in nature.', title: 'Our Farm Gate' },
  { src: '/images/bg/hero-banner-2.png', alt: 'A view of our healthy pasture-fed cows enjoying green meadows.', title: 'Pasture Life' },
  { src: '/images/our-story-farm-fresh.png', alt: 'Hygienic, touch-free milking processes under expert care.', title: 'Modern Milking' },
  { src: '/images/amruth_hero_composition.png', alt: 'Carefully sealed glass bottles prepared for dispatch.', title: 'Safe Packaging' },
  { src: '/images/bg/hero-banner.png', alt: 'Chilled delivery vehicles ensuring sunrise doorstep drop-off.', title: 'Doorstep Delivery' }
]

export default function OurStoryPage() {
  const [selectedImage, setSelectedImage] = useState<typeof GALLERY_IMAGES[0] | null>(null)
  
  // Hero Parallax Scroll
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "30%"])

  // Timeline Progress Scroll
  const timelineRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  })

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
        <section className="py-20 md:py-28 bg-white overflow-hidden">
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
                <h2 className="text-3xl sm:text-4xl md:text-[40px] font-bold text-black font-cabinet leading-tight tracking-tight mb-8">
                  A Vision of Absolute Purity.
                </h2>

                {/* Content */}
                <div className="space-y-6 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed font-sans">
                  <p>
                    Amruth Dairy began with one simple belief: <strong>Every family deserves fresh, pure milk delivered with honesty and care.</strong>
                  </p>
                  <p>
                    What started as a small family-run dairy has grown into a trusted farm-to-home service built on quality, consistency, and genuine relationships with our customers.
                  </p>
                  <p>
                    We believe the best milk comes from cows that are fed on nutrient-rich fodder, monitored daily for wellness, and nurtured in a hygienic environment. We reject synthetic chemicals, hormones, and preservatives, ensuring you receive nature's gift exactly as intended.
                  </p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* 3. TIMELINE */}
        <section ref={timelineRef} className="py-20 md:py-28 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-[1px] bg-sky-200"></div>
                <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest">
                  OUR ROADMAP
                </span>
                <div className="w-8 h-[1px] bg-sky-200"></div>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-4">
                Milestones of Trust
              </h2>
              <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Take a look back at how we have grown from a single farm to serving hundreds of families across the region.
              </p>
            </div>

            {/* Timeline Tree */}
            <div className="relative max-w-4xl mx-auto mt-20">
              {/* Timeline background vertical line */}
              <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-[2px] bg-slate-200 -translate-x-1/2" />
              
              {/* Growing line overlay */}
              <motion.div
                style={{ scaleY: timelineProgress, originY: 0 }}
                className="absolute left-4 md:left-1/2 top-4 bottom-4 w-[2px] bg-[#02429C] -translate-x-1/2"
              />

              {TIMELINE_DATA.map((item, idx) => {
                const isEven = idx % 2 === 0
                return (
                  <div key={item.year} className={`relative flex flex-col md:flex-row items-start md:items-center justify-between mb-16 md:mb-24 last:mb-0 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                    {/* Spacer or content on opposite side */}
                    <div className="hidden md:block w-[45%]" />

                    {/* Timeline Node marker */}
                    <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-white border-4 border-[#02429C] -translate-x-1/2 z-10 shadow-sm" />

                    {/* Timeline card */}
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 30 : -30, y: 15 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="w-[calc(100%-2.5rem)] ml-10 md:ml-0 md:w-[45%] bg-white p-6 md:p-8 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(2,66,156,0.05)] transition-all duration-300 group text-left"
                    >
                      <span className="inline-block text-xs font-bold text-[#02429C] bg-sky-50 px-3 py-1 rounded-full mb-3 tracking-wide">
                        {item.year}
                      </span>
                      <h3 className="text-xl font-bold font-cabinet text-black mb-2 group-hover:text-[#02429C] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-sans">
                        {item.desc}
                      </p>
                    </motion.div>
                  </div>
                )
              })}
            </div>

          </div>
        </section>

        {/* 4. OUR VALUES */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-[1px] bg-sky-200"></div>
                <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest">
                  OUR CORE VALUES
                </span>
                <div className="w-8 h-[1px] bg-sky-200"></div>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-4">
                What Drives Amruth Dairy
              </h2>
              <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Our daily decisions are anchored in these principles, making sure the milk you receive is ethically, hygienically, and purely produced.
              </p>
            </div>

            {/* Grid of 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {VALUES.map((val, idx) => {
                const IconComp = val.icon
                return (
                  <motion.div
                    key={val.title}
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="bg-slate-50 p-8 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_40px_rgba(2,66,156,0.05)] transition-all duration-300 text-left flex flex-col items-start"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${val.color}`}>
                      <IconComp size={24} />
                    </div>
                    <h3 className="text-lg font-bold font-cabinet text-black mb-3">
                      {val.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-sans">
                      {val.desc}
                    </p>
                  </motion.div>
                )
              })}
            </div>

          </div>
        </section>

        {/* 5. PROCESS SECTION */}
        <section className="py-20 md:py-28 bg-[#F8FAFC] overflow-hidden">
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
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4 relative max-w-5xl mx-auto">
              {PROCESS_STEPS.map((step, idx) => {
                const isLast = idx === PROCESS_STEPS.length - 1
                return (
                  <div key={step.title} className="flex flex-col lg:flex-row items-center w-full lg:w-auto">
                    {/* Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.12 }}
                      className="flex flex-col items-center text-center p-6 bg-white border border-slate-100 rounded-[24px] w-full max-w-[280px] lg:w-[170px] xl:w-[190px] h-[210px] shadow-[0_4px_18px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_28px_rgba(2,66,156,0.04)] transition-all duration-300"
                    >
                      <span className="text-4xl mb-4 select-none">{step.emoji}</span>
                      <h3 className="text-sm font-bold font-cabinet text-black mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                        {step.desc}
                      </p>
                    </motion.div>

                    {/* Connection Arrow */}
                    {!isLast && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.12 + 0.08 }}
                        className="my-3 lg:my-0 lg:mx-3 text-[#02429C] font-extrabold"
                      >
                        <span className="hidden lg:inline text-xl">➔</span>
                        <span className="inline lg:hidden text-xl">⬇</span>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </section>

        {/* 6. IMAGE GALLERY */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="mb-16 flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-[1px] bg-sky-200"></div>
                <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest">
                  VISUAL GALLERY
                </span>
                <div className="w-8 h-[1px] bg-sky-200"></div>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-4">
                Life At The Farm
              </h2>
              <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Take a visual journey into our daily operations. Click on any picture to view it full size.
              </p>
            </div>

            {/* Masonry-style column grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 max-w-6xl mx-auto">
              {GALLERY_IMAGES.map((img, idx) => (
                <motion.div
                  key={img.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  onClick={() => setSelectedImage(img)}
                  className="break-inside-avoid mb-6 relative group overflow-hidden rounded-[20px] cursor-zoom-in shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-slate-100 bg-slate-50"
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                  {/* Subtle caption overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-left text-white">
                    <h4 className="text-base font-bold font-cabinet leading-none">{img.title}</h4>
                    <p className="text-[11px] text-white/80 mt-2 font-sans line-clamp-1 leading-relaxed">{img.alt}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 cursor-pointer"
                aria-label="Close image lightbox"
              >
                <X size={24} />
              </button>
              
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative max-w-5xl max-h-[75vh] md:max-h-[80vh] aspect-[4/3] w-full rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  className="object-contain"
                  priority
                />
                
                {/* Lightbox Caption */}
                <div className="absolute -bottom-14 left-0 right-0 text-white text-center py-2 px-4">
                  <h3 className="text-lg font-bold font-cabinet">{selectedImage.title}</h3>
                  <p className="text-xs text-white/70 mt-1 font-sans">{selectedImage.alt}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7. MISSION SECTION */}
        <section className="py-24 md:py-32 bg-white relative overflow-hidden">
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
        <section className="py-16 md:py-24 bg-white">
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
