'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function OurStoryPreview() {
  return (
    <section id="our-story-preview" className="relative overflow-hidden bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[45%_55%] gap-10 md:gap-16 items-center">
          
          {/* LEFT: STORY CONTENT (order-2 on mobile, order-1 on desktop) */}
          <ScrollReveal
            direction="up"
            delay={100}
            duration={800}
            className="order-2 md:order-1 flex flex-col items-start text-left md:pr-4"
          >
            {/* Eyebrow Section Label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[1px] bg-sky-200"></div>
              <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest">
                OUR STORY
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-4xl md:text-[40px] font-bold text-black font-cabinet leading-tight tracking-tight mb-6">
              Every Drop Has A Story.
            </h2>

            {/* Body */}
            <div className="space-y-4 mb-8">
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-sans">
                What started as a small dairy farm has grown into a trusted farm-to-home milk delivery service.
              </p>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-sans">
                Every morning before sunrise, our team works with care, hygiene and dedication to deliver fresh milk to families who value quality, purity and trust.
              </p>
            </div>

            {/* CTA Button */}
            <Link
              href="/our-story"
              className="font-cabinet inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[10px] bg-[#02429C] text-white font-medium text-[15px] hover:scale-[1.02] hover:-translate-y-[2px] hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              Read Our Journey
              <ArrowRight size={16} strokeWidth={1.8} className="group-hover:translate-x-[4px] transition-transform duration-200" />
            </Link>
          </ScrollReveal>

          {/* RIGHT: BEAUTIFUL FARM IMAGE (order-1 on mobile, order-2 on desktop) */}
          <ScrollReveal
            direction="up"
            delay={200}
            duration={800}
            className="order-1 md:order-2 w-full"
          >
            <div className="relative w-full aspect-[4/3] rounded-[20px] md:rounded-[24px] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.06)] bg-slate-100">
              <Image
                src="/images/our-story-farm-fresh.png"
                alt="Amruth Dairy Farm & Journey"
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
                priority
              />
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  )
}

