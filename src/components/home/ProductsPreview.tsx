'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Sprout,
  Milk,
  ShieldCheck,
  Flame,
  Calendar,
  Leaf,
  Award,
  Activity,
  Wind,
  Heart
} from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

function getIcon(name: string) {
  switch (name) {
    // Badges
    case '🌱': return <Sprout size={14} />
    case '🥣': return <Milk size={14} />
    case '🍯': return <Award size={14} />
    case '🍃': return <Leaf size={14} />
    case '🧀': return <Award size={14} />
    // Features
    case '🥛': return <Milk size={12} />
    case '🧪': return <ShieldCheck size={12} />
    case '🛡️': return <ShieldCheck size={12} />
    case '🥄': return <Check size={12} />
    case '✨': return <Award size={12} /> // Sparkles restricted, using Award
    case '🗓️': return <Calendar size={12} />
    case '🔥': return <Flame size={12} />
    case '👋': return <Check size={12} />
    case '👃': return <Heart size={12} />
    case '❄️': return <Wind size={12} />
    case '🌿': return <Leaf size={12} />
    case '💪': return <Activity size={12} />
    case '☁️': return <Wind size={12} />
    default: return null
  }
}

interface ProductItem {
  name: string
  volume: string
  price: string
  unit: string
  image: string
  badge: string
  badgeIcon: string
  badgeBg: string
  badgeTextColor: string
  badgeBorder: string
  tagline: string
  features: string[]
  featuresIcons: string[]
  gradient: string
  accentColor: string
  accentLight: string
  buttonColor: string
  isSubscription: boolean
}

const products: ProductItem[] = [
  {
    name: 'A2 Cow Milk',
    volume: '500ml / 1L / 2L',
    price: '₹60',
    unit: 'Litre',
    image: '/images/amruth_product_milk.png',
    badge: 'Farm Fresh',
    badgeIcon: '🌱',
    badgeBg: 'rgba(220, 252, 231, 0.65)',
    badgeTextColor: '#15803d',
    badgeBorder: 'rgba(22, 163, 74, 0.2)',
    tagline: 'Delivered Before Sunrise',
    features: ['100% Pure', 'No Additives', 'A2 Certified'],
    featuresIcons: ['🥛', '🧪', '🛡️'],
    gradient: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5E6 100%)',
    accentColor: '#0284C7',
    accentLight: 'rgba(2, 132, 199, 0.08)',
    buttonColor: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    isSubscription: true
  },
  {
    name: 'Fresh Curd',
    volume: '500ml',
    price: '₹40',
    unit: '500ml',
    image: '/images/amruth_product_curd.png',
    badge: 'Probiotic Rich',
    badgeIcon: '🥣',
    badgeBg: 'rgba(219, 234, 254, 0.65)',
    badgeTextColor: '#0369A1',
    badgeBorder: 'rgba(37, 99, 235, 0.2)',
    tagline: 'Made from A2 Cow Milk',
    features: ['Rich & Thick', 'Good for Gut', 'Daily Fresh'],
    featuresIcons: ['🥄', '✨', '🗓️'],
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%)',
    accentColor: '#0369A1',
    accentLight: 'rgba(3, 105, 161, 0.08)',
    buttonColor: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    isSubscription: false
  },
  {
    name: 'Pure Cow Ghee',
    volume: '500ml',
    price: '₹450',
    unit: '500ml',
    image: '/images/amruth_product_ghee.png',
    badge: 'Premium Quality',
    badgeIcon: '🍯',
    badgeBg: 'rgba(254, 243, 199, 0.65)',
    badgeTextColor: '#b45309',
    badgeBorder: 'rgba(217, 119, 6, 0.2)',
    tagline: 'Traditional Pure Ghee',
    features: ['100% Pure', 'Hand Crafted', 'Aromatic'],
    featuresIcons: ['🔥', '👋', '👃'],
    gradient: 'linear-gradient(135deg, #FFFDF4 0%, #FEF7DC 100%)',
    accentColor: '#b45309',
    accentLight: 'rgba(180, 83, 9, 0.08)',
    buttonColor: 'linear-gradient(135deg, #A16207 0%, #CA8A04 100%)',
    isSubscription: false
  },
  {
    name: 'Buttermilk',
    volume: '500ml',
    price: '₹30',
    unit: '500ml',
    image: '/images/amruth_product_buttermilk.png',
    badge: 'Refreshing',
    badgeIcon: '🍃',
    badgeBg: 'rgba(240, 253, 244, 0.65)',
    badgeTextColor: '#166534',
    badgeBorder: 'rgba(22, 101, 52, 0.2)',
    tagline: 'Traditional & Refreshing',
    features: ['Cool & Light', 'Good Digest', 'Daily Fresh'],
    featuresIcons: ['❄️', '🌿', '🗓️'],
    gradient: 'linear-gradient(135deg, #F4FBF7 0%, #E6F7ED 100%)',
    accentColor: '#166534',
    accentLight: 'rgba(22, 101, 52, 0.08)',
    buttonColor: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
    isSubscription: false
  },
  {
    name: 'Fresh Paneer',
    volume: '200g',
    price: '₹90',
    unit: '200gm',
    image: '/images/amruth_product_paneer.png',
    badge: 'High Protein',
    badgeIcon: '🧀',
    badgeBg: 'rgba(243, 232, 255, 0.65)',
    badgeTextColor: '#6b21a8',
    badgeBorder: 'rgba(147, 51, 234, 0.2)',
    tagline: 'Soft, Pure & Protein Rich',
    features: ['100% Pure', 'High Protein', 'Soft & Fresh'],
    featuresIcons: ['🥛', '💪', '☁️'],
    gradient: 'linear-gradient(135deg, #FAF5FF 0%, #F5EBFF 100%)',
    accentColor: '#6b21a8',
    accentLight: 'rgba(107, 33, 168, 0.08)',
    buttonColor: 'linear-gradient(135deg, #581C87 0%, #7E22CE 100%)',
    isSubscription: false
  }
]

export function ProductsPreview() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [dynamicPrices, setDynamicPrices] = useState<{ [key: string]: { price: number, unit: string } }>({})
  const [milkPrice, setMilkPrice] = useState<number | null>(null)

  useEffect(() => {
    // Fetch extra products
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products) {
          const priceMap: any = {}
          data.products.forEach((p: any) => {
            priceMap[p.name] = { price: p.price, unit: p.unit }
          })
          setDynamicPrices(priceMap)
        }
      })
      .catch(err => console.error("Failed to fetch products", err))

    // Fetch milk price
    fetch('/api/admin/settings?key=price_per_litre')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value?.amount) {
          setMilkPrice(data.value.amount)
        }
      })
      .catch(err => console.error("Failed to fetch milk price", err))
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current
      const scrollTo = direction === 'left' ? scrollLeft - 380 : scrollLeft + 380
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <section 
      id="products" 
      style={{ 
        background: 'linear-gradient(to bottom, #FFFDF7 0%, #FFFDF9 50%, #ffffff 100%)', 
        padding: '120px 0', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Premium subtle background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(253, 246, 227, 0.5) 0%, rgba(253, 246, 227, 0) 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="container-page" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <ScrollReveal direction="up" delay={0}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#fff',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              color: '#B45309',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(180, 83, 9, 0.03)'
            }}>
              <Award size={12} style={{ marginRight: '6px' }} /> Our Products
            </div>
            <h2 style={{ 
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', 
              fontWeight: 500, 
              color: '#0F172A', 
              letterSpacing: '-0.02em', 
              lineHeight: 1.15, 
              marginBottom: '20px' 
            }}>
              Pure. Uncompromised. Royal.
            </h2>
            <p style={{ 
              fontSize: '1.05rem', 
              color: '#475569', 
              fontWeight: 500,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Experience dairy crafted with devotion, certified pure, and delivered to your doorstep fresh before sunrise.
            </p>
          </div>
        </ScrollReveal>

        {/* Slider Wrapper */}
        <ScrollReveal direction="up" delay={150} duration={1000}>
          <div style={{ position: 'relative', padding: '0 40px' }}>
            
            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              style={{
                position: 'absolute',
                left: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
                color: '#0F172A',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              style={{
                display: 'flex',
                gap: '32px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                padding: '24px 8px',
                scrollSnapType: 'x mandatory'
              }}
              className="products-scroll-container"
            >
              {products.map((product) => {
                let displayPrice = product.price
                let displayUnit = product.unit

                if (product.name === 'A2 Cow Milk' && milkPrice) {
                  displayPrice = `₹${milkPrice}`
                  displayUnit = 'Litre'
                } else if (dynamicPrices[product.name]) {
                  displayPrice = `₹${dynamicPrices[product.name].price}`
                  displayUnit = dynamicPrices[product.name].unit
                }

                return (
                <div
                  key={product.name}
                  style={{
                    background: '#ffffff',
                    borderRadius: '32px',
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                    minWidth: '350px',
                    width: '350px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    scrollSnapAlign: 'start',
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.03)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  className="product-card hover:-translate-y-2 hover:shadow-2xl hover:border-amber-300/40 group"
                >
                  
                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    left: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: product.badgeBg,
                    color: product.badgeTextColor,
                    border: `1px solid ${product.badgeBorder}`,
                    borderRadius: '99px',
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    <span className="flex items-center">{getIcon(product.badgeIcon)}</span>
                    <span>{product.badge}</span>
                  </div>

                  {/* Product Visual Area */}
                  <div style={{
                    width: '100%',
                    height: '240px',
                    position: 'relative',
                    marginBottom: '20px',
                    borderRadius: '24px',
                    background: product.gradient,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Realistic milk splash effect behind bottle */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.18,
                      mixBlendMode: 'multiply',
                      backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, transparent 80%)',
                      zIndex: 1
                    }} />

                    {/* Styled white splash vector path */}
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{
                      position: 'absolute',
                      width: '90%',
                      height: '90%',
                      opacity: 0.9,
                      zIndex: 2,
                      transform: 'scale(1.15) rotate(15deg)'
                    }}>
                      <path fill="#ffffff" d="M37.5,-49.2C50.2,-41.8,63.1,-32.4,69.5,-19.1C75.8,-5.8,75.6,11.3,69.7,25.8C63.8,40.4,52.3,52.3,38.3,59.3C24.3,66.3,7.9,68.4,-7.8,66.1C-23.5,63.8,-38.4,57.1,-49.7,46.4C-61,35.7,-68.6,21,-70.6,5.7C-72.6,-9.7,-68.9,-25.6,-60.1,-37.2C-51.3,-48.9,-37.4,-56.3,-24.1,-62.1C-10.7,-67.9,2,-72,13.4,-68.6C24.8,-65.2,24.8,-56.7,37.5,-49.2Z" transform="translate(100 100)" />
                    </svg>

                    {/* Floating Product Image */}
                    <div 
                      style={{
                        position: 'relative',
                        width: '85%',
                        height: '85%',
                        zIndex: 3,
                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="group-hover:scale-105 group-hover:-translate-y-1"
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 350px"
                        style={{ objectFit: 'contain' }}
                        priority
                      />
                    </div>

                    {/* Soft light gold light reflection */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(to top, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
                      pointerEvents: 'none',
                      zIndex: 4
                    }} />
                  </div>

                  {/* Glassmorphism Product Details Card */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.7)',
                    borderRadius: '24px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.01)',
                    marginTop: 'auto'
                  }}>
                    {/* Title & Tagline */}
                    <div>
                      <h3 style={{ 
                        fontFamily: 'var(--font-playfair), Georgia, serif',
                        fontSize: '1.35rem', 
                        fontWeight: 600, 
                        color: '#0F172A', 
                        marginBottom: '4px',
                        letterSpacing: '-0.01em'
                      }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                        {product.tagline}
                      </p>
                    </div>

                    {/* Badges/Features row */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {product.features.map((feat, idx) => (
                        <span 
                          key={feat}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#F8F6F0',
                            border: '1px solid rgba(236, 216, 176, 0.5)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#5c4e37'
                          }}
                        >
                          <span className="flex items-center">{getIcon(product.featuresIcons[idx])}</span>
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>

                    {/* Horizontal Divider */}
                    <div style={{ height: '1px', background: 'rgba(236, 216, 176, 0.35)' }} />

                    {/* Bottom Pricing & CTA */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'between',
                      width: '100%'
                    }}>
                      {/* Price */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          Price
                        </p>
                        <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
                          {product.price} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>/ {product.unit}</span>
                        </p>
                      </div>

                      {/* Subscribe / Buy Now Button */}
                      <Link href={product.isSubscription ? "/subscribe" : "/shop"}>
                        <button style={{
                          height: '46px',
                          padding: '0 22px',
                          borderRadius: '14px',
                          background: product.buttonColor,
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 16px rgba(15, 23, 42, 0.08)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }} className="hover:scale-[1.03] hover:shadow-lg active:scale-95">
                          {product.isSubscription ? 'Subscribe' : 'Buy Now'}
                          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>→</span>
                        </button>
                      </Link>
                    </div>
                  </div>

                </div>
              )})}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll('right')}
              style={{
                position: 'absolute',
                right: -10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
                color: '#0F172A',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>

          </div>
        </ScrollReveal>
      </div>

      <style>{`
        .products-scroll-container::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 600px) {
          .products-scroll-container {
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  )
}
