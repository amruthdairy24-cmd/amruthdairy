'use client'

import Link from 'next/link'
import { RefreshCw, CheckCircle2, DollarSign, Clock, ArrowLeft, Mail, Phone, MapPin, ShieldCheck, HeartHandshake } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function RefundPolicyPage() {
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
              <RefreshCw size={280} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <HeartHandshake size={12} /> Fair & Transparent
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Cancellation & Refund Policy</h1>
              <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                At Amruth Dairy Farm, customer satisfaction and absolute transparency are our top priorities. Here is how our subscription cancellation and payment refund process works.
              </p>
              <p className="mt-4 text-xs text-blue-200/80 font-medium">
                Last Updated: July 24, 2026
              </p>
            </div>
          </div>

          {/* Highlight Box for Razorpay & Customer Trust */}
          <div className="bg-emerald-500 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 border border-emerald-400">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <DollarSign size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Direct Refund Guarantee for Mid-Month Stop</h3>
              <p className="text-emerald-50 text-sm sm:text-base mt-1 leading-relaxed">
                <strong>If you stop your subscription in the middle of a month, you will get a direct payment refund</strong> for all remaining unconsumed days. The pro-rata amount is transferred directly to your original payment method (Bank / UPI via Razorpay) within 5–7 business days.
              </p>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold">Mid-Month Subscription Cancellation & Direct Refunds</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  You are never locked into a subscription at Amruth Dairy. If you decide to cancel or stop your milk subscription in the middle of a billing cycle:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-slate-800">Pro-Rata Refund Calculation:</strong> We calculate the exact number of remaining days in the month after your cancellation date.</li>
                  <li><strong className="text-slate-800">Direct Credit Transfer:</strong> The unconsumed balance (Daily Rate × Unused Remaining Days) is credited back directly to your original payment mode (Razorpay UPI, Debit/Credit Card, or Netbanking).</li>
                  <li><strong className="text-slate-800">No Hidden Penalty Fees:</strong> We do not deduct any cancellation fee or penalty. You are charged strictly for the days milk was delivered.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-xl font-bold">Daily Skips & Vacation Pause Credits</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Our self-serve customer dashboard makes it easy to pause or skip deliveries whenever you travel or don&apos;t need milk:
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-slate-700 text-sm flex gap-3 items-start">
                  <Clock className="text-[#013378] shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-[#013378] block mb-1">9:00 PM IST Cutoff for Skips</strong>
                    If you mark a &quot;Skip&quot; or set a &quot;Vacation Pause&quot; before 9:00 PM IST the night before, your morning delivery is paused and the exact daily rate is credited to your account.
                  </div>
                </div>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-slate-800">Carry-Forward Bill Discount:</strong> Skip & Vacation credits automatically reduce the net payable amount on your next month&apos;s bill.</li>
                  <li><strong className="text-slate-800">Refund on Account Closure:</strong> If you close your account with accrued skip credits, the total credit balance is refunded directly to your bank account.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold">Damaged, Spoiled, or Missing Deliveries</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                We take immense pride in delivering fresh, chilled milk at dawn. In the rare event of quality issues or missing delivery:
              </p>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li><strong className="text-slate-800">Immediate Replacement:</strong> Contact our support team by 9:00 AM IST on delivery morning for immediate replacement.</li>
                <li><strong className="text-slate-800">100% Refund Credit:</strong> If replacement is not possible, a 100% refund for that day&apos;s bottle will be credited instantly to your account.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">4</div>
                <h2 className="text-xl font-bold">Refund Processing Timeline</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                  <ShieldCheck className="text-emerald-600 shrink-0" size={28} />
                  <div>
                    <strong className="text-slate-800 block text-sm">5 to 7 Business Days Timeline</strong>
                    All approved online refunds processed through Razorpay Gateway take <strong>5 to 7 working days</strong> to reflect in your original bank account, UPI ID, or credit card statement, depending on your bank&apos;s processing times.
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">5</div>
                <h2 className="text-xl font-bold">How to Request a Refund</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                To request a refund or cancel your active subscription, you can hit &quot;Cancel Subscription&quot; inside your customer dashboard, or get in touch directly:
              </p>
              <div className="ml-11 bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Location</div>
                    <div className="text-slate-600">Padil, Mangaluru, KA</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Phone Support</div>
                    <a href="tel:+919880143808" className="text-slate-600 hover:text-[#013378]">+91 9880143808</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-[#013378] shrink-0" size={18} />
                  <div>
                    <div className="font-bold text-slate-800">Email Support</div>
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
