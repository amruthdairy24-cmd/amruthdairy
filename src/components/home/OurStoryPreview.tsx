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
            <div className="space-y-4 mb-8 text-gray-600 text-sm sm:text-[15px] leading-[1.7] font-sans">
              <p>
                Our small dream of starting a cow farm began in 2023. Stepping out of the corporate world and into business was a big decision, but following our dream was always the goal.
              </p>

              {/* Highlighted promise block */}
              <div className="border-l-4 border-[#02429C] pl-4 py-2 bg-blue-50/50 rounded-r-xl">
                <p className="text-gray-700">
                  With the unwavering support of our family, we started our farm, <strong className="text-gray-900">&ldquo;Amruth Dairy,&rdquo;</strong> with one simple promise: <strong className="text-[#02429C]">Purity is Our Priority</strong>—bringing fresh milk directly from our farm to your family.
                </p>
              </div>

              <p>
                Dreaming is easy, but giving your 100% to make that dream a reality is what true passion is all about. Our dedication, hard work, and commitment to learning have brought us to where we are today.
              </p>

              {/* Divider */}
              <div className="w-10 h-[1.5px] bg-sky-200 my-2" />

              <p className="text-gray-500 italic text-[13.5px] sm:text-[14px] leading-[1.75]">
                We are truly grateful to have such wonderful customers who have trusted, supported, and encouraged us throughout this journey. Your love and faith in us inspire us to keep delivering the very best. We will always be thankful for your support.
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

