'use client'

import Link from 'next/link'
import { FileText, CheckCircle2, ShieldAlert, Clock, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function TermsOfServicePage() {
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
              <FileText size={280} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <CheckCircle2 size={12} /> Service Terms
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
              <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                Welcome to Amruth Dairy Farm. By using our website or subscribing to our daily milk and dairy product delivery services in Mangaluru, you agree to comply with the following terms and conditions.
              </p>
              <p className="mt-4 text-xs text-blue-200/80 font-medium">
                Last Updated: July 24, 2026
              </p>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold">Acceptance of Terms</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                By accessing our online platform, registering an account, or subscribing to our daily milk delivery service, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-xl font-bold">Services Provided</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                Amruth Dairy Farm provides subscription-based and one-off daily doorstep deliveries of farm-fresh milk (0.5L, 1.0L, 1.5L, 2.0L) and traditional dairy products (Ghee, Honey, Butter, etc.) within designated operational areas in Padil and Mangaluru, Karnataka.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold">Subscription Rules & 9:00 PM IST Cutoff</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  To enable our farm and packaging team to prepare early morning dispatch, strict modification cutoff rules apply:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm flex gap-3 items-start">
                  <Clock className="text-amber-700 shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-amber-950 block mb-1">9:00 PM IST Daily Cutoff</strong>
                    Any daily skip requests, vacation pause requests, or extra milk orders for tomorrow&apos;s delivery must be submitted in your dashboard before <strong>9:00 PM IST</strong> the preceding night. Requests submitted after 9:00 PM IST will apply starting the day after tomorrow.
                  </div>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-slate-800">Quantity Changes:</strong> Upgrades or downgrades in daily milk quantity take effect starting the 1st of the subsequent month.</li>
                  <li><strong className="text-slate-800">Vacation Pauses:</strong> Deliveries pause for your selected dates and automatically resume on your specified resume date. Unused days are credited to your account.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">4</div>
                <h2 className="text-xl font-bold">Pricing & Payments</h2>
              </div>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li>Prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes.</li>
                <li>Subscriptions are billed on a monthly basis. Mid-month signups are calculated pro-rata based on the exact remaining days in the month.</li>
                <li>Online payments are processed securely via <strong>Razorpay</strong> (UPI, Debit/Credit Cards, Net Banking). Manual cash payments must be approved by the admin.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">5</div>
                <h2 className="text-xl font-bold">User Responsibilities & Delivery Access</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                Customers must provide accurate delivery addresses, floor notes, and contact phone numbers. Customers are responsible for providing safe access to their doorstep or placing a milk container/bag outside before 5:00 AM IST.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">6</div>
                <h2 className="text-xl font-bold">Termination & Refunds</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                You may cancel your subscription at any time via your dashboard or by contacting support. If you stop your subscription mid-month, any unconsumed balance for the remaining days will be directly refunded to your original payment method via Razorpay within 5–7 business days. Please refer to our detailed <Link href="/refund" className="text-[#013378] font-bold underline">Refund Policy</Link> for complete details.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">7</div>
                <h2 className="text-xl font-bold">Governing Law</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Mangaluru, Karnataka, India.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 8 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">8</div>
                <h2 className="text-xl font-bold">Contact Us</h2>
              </div>
              <div className="ml-11 bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Address</div>
                    <div className="text-slate-600">Padil, Mangaluru, KA</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Phone</div>
                    <a href="tel:+919880143808" className="text-slate-600 hover:text-[#013378]">+91 9880143808</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Email</div>
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
