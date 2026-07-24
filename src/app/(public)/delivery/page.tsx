'use client'

import Link from 'next/link'
import { Truck, Clock, MapPin, CheckCircle2, ShieldCheck, ArrowLeft, Mail, Phone, CalendarCheck, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function DeliveryPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-800 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Navigation */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-semibold text-[#013378] hover:underline gap-1.5"
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>

          {/* Header Card */}
          <div className="bg-[#013378] text-white rounded-3xl p-8 sm:p-10 shadow-xl mb-10 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
              <Truck size={280} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <Sparkles size={12} /> Sunrise Guaranteed
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Shipping & Delivery Policy</h1>
              <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                At Amruth Dairy Farm, we believe fresh milk belongs at your doorstep before your morning begins. Here is how our daily doorstep delivery operation works.
              </p>
              <p className="mt-4 text-xs text-blue-200/80 font-medium">
                Last Updated: July 24, 2026
              </p>
            </div>
          </div>

          {/* Highlight Box for Everyday Delivery */}
          <div className="bg-[#013378] text-white rounded-3xl p-6 sm:p-8 shadow-md mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 border border-blue-900">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Truck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Everyday Doorstep Delivery Promise</h3>
              <p className="text-blue-100 text-sm sm:text-base mt-1 leading-relaxed">
                <strong>Our assigned delivery boy will deliver fresh farm milk to your doorstep every single day</strong> between <strong>5:00 AM and 7:00 AM IST</strong>, 365 days a year. Rain or shine, fresh morning milk is guaranteed!
              </p>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold">Daily Delivery Timings & Schedule</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Milk is freshly pasteurized, chilled at the farm, and dispatched on specialized morning delivery routes:
                </p>
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sky-950 text-sm flex gap-3 items-start">
                  <Clock className="text-[#013378] shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-[#013378] block mb-1">Sunrise Doorstep Delivery Window: 5:00 AM to 7:00 AM IST</strong>
                    Our delivery personnel follow fixed neighborhood route sheets ensuring your milk bottle or pouch reaches your doorstep or designated milk bag every morning before 7:00 AM IST.
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-xl font-bold">Service Coverage & Delivery Zones</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                We currently provide direct daily doorstep delivery across operational sectors in <strong className="text-slate-800">Padil and surrounding localities in Mangaluru, Karnataka</strong>. When subscribing, our platform checks capacity for your pincode to ensure delivery commitments can be met without delay.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold">Free Delivery Included in Subscriptions</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-950 text-sm flex gap-3 items-start">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-emerald-950 block mb-1">Zero Delivery Charges</strong>
                    All monthly subscriptions and extra milk orders include <strong>FREE daily doorstep delivery</strong>. There are no additional delivery convenience fees added to your bill.
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">4</div>
                <h2 className="text-xl font-bold">Delivery Instructions & Doorstep Placement</h2>
              </div>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li><strong className="text-slate-800">Delivery Bag / Box:</strong> We recommend placing a clean milk bag or insulated box outside your doorstep or gate prior to 5:00 AM IST.</li>
                <li><strong className="text-slate-800">Floor & Gate Notes:</strong> You can add specific floor notes (e.g. &quot;Leave in 2nd floor basket&quot;) during onboarding or inside your account profile, which will automatically sync to our delivery boy&apos;s daily sheet.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">5</div>
                <h2 className="text-xl font-bold">Modifying Delivery: Skips & Extra Milk Orders</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                You can easily pause or modify your daily delivery schedule through your subscriber dashboard:
              </p>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li><strong className="text-slate-800">Skip a Day:</strong> If you don&apos;t need milk tomorrow, mark &quot;Skip&quot; before <strong>9:00 PM IST</strong>. Our delivery boy will not visit your address, and your account will receive a full day credit.</li>
                <li><strong className="text-slate-800">Order Extra Milk:</strong> Need extra milk for guests? Order extra quantity (+0.5L, +1L, etc.) before 9:00 PM IST, and our delivery boy will bring the additional milk alongside your regular bottle.</li>
                <li><strong className="text-slate-800">Vacation Pause:</strong> Going out of town? Set your start and end dates. Deliveries pause completely and automatically resume on your return date.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">6</div>
                <h2 className="text-xl font-bold">Delivery Support & Contact</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                If your delivery is delayed past 7:00 AM IST or if you have special delivery instructions, reach out to our local route supervisor immediately:
              </p>
              <div className="ml-11 bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Farm Location</div>
                    <div className="text-slate-600">Padil, Mangaluru, KA</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Delivery Helpline</div>
                    <a href="tel:+919880143808" className="text-slate-600 hover:text-[#013378]">+91 9880143808</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Support Email</div>
                    <a href="mailto:support@amruthdairy.com" className="text-slate-600 hover:text-[#013378]">support@amruthdairy.com</a>
                  </div>
                </div>
              </div>
            </section>

          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
