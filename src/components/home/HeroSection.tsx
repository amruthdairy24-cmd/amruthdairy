'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, ShieldCheck, Truck, Users, Droplet, MapPin, Sparkles, ArrowRight, Play } from 'lucide-react'
import { TransparentImage } from '@/components/ui/TransparentImage'

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  const slides = [
    {
      src: '/images/image-hero.png',
      alt: 'Amruth Dairy Fresh Cow and Milk'
    },
    {
      src: '/images/cutout-2.png',
      alt: 'Amruth Dairy Premium Farm Fresh Milk Bottles'
    },
    {
      src: '/images/cutout-3.png',
      alt: 'Amruth Dairy Delicious Fresh Butter and Cheese'
    }
  ]

  useEffect(() => {
    setIsMounted(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000) // Transition slide every 6 seconds
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <section 
      id="home"
      style={{ 
        background: 'linear-gradient(to bottom, #F8FAFC 0%, #F1F5F9 60%, #ffffff 100%)', 
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: '110px',
        paddingBottom: '160px' // Space for floating stats bar
      }}
    >
      {/* Sky/Cloud background texture behind the cow on the right */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '80%',
          opacity: 0.6,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.8) 0%, transparent 70%)'
        }}
      />

      <div className="container-page relative z-10 w-full mb-12">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }} className="hero-grid">
          
          {/* LEFT: TEXT CONTENT (PREMIUM SERIF TYPOGRAPHY TO MATCH AGENCY DESIGN) */}
          <div style={{ zIndex: 10 }}>
            {/* Tag/Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(2, 132, 199, 0.12)',
              background: '#fff',
              borderRadius: '999px',
              padding: '6px 16px',
              color: '#0284C7',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '28px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.04)'
            }}>
              <ShieldCheck size={14} className="text-[#0284C7]" />
              100% Pure • Farm Fresh
            </div>

            {/* Headline (Playfair Display / Serif style from mockup) */}
            <h1 style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(2.5rem, 5.2vw, 4.5rem)',
              fontWeight: 500, // Medium elegant weight
              color: '#0F172A',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              marginBottom: '24px'
            }}>
              Fresh Milk <br />
              Delivered <br />
              <span style={{ color: '#0284C7' }}>Before Sunrise.</span>
            </h1>

            {/* Subheading */}
            <p style={{
              fontSize: '1.05rem',
              color: '#475569',
              lineHeight: 1.8,
              maxWidth: '520px',
              marginBottom: '36px',
              fontWeight: 400
            }}>
              Pure A2 Cow Milk delivered directly from our farm to your doorstep every morning. No preservatives. No compromise.
            </p>

            {/* Features (Elegant horizontal line style) */}
            <div style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '44px',
              flexWrap: 'wrap'
            }}>
              {/* Feature 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#F0F9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={18} className="text-[#0284C7]" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Pure &</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Natural</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#F0F9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Truck size={18} className="text-[#0284C7]" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Daily Fresh</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Delivery</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#F0F9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={18} className="text-[#0284C7]" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Direct</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>From Farm</span>
                </div>
              </div>
            </div>

             {/* Actions (Elegant 3D Bubble Soft Buttons matching image request) */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/subscribe"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '12px', // exact rounded corners from image
                  background: 'linear-gradient(to bottom, #0EA5E9 0%, #0369A1 100%)', // modern blue-indigo gradient
                  color: '#fff',
                  fontWeight: 500, // medium weight from image
                  fontSize: '0.95rem',
                  textTransform: 'none', // title-case from image
                  textDecoration: 'none',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 4px 12px rgba(3, 105, 161, 0.2)',
                  border: '1px solid rgba(3, 105, 161, 0.15)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                className="hover:scale-105 hover:shadow-lg"
              >
                Subscribe
                <ArrowRight size={16} strokeWidth={1.8} />
              </Link>

              {/* Styled like play-button link from mockup */}
              <Link
                href="#our-story"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  height: '52px',
                  background: 'transparent',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  transition: 'transform 0.2s'
                }}
                className="hover:scale-105 group"
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1.5px solid #0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284C7',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)',
                  transition: 'background-color 0.2s'
                }} className="group-hover:bg-[#F0F9FF]">
                  <Play size={14} fill="#0284C7" style={{ marginLeft: '2px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>Watch Our Story</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#475569', textTransform: 'none', letterSpacing: 0 }}>Watch Reels</span>
                </div>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN SPACER FOR DESKTOP ABSOLUTE POSITIONING */}
          <div className="hidden md:block" />

        </div>
      </div>

      {/* ABSOLUTE POSITIONED GIANT IMAGE SHOWCASE - BLEEDS TO RIGHT OF SCREEN */}
      <div 
        style={{ 
          position: 'absolute', 
          right: '20px', 
          bottom: '115px', 
          width: '46vw', 
          height: '700px', 
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          overflow: 'visible',
          zIndex: 2,
          pointerEvents: 'none'
        }} 
        className="hero-img-container"
      >
        {/* Render both cutout images with butter smooth slider transitions */}
        {slides.map((slide, index) => {
          const isActive = currentSlide === index
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isActive && isMounted ? 1 : 0,
                transform: isActive && isMounted 
                  ? 'translate3d(0, 0, 0) scale(1)' 
                  : 'translate3d(50px, 0, 0) scale(0.96)',
                transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: isActive ? 2 : 1,
                visibility: isActive || (isMounted && Math.abs(currentSlide - index) === 1) ? 'visible' : 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end'
              }}
            >
              <TransparentImage 
                src={slide.src} 
                alt={slide.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '700px',
                  pointerEvents: 'auto'
                }}
              />
            </div>
          )
        })}

        {/* Floating Tomorrow Delivery Card */}
        <div style={{
          position: 'absolute',
          bottom: '70px',
          left: '60px', // Overlay on the left side of the splash composition
          zIndex: 12,
          background: '#fff',
          borderRadius: '20px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.16)',
          border: '1px solid rgba(15, 23, 42, 0.04)',
          pointerEvents: 'auto'
        }} className="floating-delivery-card">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#F0F9FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} className="text-[#0284C7]" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Tomorrow Delivery</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>6:00 AM</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before Sunrise</span>
          </div>
        </div>

        {/* Slide Indicators / Dots */}
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 15,
          pointerEvents: 'auto'
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? '24px' : '8px',
                height: '8px',
                borderRadius: '999px',
                background: currentSlide === idx ? '#0284C7' : 'rgba(2, 132, 199, 0.25)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* SVG Milk Curve Wave Bottom Divider - Merges smoothly with bottom white panels */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0,
          transform: 'rotate(180deg)',
          zIndex: 5
        }}
      >
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '90px' }}>
          <path d="M0,0 C150,90 350,10 600,70 C850,120 1050,40 1200,0 L1200,120 L0,120 Z" style={{ fill: '#F8FAFC' }}></path>
        </svg>
      </div>

      {/* FLOATING STATS BAR */}
      <div 
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '1100px',
          background: '#fff',
          borderRadius: '24px',
          padding: '24px 40px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(15, 23, 42, 0.04)',
          zIndex: 20
        }}
        className="hero-stats-bar"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }} className="stats-grid">
          {/* Stat 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="stat-item">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={22} className="text-white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>5000+</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Happy Families</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="stat-item">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#0EA5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Droplet size={22} className="text-white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>100%</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Pure Milk</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="stat-item">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={22} className="text-white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>50+</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Healthy Cows</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="stat-item">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={22} className="text-white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>Daily</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>On-Time Delivery</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 32px !important;
          }
          .hero-grid > div {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-img-container {
            position: relative !important;
            bottom: auto !important;
            right: auto !important;
            left: auto !important;
            height: 480px !important;
            width: 100% !important;
            max-width: 500px !important;
          }
          .floating-delivery-card {
            bottom: 20px !important;
            left: 20px !important;
            padding: 10px 16px !important;
          }
          .hero-stats-bar {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            transform: none !important;
            width: 100% !important;
            margin-top: 40px !important;
            padding: 24px !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 500px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}