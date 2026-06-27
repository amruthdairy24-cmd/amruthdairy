'use client'

import Image from 'next/image'
import { Check, ShieldCheck, Heart, Clock, Award, BookOpen } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HowItWorks() {
  return (
    <section id="about-us" className="bg-[#EEF4FB] dark:bg-slate-950 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-14 items-center">

          {/* LEFT: TEXT & INFO */}
          <ScrollReveal direction="right" delay={0} duration={1000}>
            <div className="flex flex-col items-start text-left">

              {/* Eyebrow */}
              <span className="inline-flex items-center gap-1.5 border border-[#1230AE]/30 rounded-full px-3 py-1 text-[11px] text-[#1230AE] font-semibold uppercase tracking-widest mb-4">
                Why Choose Amruth Dairy
              </span>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-8">
                Purity You Can Trust,<br />Care You Can Taste.
              </h2>

              {/* 4 Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7 mb-10 w-full">

                {[
                  {
                    icon: <Heart size={18} />,
                    title: 'Healthy Cows',
                    desc: 'Our cows are fed with natural fodder and cared with love.',
                  },
                  {
                    icon: <Award size={18} />,
                    title: 'Hygienic Milking',
                    desc: 'Modern equipment and hygienic milking process.',
                  },
                  {
                    icon: <ShieldCheck size={18} />,
                    title: 'Quality Checked',
                    desc: 'Every drop is tested for purity before delivery.',
                  },
                  {
                    icon: <Clock size={18} />,
                    title: 'On-Time Delivery',
                    desc: 'Delivered early morning to keep it fresh.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="w-full flex justify-center md:justify-start">
                <button className="h-11 px-7 rounded-full bg-[#1230AE] text-white font-semibold text-[13.5px] cursor-pointer shadow-[0_4px_14px_rgba(18,48,174,0.3)] hover:scale-[1.03] hover:shadow-[0_6px_20px_rgba(18,48,174,0.4)] transition-all duration-200">
                  Know More About Us
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* RIGHT: IMAGE + FLOATING CARD */}
          <ScrollReveal direction="left" delay={200} duration={1000}>
            <div className="relative w-full" id="farm-visit">

              {/* Main Image */}
              <div className="relative w-full h-[340px] sm:h-[380px] rounded-2xl overflow-hidden shadow-[0_8px_28px_rgba(15,23,42,0.12)]">
                <Image
                  src="/images/amruth_farm_gate.png"
                  alt="Amruth Dairy Farm gate"
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Floating Card */}
              <div className="
                relative md:absolute
                bottom-auto md:-bottom-6
                right-auto md:-right-4
                bg-white dark:bg-slate-900
                rounded-2xl
                p-6 md:p-5
                w-full md:w-[240px]
                shadow-[0_8px_28px_rgba(15,23,42,0.12)]
                border border-slate-100 dark:border-slate-800
                mt-5 md:mt-0
                z-20
              ">
                <span className="text-[10px] font-extrabold text-[#1230AE] uppercase tracking-widest block mb-2">
                  Visit Our Farm
                </span>
                <h4 className="font-playfair text-xl md:text-base font-bold text-slate-900 dark:text-white mb-5 md:mb-4 leading-snug">
                  See Where Your Milk<br />Comes From.
                </h4>

                <div className="flex flex-col gap-3 md:gap-2 mb-6 md:mb-5">
                  {['Guided Farm Tour', 'Meet Our Cows', 'Understand Our Process'].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <Check size={13} className="text-[#1230AE] stroke-[3px] flex-shrink-0" />
                      <span className="text-sm md:text-xs font-medium text-slate-600 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full h-11 md:h-9 rounded-full bg-[#1230AE] text-white font-semibold text-sm md:text-[12.5px] cursor-pointer shadow-[0_4px_12px_rgba(18,48,174,0.25)] hover:scale-[1.02] transition-all duration-200">
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