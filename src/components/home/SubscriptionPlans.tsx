'use client'

import Link from 'next/link'
import { Check, Milk } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const features = [
  '1 Litre Daily Fresh Delivery',
  'Flexible: Add extra or skip anytime',
  '100% Pure A2 Cow Milk',
  'No Hidden Charges',
  'Secure Online Payments'
]

export function SubscriptionPlans() {
  return (
    <section 
      id="plans" 
      style={{ 
        background: 'linear-gradient(to bottom, #F8FAFC 0%, #FDFBF7 60%, #ffffff 100%)', 
        padding: '120px 0',
        position: 'relative'
      }}
    >
      {/* Top Cream wave decoration */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '24px',
          background: '#F8FAFC'
        }}
      />

      <div className="container-page relative z-10 max-w-4xl mx-auto">
        {/* Header (Bespoke Editorial Serif Style with Scroll Reveal) */}
        <ScrollReveal direction="up" delay={0}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#fff',
              border: '1.5px solid rgba(2, 132, 199, 0.15)',
              color: '#0284C7',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '18px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.04)'
            }}>
              Standard Subscription
            </div>
            <h2 style={{ 
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(2rem, 3.8vw, 3rem)', 
              fontWeight: 500, 
              color: '#0F172A', 
              letterSpacing: '-0.01em', 
              lineHeight: 1.2, 
              marginBottom: '16px' 
            }}>
              One Simple Plan. Full Flexibility.
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: '#475569', 
              fontWeight: 500,
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              We believe in keeping things simple. A standard 1 Litre daily delivery, with complete freedom to adjust as needed.
            </p>
          </div>
        </ScrollReveal>

        {/* Single Wide Plan Card */}
        <ScrollReveal direction="up" delay={150} duration={900}>
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '0',
              border: '2px solid #0284C7',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(2, 132, 199, 0.08)',
              overflow: 'hidden'
            }}
            className="md:flex-row items-stretch"
          >
            {/* Left/Top Side: Details & Pricing */}
            <div className="flex-1 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
              <div style={{
                display: 'inline-flex',
                background: '#0284C7',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '6px 16px',
                borderRadius: '999px',
                letterSpacing: '0.08em',
                marginBottom: '24px',
                width: 'fit-content',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
              }}>
                Standard Monthly
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(2, 132, 199, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284C7'
                }}>
                  <Milk size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>1 Litre / Day</h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '32px 0' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  ₹1,699
                </span>
                <span style={{ fontSize: '1rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  / month
                </span>
              </div>

              <Link href="/subscribe" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: '100%',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to bottom, #0EA5E9 0%, #0369A1 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 8px 20px rgba(3, 105, 161, 0.25)',
                  border: '1px solid rgba(3, 105, 161, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Subscription
                </div>
              </Link>
            </div>

            {/* Right/Bottom Side: Features */}
            <div className="flex-1 bg-slate-50/50 p-8 sm:p-12 flex flex-col justify-center">
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '24px' }}>
                Everything you need
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {features.map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '1rem', color: '#475569', fontWeight: 600 }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
