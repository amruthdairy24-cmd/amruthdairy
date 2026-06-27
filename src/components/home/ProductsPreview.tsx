'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'

function getIcon(name: string) {
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

interface ProductItem {
  name: string
  price: string
  unit: string
  image: string
  badge: string
  badgeIcon: string
  tagline: string
  features: string[]
  featuresIcons: string[]
  isSubscription: boolean
}

const products: ProductItem[] = [
  {
    name: 'Cow Milk',
    price: '₹60',
    unit: 'Litre',
    image: '/images/amruth_product_milk.png',
    badge: 'Farm Fresh',
    badgeIcon: '🌱',
    tagline: 'Delivered Before Sunrise',
    features: ['100% Pure', 'No Additives', 'A2 Certified'],
    featuresIcons: ['🥛', '🧪', '🛡️'],
    isSubscription: true,
  },
  {
    name: 'Fresh Curd',
    price: '₹40',
    unit: '500ml',
    image: '/images/amruth_product_curd.png',
    badge: 'Probiotic Rich',
    badgeIcon: '🥣',
    tagline: 'Made from A2 Cow Milk',
    features: ['Rich & Thick', 'Good for Gut', 'Daily Fresh'],
    featuresIcons: ['🥄', '✨', '🗓️'],
    isSubscription: false,
  },
  {
    name: 'Pure Cow Ghee',
    price: '₹450',
    unit: '500ml',
    image: '/images/amruth_product_ghee.png',
    badge: 'Premium Ghee',
    badgeIcon: '🍯',
    tagline: 'Traditional Bilona Ghee',
    features: ['100% Pure', 'Hand Crafted', 'Aromatic'],
    featuresIcons: ['🔥', '👋', '👃'],
    isSubscription: false,
  },
  {
    name: 'Buttermilk',
    price: '₹30',
    unit: '500ml',
    image: '/images/amruth_product_buttermilk.png',
    badge: 'Refreshing',
    badgeIcon: '🍃',
    tagline: 'Traditional & Refreshing',
    features: ['Cool & Light', 'Good Digest', 'Daily Fresh'],
    featuresIcons: ['❄️', '🌿', '🗓️'],
    isSubscription: false,
  },
  {
    name: 'Fresh Paneer',
    price: '₹90',
    unit: '200gm',
    image: '/images/amruth_product_paneer.png',
    badge: 'High Protein',
    badgeIcon: '🧀',
    tagline: 'Soft, Pure & Protein Rich',
    features: ['100% Pure', 'High Protein', 'Soft & Fresh'],
    featuresIcons: ['🥛', '💪', '☁️'],
    isSubscription: false,
  },
]

const badgeClassMap: Record<string, string> = {
  'Farm Fresh':    'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Probiotic Rich':'bg-sky-50 text-sky-700 border-sky-200',
  'Premium Ghee':  'bg-amber-50 text-amber-700 border-amber-200',
  'Refreshing':    'bg-teal-50 text-teal-700 border-teal-200',
  'High Protein':  'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export function ProductsPreview() {
  const [dynamicPrices, setDynamicPrices] = useState<{ [key: string]: { price: number; unit: string } }>({})
  const [milkPrice, setMilkPrice] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.products) {
          const priceMap: any = {}
          data.products.forEach((p: any) => {
            priceMap[p.name] = { price: p.price, unit: p.unit }
          })
          setDynamicPrices(priceMap)
        }
      })
      .catch(() => {})

    fetch('/api/admin/settings?key=price_per_litre')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.value?.amount) setMilkPrice(data.value.amount)
      })
      .catch(() => {})
  }, [])

  return (
    <section id="products" className="bg-white py-20 relative overflow-hidden">
      <div className="container-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 border border-[#1230AE]/20 text-[#1230AE] rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest mb-4">
              <Award size={11} /> Our Products
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              Pure Uncompromised Royal
            </h2>
            <p className="text-sm text-slate-500 max-w-[520px] mx-auto leading-relaxed">
              Experience dairy crafted with devotion, certified pure
              and delivered to your doorstep fresh before sunrise.
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <ScrollReveal direction="up" delay={150} duration={1000}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => {
              let displayPrice = product.price
              let displayUnit = product.unit

              if (product.name === 'Cow Milk' && milkPrice) {
                displayPrice = `₹${milkPrice}`
                displayUnit = 'Litre'
              } else if (dynamicPrices[product.name]) {
                displayPrice = `₹${dynamicPrices[product.name].price}`
                displayUnit = dynamicPrices[product.name].unit
              }

              return (
                <div
                  key={product.name}
                  className="relative flex flex-col bg-white border border-slate-100 rounded-2xl shadow-[0_2px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                >
                  {/* Image — full width */}
                  <div className="relative w-full aspect-square bg-[#F8FAFC] overflow-hidden">
                    {/* Badge */}
                    <div className={cn(
                      'absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border z-10',
                      badgeClassMap[product.badge]
                    )}>
                      <span className="flex items-center">{getIcon(product.badgeIcon)}</span>
                      <span className="hidden sm:inline">{product.badge}</span>
                    </div>

                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 px-3 pb-3 pt-2.5">

                    <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-900 leading-tight mb-0.5">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-2 leading-snug">
                      {product.tagline}
                    </p>

                    {/* Features */}
                    <div className="hidden sm:flex flex-col gap-1 mb-3">
                      {product.features.map((feat, idx) => (
                        <div key={feat} className="flex items-center gap-1">
                          <span className="text-[#1230AE] flex items-center flex-shrink-0">
                            {getIcon(product.featuresIcons[idx])}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 mb-2.5" />

                    {/* Price */}
                    <div className="mb-2">
                      <p className="text-[16px] font-extrabold text-slate-900 leading-none">
                        {displayPrice}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">/ {displayUnit}</p>
                    </div>

                    {/* CTA */}
                    {product.isSubscription ? (
                      <Link href="/subscribe" className="w-full">
                        <button className="w-full h-8 rounded-full bg-[#1230AE] text-white text-[11px] font-semibold shadow-[0_4px_12px_rgba(18,48,174,0.25)] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer border-none">
                          Subscribe
                        </button>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {}}
                          className="h-8 flex-1 rounded-full bg-white border border-[#1230AE]/30 text-[#1230AE] text-[10px] font-semibold hover:bg-[#1230AE]/5 hover:border-[#1230AE] active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
                        >
                          + Cart
                        </button>
                        <Link href="/shop" className="flex-1">
                          <button className="w-full h-8 rounded-full bg-[#1230AE] text-white text-[10px] font-semibold shadow-[0_4px_12px_rgba(18,48,174,0.25)] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer border-none">
                            Buy Now
                          </button>
                        </Link>
                      </div>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}