'use client'

import Link from 'next/link'
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function PrivacyPolicyPage() {
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
              <ShieldCheck size={280} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <Lock size={12} /> Compliance & Trust
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
              <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                At Amruth Dairy Farm, we value your trust. This Privacy Policy details how we collect, use, and protect your personal information when you subscribe to our daily milk and dairy product delivery services.
              </p>
              <p className="mt-4 text-xs text-blue-200/80 font-medium">
                Last Updated: July 24, 2026
              </p>
            </div>
          </div>

          {/* Main Policy Content */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold">Information We Collect</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                To provide seamless daily doorstep milk delivery, we collect necessary personal details when you register or place an order on our platform:
              </p>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li><strong className="text-slate-800">Personal Details:</strong> Full Name, Mobile Phone Number (for OTP authentication & delivery updates).</li>
                <li><strong className="text-slate-800">Delivery Address:</strong> House/Flat Address, Area/Locality, Nearby Landmark, and Floor/Delivery notes for our delivery personnel.</li>
                <li><strong className="text-slate-800">Subscription & Order History:</strong> Selected milk quantities, daily skip preferences, vacation pause dates, extra milk orders, and payment records.</li>
                <li><strong className="text-slate-800">Payment Information:</strong> Online payments are processed securely via <strong>Razorpay</strong>. We do <em>NOT</em> store or capture your credit/debit card numbers, CVV, or net banking passwords on our servers.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-xl font-bold">How We Use Your Information</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                We use your personal data strictly to deliver quality service and maintain your account:
              </p>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li>Dispatching fresh milk to your doorstep every morning by 7:00 AM IST.</li>
                <li>Generating accurate monthly billing statements reflecting daily skips, vacation credits, and extra milk orders.</li>
                <li>Processing payment transactions and issuing automatic refunds for mid-month subscription cancellations.</li>
                <li>Sending critical delivery updates, cutoff notifications (9:00 PM IST), and customer support messages via SMS or WhatsApp.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold">Payment Security & Razorpay Integration</h2>
              </div>
              <div className="pl-11 space-y-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  All online payments on our platform are processed securely through <strong>Razorpay Payment Gateway</strong>, which adheres to PCI-DSS Level 1 security compliance standards. 
                </p>
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-slate-700 text-sm flex gap-3 items-start">
                  <ShieldCheck className="text-[#013378] shrink-0 mt-0.5" size={20} />
                  <div>
                    <strong className="text-[#013378] block mb-1">Encrypted Payment Processing</strong>
                    Your transaction details are transmitted using 256-bit SSL encryption directly to Razorpay. Amruth Dairy Farm never sees or stores sensitive bank details or PINs.
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">4</div>
                <h2 className="text-xl font-bold">Data Sharing & Third Parties</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                We respect your privacy. <strong className="text-slate-800">We do not sell, rent, trade, or leak your personal information to any third parties or marketing agencies.</strong> Information is shared solely with trusted service infrastructure partners essential for operating our service:
              </p>
              <ul className="list-disc pl-16 space-y-2 text-slate-600 text-sm sm:text-base">
                <li><strong className="text-slate-800">Razorpay:</strong> Payment processing and refund fulfillment.</li>
                <li><strong className="text-slate-800">Delivery Staff:</strong> Name, delivery address, phone number, and daily milk quantity required for morning dispatch.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">5</div>
                <h2 className="text-xl font-bold">Data Retention & User Rights</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                We retain your subscription and transaction records as required by local tax and accounting laws. You have the right to access, correct, or request deletion of your account profile by reaching out to our support team.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#013378]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-sm">6</div>
                <h2 className="text-xl font-bold">Contact & Support</h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-11">
                If you have any questions or concerns regarding our Privacy Policy or your personal data, please contact our support team:
              </p>
              
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
