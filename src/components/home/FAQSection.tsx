'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'What if I forget to skip before 9 PM?',
    a: "You can still skip the day after tomorrow — the website will suggest this automatically. If you genuinely missed the window by accident, you can call the delivery number and we\'ll handle it manually. Going forward, set a reminder at 8 PM!",
  },
  {
    q: 'How is my monthly bill calculated?',
    a: 'Your base amount is your monthly subscription. We subtract skip credits and vacation credits, add any extra orders, and carry over unused credit from last month. The final bill is shown clearly with each line itemized — nothing hidden.',
  },
  {
    q: 'What if I pay more than my bill?',
    a: 'No problem! The extra amount is automatically carried forward as a credit to your next month\'s bill. You\'ll see it clearly labeled as "Credit from [Month]" in your statement.',
  },
  {
    q: 'Can I upgrade from 1L to 1.5L mid-month?',
    a: 'Yes, but the upgrade takes effect from the 1st of next month. Your current month\'s bill stays at your current rate. This avoids any confusing prorations or mid-month disputes.',
  },
  {
    q: 'How does the owner know about my skip request?',
    a: 'Instantly. When you skip, the delivery list updates in real-time. The owner just opens the dashboard in the morning — your name is either on the list or marked as skipped. Zero WhatsApp coordination needed.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'All payments go through Razorpay, which is PCI DSS compliant and trusted by thousands of Indian businesses. We never store your card details. Your payment history is visible only to you and the dairy owner.',
  },
]

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-white section-py" id="faq">
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="section-label justify-center">FAQ</p>
          <h2 className="text-heading text-teal-900 mb-4">
            Common questions answered
          </h2>
          <p className="text-body text-teal-900/55">
            Still have questions? Call us at{' '}
            <a href="tel:+919048571147" className="text-teal-700 font-semibold hover:underline">
              90485 71147
            </a>
          </p>
        </div>

        {/* FAQ accordion — 2 column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <div
      className={cn(
        'bg-milk-50 border rounded-[18px] overflow-hidden',
        'transition-all duration-200',
        isOpen ? 'border-teal-200' : 'border-milk-300'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between gap-4',
          'px-6 py-5 text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-inset'
        )}
        id={`faq-${index}`}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-small font-bold text-teal-900 leading-snug">{question}</span>
        <ChevronDown
          size={18}
          className={cn(
            'text-teal-700 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Smooth max-height animation — NOT display:none toggle */}
      <div
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-${index}`}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? '400px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p className="px-6 pb-5 text-small text-teal-900/60 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  )
}
