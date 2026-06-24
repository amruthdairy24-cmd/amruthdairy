import Link from 'next/link'
import { Milk, Phone } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="bg-[#0D4F4F] dark:bg-[#0b0c10] py-24 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(26,122,94,0.4)_0%,transparent_60%)]" />

      <div className="container-page relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <Milk size={48} className="text-amber-400" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Fresh morning delivery starts here
        </h2>
        <p className="text-base sm:text-lg text-white/60 max-w-[460px] mx-auto mb-9 leading-relaxed">
          Enjoy delicious farm-fresh milk delivered right to your doorstep before 7 AM. Skip or pause anytime.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link 
            href="/subscribe" 
            id="final-cta-subscribe" 
            className="inline-flex items-center justify-center h-14 px-9 rounded-full bg-[#F59C1A] text-white font-bold text-sm shadow-[0_4px_20px_rgba(245,156,26,0.3)] hover:scale-105 active:scale-[0.98] transition-all duration-200"
          >
            <Milk size={16} className="mr-2" /> Start Subscription
          </Link>
          <a 
            href="tel:+919048571147" 
            className="inline-flex items-center justify-center h-14 px-8 rounded-full border-[1.5px] border-white/25 text-white font-semibold text-sm hover:bg-white/5 hover:scale-105 active:scale-[0.98] transition-all duration-200"
          >
            <Phone size={14} className="mr-2" /> Call 90485 71147
          </a>
        </div>

        <p className="text-[11px] text-white/35 mt-12 font-medium tracking-widest uppercase">
          Amruth Dairy · Padil, Mangalore
        </p>
      </div>
    </section>
  )
}
