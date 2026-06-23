'use client'

import { useRef } from 'react'
import { useIntersection } from '@/hooks/useIntersection'
import { cn } from '@/lib/utils'
import { Smartphone, Calculator, Frown, BookOpen, Moon, TrendingUp, XCircle, CheckCircle2, Smile } from 'lucide-react'

function getIcon(emoji: string, className?: string) {
  switch (emoji) {
    case '📱': return <Smartphone className={className} />
    case '🧮': return <Calculator className={className} />
    case '😤': return <Frown className={className} />
    case '📓': return <BookOpen className={className} />
    case '🌙': return <Moon className={className} />
    case '📈': return <TrendingUp className={className} />
    default: return null
  }
}

const problems = [
  {
    emoji: '📱',
    title: 'WhatsApp Flood Every Night',
    body: '50+ customers send messages daily. Miss one message = one angry customer. It never stops.',
  },
  {
    emoji: '🧮',
    title: 'Manual Bill Calculation',
    body: '250 different bills, every month. Skips, vacations, extras — errors are inevitable.',
  },
  {
    emoji: '😤',
    title: 'Customer Disputes Daily',
    body: 'No proof, no record. "I skipped that day!" — you can\'t argue. Trust breaks permanently.',
  },
  {
    emoji: '📓',
    title: 'Notebook Gets Lost',
    body: 'One book with all your customer data. It gets wet, torn, or lost — and everything is gone.',
  },
  {
    emoji: '🌙',
    title: 'No Sleep Before Delivery',
    body: '1–2 hours every night preparing the delivery list manually. 365 days a year, no break.',
  },
  {
    emoji: '📈',
    title: "Can't Scale Beyond 250",
    body: 'At 500 customers, manual management becomes completely impossible. Growth stops.',
  },
]

const badSide = [
  'Hours on WhatsApp every night',
  'Manual billing errors every month',
  'Customer disputes with no proof',
  'Notebook data lost anytime',
  'Impossible to scale past 250',
]

const goodSide = [
  'Zero WhatsApp coordination needed',
  '100% accurate auto-billing',
  'Complete skip & payment records',
  'Everything in cloud, always safe',
  'Effortlessly scale to 1000+',
]

export function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(sectionRef, { threshold: 0.1 })

  return (
    <section className="bg-white section-py" id="problem" ref={sectionRef}>
      <div className="container-page">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="section-label">The Problem</p>
          <h2 className="text-heading text-teal-900 mb-4">
            Managing 250 customers manually is breaking your business
          </h2>
          <p className="text-body text-teal-900/55 leading-relaxed">
            Every day is a flood of messages, notebook errors, and disputes.
            It only gets harder as you grow.
          </p>
        </div>

        {/* Problem cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {problems.map((problem, i) => (
            <ProblemCard
              key={problem.title}
              {...problem}
              delay={i * 80}
              visible={isVisible}
            />
          ))}
        </div>

        {/* VS Banner */}
        <div
          className="bg-teal-900 rounded-[24px] p-8 md:p-12 relative overflow-hidden"
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden="true"
          />
          {/* Teal radial */}
          <div
            className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(26,122,94,0.3) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
            {/* Bad side */}
            <div>
              <h3 className="text-subhead font-extrabold text-red-300 mb-5 flex items-center gap-2">
                <Frown size={18} className="text-red-400" /> Without Website
              </h3>
              <ul className="flex flex-col gap-3">
                {badSide.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-small text-white/60">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      ✕
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* VS Badge */}
            <div className="flex justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: '#F59C1A',
                  boxShadow: '0 0 0 8px rgba(245,156,26,0.15), 0 0 0 16px rgba(245,156,26,0.06)',
                }}
              >
                <span className="text-white font-black text-sm">VS</span>
              </div>
            </div>

            {/* Good side */}
            <div>
              <h3 className="text-subhead font-extrabold text-green-300 mb-5 flex items-center gap-2">
                <Smile size={18} className="text-green-400" /> With Website
              </h3>
              <ul className="flex flex-col gap-3">
                {goodSide.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-small text-white/60">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemCard({
  emoji,
  title,
  body,
  delay,
  visible,
}: {
  emoji: string
  title: string
  body: string
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={cn(
        'relative bg-milk-50 border border-milk-300 rounded-[20px] p-7 overflow-hidden group',
        'transition-all duration-300 ease-out',
        'hover:shadow-card-hover hover:-translate-y-1 hover:border-red-100',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: 'linear-gradient(90deg, #EF4444, #F97316)' }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div className="w-12 h-12 bg-red-50 rounded-[14px] flex items-center justify-center text-red-500 mb-5">
        {getIcon(emoji, "w-6 h-6")}
      </div>

      <h3 className="text-subhead font-bold text-teal-900 mb-2">{title}</h3>
      <p className="text-small text-teal-900/55 leading-relaxed">{body}</p>
    </div>
  )
}
