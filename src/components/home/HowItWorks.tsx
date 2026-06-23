'use client'

import Image from 'next/image'
import { Check, ShieldCheck, Heart, Clock, Award } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HowItWorks() {
  return (
    <section id="about-us" style={{ background: '#fff', padding: '120px 0' }}>
      <div className="container-page">
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '64px', alignItems: 'center' }} className="why-grid">
          
          {/* LEFT: TEXT & INFO WITH SCROLL REVEAL */}
          <ScrollReveal direction="right" delay={0} duration={1000}>
            <div>
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
                Why Choose Amruth Dairy
              </div>

              <h2 style={{ 
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 'clamp(2rem, 3.8vw, 3rem)', 
                fontWeight: 500, 
                color: '#0F172A', 
                letterSpacing: '-0.01em', 
                lineHeight: 1.2, 
                marginBottom: '36px' 
              }}>
                Purity You Can Trust,<br /> Care You Can Taste.
              </h2>

              {/* 4 Feature Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px 28px', marginBottom: '44px' }} className="features-grid-custom">
                
                {/* Feature 1 */}
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#F0F9FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Heart size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>Healthy Cows</h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                      Our cows are fed with natural fodder and cared with love.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#F0F9FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>Hygienic Milking</h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                      Modern equipment and hygienic milking process.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#F0F9FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>Quality Checked</h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                      Every drop is tested for purity before delivery.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#F0F9FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>On-Time Delivery</h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                      Delivered early morning to keep it fresh.
                    </p>
                  </div>
                </div>

              </div>

              <button style={{
                height: '48px',
                padding: '0 32px',
                borderRadius: '12px', // Match 12px rounded style
                background: 'linear-gradient(to bottom, #0EA5E9 0%, #0369A1 100%)',
                color: '#fff',
                border: '1px solid rgba(3, 105, 161, 0.15)',
                fontWeight: 500, // Medium weight
                fontSize: '0.95rem',
                textTransform: 'none', // Title case
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 4px 12px rgba(3, 105, 161, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }} className="hover:scale-105 hover:shadow-lg">
                Know More About Us
              </button>
            </div>
          </ScrollReveal>

          {/* RIGHT: BEAUTIFUL IMAGE & FLOATING CARD WITH SCROLL REVEAL */}
          <ScrollReveal direction="left" delay={200} duration={1000}>
            <div style={{ position: 'relative' }} className="why-img-container" id="farm-visit">
              
              {/* Main Image */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '400px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04)'
              }}>
                <Image 
                  src="/images/amruth_farm_gate.png"
                  alt="Amruth Dairy Farm gate"
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              {/* Overlapping Floating Box */}
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                right: '-20px',
                background: '#fff',
                borderRadius: '20px',
                padding: '32px 28px',
                width: '280px',
                boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
                border: '1.5px solid rgba(236, 216, 176, 0.6)',
                zIndex: 20
              }} className="floating-visit-card">
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  color: '#0284C7', 
                  textTransform: 'uppercase', 
                  display: 'block', 
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}>
                  Visit Our Farm
                </span>
                <h4 style={{ 
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1.15rem', 
                  fontWeight: 600, 
                  color: '#0F172A', 
                  marginBottom: '16px', 
                  lineHeight: 1.3 
                }}>
                  See Where Your Milk Comes From.
                </h4>
                
                {/* Bullet list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {[
                    'Guided Farm Tour',
                    'Meet Our Cows',
                    'Understand Our Process'
                  ].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={12} className="text-[#0284C7]" style={{ strokeWidth: 3.5 }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to bottom, #0EA5E9 0%, #0369A1 100%)',
                  color: '#fff',
                  border: '1px solid rgba(3, 105, 161, 0.15)',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 4px 12px rgba(3, 105, 161, 0.15)',
                  transition: 'transform 0.2s'
                }} className="hover:scale-[1.02]">
                  Book Your Visit
                </button>
              </div>

            </div>
          </ScrollReveal>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .why-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .floating-visit-card {
            position: relative !important;
            bottom: 0 !important;
            right: 0 !important;
            width: 100% !important;
            margin-top: 24px !important;
            box-sizing: border-box !important;
          }
        }
        @media (max-width: 480px) {
          .features-grid-custom {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
