'use client'

import Image from 'next/image'
import { Check, ShieldCheck, Heart, Clock, Award } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HowItWorks() {
  return (
    <section id="about-us" className="bg-white dark:bg-slate-950 py-28">
      <div className="container-page">
        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-12 md:gap-16 items-center">
          
          {/* LEFT: TEXT & INFO WITH SCROLL REVEAL */}
          <ScrollReveal direction="right" delay={0} duration={1000}>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="inline-flex items-center bg-white dark:bg-warm-white border border-sky-500/15 text-sky-600 dark:text-sky-400 rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest mb-4.5 shadow-[0_2px_6px_rgba(2,132,199,0.04)]">
                Why Choose Amruth Dairy
              </div>

              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium text-slate-950 dark:text-white leading-tight tracking-tight mb-9">
                Purity You Can Trust,<br /> Care You Can Taste.
              </h2>

              {/* 4 Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-9 mb-11 text-left">
                
                {/* Feature 1 */}
                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-650 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">Healthy Cows</h4>
                    <p className="text-xs sm:text-sm text-slate-605 dark:text-brown-600 leading-relaxed font-medium">
                      Our cows are fed with natural fodder and cared with love.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-650 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">Hygienic Milking</h4>
                    <p className="text-xs sm:text-sm text-slate-605 dark:text-brown-600 leading-relaxed font-medium">
                      Modern equipment and hygienic milking process.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-650 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">Quality Checked</h4>
                    <p className="text-xs sm:text-sm text-slate-605 dark:text-brown-600 leading-relaxed font-medium">
                      Every drop is tested for purity before delivery.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-650 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-950 dark:text-white mb-1.5">On-Time Delivery</h4>
                    <p className="text-xs sm:text-sm text-slate-605 dark:text-brown-600 leading-relaxed font-medium">
                      Delivered early morning to keep it fresh.
                    </p>
                  </div>
                </div>

              </div>

              <button className="h-12 px-8 rounded-xl bg-gradient-to-b from-sky-400 to-sky-650 text-white border border-sky-650/15 font-medium text-[15px] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_rgba(3,105,161,0.2)] hover:scale-105 hover:shadow-lg transition-all duration-200">
                Know More About Us
              </button>
            </div>
          </ScrollReveal>

          {/* RIGHT: BEAUTIFUL IMAGE & FLOATING CARD WITH SCROLL REVEAL */}
          <ScrollReveal direction="left" delay={200} duration={1000}>
            <div className="relative w-full" id="farm-visit">
              
              {/* Main Image */}
              <div className="relative w-full h-[400px] rounded-brand-lg overflow-hidden shadow-[0_12px_32px_rgba(15,23,42,0.04)] dark:border dark:border-border">
                <Image 
                  src="/images/amruth_farm_gate.png"
                  alt="Amruth Dairy Farm gate"
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Overlapping Floating Box */}
              <div className="relative md:absolute bottom-auto md:-bottom-[30px] right-auto md:-right-5 bg-white dark:bg-warm-white rounded-brand-lg p-7 w-full md:w-[280px] shadow-card border border-border/80 dark:border-border mt-6 md:mt-0 z-20 text-left">
                <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase block mb-1.5 tracking-wider">
                  Visit Our Farm
                </span>
                <h4 className="font-playfair text-lg font-bold text-slate-950 dark:text-white mb-4 leading-tight">
                  See Where Your Milk Comes From.
                </h4>
                
                {/* Bullet list */}
                <div className="flex flex-col gap-2.5 mb-6">
                  {[
                    'Guided Farm Tour',
                    'Meet Our Cows',
                    'Understand Our Process'
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check size={12} className="text-sky-600 dark:text-sky-400 stroke-[3.5px]" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-brown-650">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button className="w-full h-10 rounded-xl bg-gradient-to-b from-sky-400 to-sky-650 text-white border border-sky-650/15 font-medium text-[13.6px] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_rgba(3,105,161,0.15)] hover:scale-[1.02] transition-all duration-200">
                  Book Your Visit
                </button>
              </div>

            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  )
}
