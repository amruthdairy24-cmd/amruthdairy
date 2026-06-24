import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Zap, CreditCard, MessageSquare, Rocket, Triangle, Calendar, Lock, BookOpen } from 'lucide-react'

function getTechIcon(iconName: string, className?: string) {
  switch (iconName) {
    case '▲': return <Triangle className={className} fill="currentColor" />
    case '⚡': return <Zap className={className} />
    case '💳': return <CreditCard className={className} />
    case '💬': return <MessageSquare className={className} />
    case '🚀': return <Rocket className={className} />
    default: return null
  }
}

const techStack = [
  { icon: '▲', name: 'Next.js 14', role: 'Framework', desc: 'App Router, Server Components, Edge API' },
  { icon: '⚡', name: 'Supabase', role: 'Backend', desc: 'PostgreSQL + Auth + Realtime + Storage' },
  { icon: '💳', name: 'Razorpay', role: 'Payments', desc: 'UPI, cards, net banking — fully automated' },
  { icon: '💬', name: 'Twilio WhatsApp', role: 'Notifications', desc: 'Auto-send bills, confirmations & alerts' },
  { icon: '🚀', name: 'Vercel', role: 'Hosting', desc: 'Global CDN, auto-deploy, 99.9% uptime' },
]

const features = [
  'Complete subscription management portal',
  'Customer OTP login (no password needed)',
  'Skip, vacation pause & extra order flows',
  '100% automated monthly billing engine',
  'Admin dashboard with delivery list',
  'Razorpay payment integration',
  '6 WhatsApp notification templates',
  'Row-Level Security (bank-level data protection)',
  'Mobile-first responsive design',
  'Cron jobs for daily + monthly automation',
  'Complete billing history & credit tracking',
  'Product shop with Razorpay checkout',
]

export function PricingSection() {
  return (
    <>
      {/* Tech Stack */}
      <section className="bg-milk-200 dark:bg-slate-950 section-py" id="tech-stack">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="section-label justify-center">Technology</p>
            <h2 className="text-3xl md:text-4xl font-black text-teal-900 dark:text-white mb-4">
              Built on world-class infrastructure
            </h2>
            <p className="text-sm sm:text-base text-teal-900/55 dark:text-slate-455">
              Enterprise-grade tools used by companies 1000x our size — at a small-business price.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className={cn(
                  'bg-white dark:bg-slate-900 border border-milk-200 dark:border-border rounded-brand-lg p-6',
                  'flex flex-col items-center text-center',
                  'transition-all duration-300',
                  'hover:-translate-y-1 hover:border-teal-100 hover:shadow-card'
                )}
              >
                <div className="text-teal-600 dark:text-teal-400 mb-3" aria-hidden="true">
                  {getTechIcon(tech.icon, "w-8 h-8")}
                </div>
                <p className="text-sm font-bold text-teal-900 dark:text-white mb-0.5">{tech.name}</p>
                <p className="text-xs font-semibold text-teal-500 dark:text-teal-400 uppercase tracking-wider mb-2">{tech.role}</p>
                <p className="text-xs text-teal-900/50 dark:text-slate-400 leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-teal-900 dark:bg-[#0b0c10] section-py" id="pricing">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="section-label justify-center text-teal-400 dark:text-teal-500">
              Investment
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              One-time development. Lifetime value.
            </h2>
            <p className="text-sm sm:text-base text-white/55 dark:text-slate-400">
              A fixed-price project. No surprises, no scope creep. Everything listed below, delivered in 6 weeks.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-brand-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left — Price */}
                <div className="p-10 border-b lg:border-b-0 lg:border-r border-milk-200 dark:border-border">
                  <p className="text-xs text-teal-900/40 dark:text-slate-500 line-through mb-2">Market price: ₹60,000–₹80,000</p>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-extrabold text-teal-700 dark:text-white font-mono-num text-5xl md:text-6xl tracking-tighter leading-none">
                      ₹30,000
                    </span>
                  </div>
                  <p className="text-sm text-teal-900/50 dark:text-slate-450 mb-8">Fixed price. No recurring fees from EKodrix.</p>

                  <div className="bg-milk-50 dark:bg-slate-950 border border-milk-200 dark:border-border rounded-2xl p-5 mb-8">
                    <p className="text-xs font-bold text-teal-900 dark:text-white uppercase tracking-widest mb-4">Payment Structure</p>
                    <div className="flex gap-4">
                      <div className="flex-1 text-center bg-white dark:bg-slate-900 rounded-xl p-4">
                        <p className="text-base sm:text-lg font-extrabold text-teal-700 dark:text-teal-400 font-mono-num">₹15K</p>
                        <p className="text-xs text-teal-900/50 dark:text-slate-400 mt-1">On start</p>
                      </div>
                      <div className="flex-1 text-center bg-white dark:bg-slate-900 rounded-xl p-4">
                        <p className="text-base sm:text-lg font-extrabold text-amber-500 dark:text-amber-400 font-mono-num">₹15K</p>
                        <p className="text-xs text-teal-900/50 dark:text-slate-400 mt-1">On delivery</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-8">
                    <div className="flex items-center gap-2 text-sm text-teal-900/70 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-teal-500 dark:text-teal-400" /> 6 weeks delivery timeline
                    </div>
                    <div className="flex items-center gap-2 text-sm text-teal-900/70 dark:text-slate-300">
                      <Lock className="w-4 h-4 text-teal-500 dark:text-teal-400" /> 1 month post-launch support
                    </div>
                    <div className="flex items-center gap-2 text-sm text-teal-900/70 dark:text-slate-300">
                      <BookOpen className="w-4 h-4 text-teal-500 dark:text-teal-400" /> Admin training session included
                    </div>
                  </div>

                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 w-full h-14 rounded-full bg-teal-700 dark:bg-teal-600 text-white font-bold shadow-button hover:bg-teal-500 dark:hover:bg-teal-500 hover:scale-[1.02] hover:-translate-y-px active:scale-[0.97] transition-all duration-200"
                  >
                    Get Started → Call 90485 71147
                  </Link>
                </div>

                {/* Right — Features */}
                <div className="p-10">
                  <p className="text-sm font-bold text-teal-900 dark:text-white mb-6">Everything included:</p>
                  <ul className="flex flex-col gap-3 pl-0 list-none">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-teal-900/70 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
