'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
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
  Heart,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'

function getIcon(name: string | null | undefined) {
  switch (name) {
    case '🌱': return <Sprout size={12} />
    case '🥣': return <Milk size={12} />
    case '🍯': return <Award size={12} />
    case '🍃': return <Leaf size={12} />
    case '🧀': return <Award size={12} />
    case '🥛': return <Milk size={11} />
    case '🧪': return <ShieldCheck size={11} />
    case '🛡️': return <ShieldCheck size={11} />
    case '🥄': return <Check size={11} />
    case '✨': return <Award size={11} />
    case '🗓️': return <Calendar size={11} />
    case '🔥': return <Flame size={11} />
    case '👋': return <Check size={11} />
    case '👃': return <Heart size={11} />
    case '❄️': return <Wind size={11} />
    case '🌿': return <Leaf size={11} />
    case '💪': return <Activity size={11} />
    case '☁️': return <Wind size={11} />
    default: return null
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DBProduct {
  id: string
  name: string
  category: string
  price: number
  unit: string
  image_url: string | null
  badge: string | null
  badge_icon: string | null
  tagline: string | null
  features: string[]
  features_icons: string[]
  is_subscription: boolean
  is_active: boolean
  display_order: number | null
  stock: number
  stock_available: number
}

// ─── Style maps (keyed by badge text from DB, with fallback) ─────────────────

const badgeClassMap: Record<string, string> = {
  'Farm Fresh':     'bg-emerald-50/90 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'Probiotic Rich': 'bg-sky-50/90 text-sky-700 border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  'Premium Quality':'bg-amber-50/90 text-amber-800 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  'Refreshing':     'bg-teal-50/90 text-teal-700 border-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  'High Protein':   'bg-indigo-50/90 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
}
const FALLBACK_BADGE_CLASS = 'bg-slate-50/90 text-slate-700 border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'

const BUTTON_CLASS = 'bg-gradient-to-r from-[#02429C] to-[#013378] hover:from-[#013378] hover:to-[#00255c] shadow-[0_4px_14px_rgba(2,66,156,0.22)] text-white'

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="relative flex flex-col w-full bg-white dark:bg-[#171923]/90 border border-[#F2EDE4]/70 dark:border-slate-800/60 rounded-[32px] overflow-hidden animate-pulse">
      <div className="w-full h-[260px] bg-slate-100 dark:bg-slate-800" />
      <div className="flex flex-col flex-1 px-5 pb-5 pt-4 space-y-3">
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mx-auto" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mx-auto" />
        <div className="flex gap-1.5 justify-center">
          {[1,2,3].map(i => <div key={i} className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />)}
        </div>
        <div className="mt-auto h-11 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductsPreview() {
  const [products, setProducts] = useState<DBProduct[]>([])
  const [milkPrice, setMilkPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/settings?key=price_per_litre').then(r => r.json()).catch(() => null),
    ]).then(([productData, settingsData]) => {
      if (productData.success && productData.products) {
        // Only show active products, sorted by display_order then created_at
        const active: DBProduct[] = productData.products
          .filter((p: DBProduct) => p.is_active)
          .sort((a: DBProduct, b: DBProduct) => {
            const ao = a.display_order ?? 9999
            const bo = b.display_order ?? 9999
            return ao !== bo ? ao - bo : 0
          })
        setProducts(active)
      }
      if (settingsData?.success && settingsData.value?.amount) {
        setMilkPrice(settingsData.value.amount)
      }
    }).catch(err => console.error('Failed to fetch products', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="products" className="bg-white py-16 md:py-24 relative overflow-hidden">
      <div className="container-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-[1px] bg-sky-200"></div>
              <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest flex items-center gap-1.5">
                OUR PRODUCTS
              </span>
              <div className="w-8 h-[1px] bg-sky-200"></div>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-4">
              Pure Uncompromised Royal
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Experience dairy crafted with devotion, certified pure
              and delivered to your doorstep fresh before sunrise.
            </p>
          </div>
        </ScrollReveal>

        {/* Slider */}
        <ScrollReveal direction="up" delay={150} duration={1000}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : (showAll ? products : products.slice(0, 8)).map((product) => {
                  // Price: subscription products use the milk price from settings if available
                  let displayPrice = `₹${product.price}`
                  let displayUnit = product.unit

                  if (product.is_subscription && milkPrice) {
                    displayPrice = `₹${milkPrice}`
                    displayUnit = 'Litre'
                  }

                  const features = Array.isArray(product.features) ? product.features : []
                  const featuresIcons = Array.isArray(product.features_icons) ? product.features_icons : []
                  const badgeCls = product.badge
                    ? (badgeClassMap[product.badge] ?? FALLBACK_BADGE_CLASS)
                    : FALLBACK_BADGE_CLASS

                  return (
                    <div
                      key={product.id}
                      className="relative flex flex-col w-full p-0 bg-white dark:bg-[#171923]/90 border border-[#F2EDE4]/70 dark:border-slate-800/60 rounded-[32px] shadow-[0_12px_30px_rgba(180,140,60,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(180,140,60,0.12)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-2 hover:border-amber-300/40 dark:hover:border-amber-500/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group overflow-hidden"
                    >
                      {/* Hover Glow Accent */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/0 via-amber-500/3 to-amber-500/0 dark:via-amber-500/6 rounded-[34px] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none z-0" />
                      
                      {/* Product Visual Area */}
                      <div className="w-full h-[260px] relative rounded-t-[30px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
                        
                        {/* Product Image */}
                        <div className="absolute inset-0 w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover"
                              priority
                            />
                          ) : (
                            // Emoji placeholder when no image has been uploaded yet
                            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                              <span className="text-7xl select-none opacity-60">
                                {product.badge_icon || '🥛'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Badge — only render if product has one */}
                        {product.badge && (
                          <div className={cn(
                            "absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-extrabold tracking-wider uppercase z-20 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border backdrop-blur-md",
                            badgeCls
                          )}>
                            <span className="flex items-center text-current">{getIcon(product.badge_icon)}</span>
                            <span>{product.badge}</span>
                          </div>
                        )}

                        {/* Soft light reflection overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-20" />
                      </div>

                      {/* Product Info */}
                      <div className="relative z-10 flex flex-col flex-1 px-5 pb-5 pt-4">
                        {/* Title & Tagline */}
                        <div className="mb-4 text-center">
                          <h3 className="font-playfair text-2xl font-extrabold text-slate-950 dark:text-white mb-1.5 tracking-tight transition-colors duration-300 group-hover:text-amber-650 dark:group-hover:text-amber-400">
                            {product.name}
                          </h3>
                          {product.tagline && (
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                              {product.tagline}
                            </p>
                          )}
                        </div>

                        {/* Feature Badges */}
                        {features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-5 justify-center">
                            {features.map((feat, idx) => (
                              <span 
                                key={feat}
                                className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#1f232f] border border-[#ECD8B0]/25 dark:border-slate-800 rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 hover:bg-[#F2ECE0] dark:hover:bg-[#272b38]"
                              >
                                <span className="text-amber-650 dark:text-amber-400 flex items-center">{getIcon(featuresIcons[idx])}</span>
                                <span>{feat}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Thin separator */}
                        <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full mb-4 mt-auto" />

                        {/* Pricing & CTA */}
                        <div className="flex items-center justify-between">
                          {/* Price */}
                          <div>
                            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                              Price
                            </p>
                            <p className="text-xl font-extrabold text-slate-950 dark:text-white font-mono-num leading-tight flex items-baseline">
                              {displayPrice} 
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">/ {displayUnit}</span>
                            </p>
                          </div>

                          {/* CTA Button */}
                          <Link href={product.is_subscription ? '/subscribe' : '/shop'}>
                            <button className={cn(
                              "h-11 px-5 rounded-full text-[13px] font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center gap-1.5 hover:scale-[1.03] active:scale-95 border-none cursor-pointer group/btn",
                              BUTTON_CLASS
                            )}>
                              <span>{product.is_subscription ? 'Subscribe' : 'Buy Now'}</span>
                              <span className="text-[14px] font-normal transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
                            </button>
                          </Link>
                        </div>
                      </div>

                    </div>
                  )
                })
            }
          </div>

          {!loading && products.length > 8 && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={() => setShowAll(!showAll)}
                className="px-8 py-3 rounded-full border-2 border-[#1230AE] text-[#1230AE] hover:bg-[#1230AE] hover:text-white font-bold transition-colors duration-300"
              >
                {showAll ? 'Show Less' : 'View All Products'}
              </button>
            </div>
          )}
        </ScrollReveal>

      </div>
    </section>
  )
}