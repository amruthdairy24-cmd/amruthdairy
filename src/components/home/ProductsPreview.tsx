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
import { cn } from '@/lib/utils'

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
    case '✨': return <Award size={12} />
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
  tagline: string
  features: string[]
  featuresIcons: string[]
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
    tagline: 'Delivered Before Sunrise',
    features: ['100% Pure', 'No Additives', 'A2 Certified'],
    featuresIcons: ['🥛', '🧪', '🛡️'],
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
    tagline: 'Made from A2 Cow Milk',
    features: ['Rich & Thick', 'Good for Gut', 'Daily Fresh'],
    featuresIcons: ['🥄', '✨', '🗓️'],
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
    tagline: 'Traditional Pure Ghee',
    features: ['100% Pure', 'Hand Crafted', 'Aromatic'],
    featuresIcons: ['🔥', '👋', '👃'],
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
    tagline: 'Traditional & Refreshing',
    features: ['Cool & Light', 'Good Digest', 'Daily Fresh'],
    featuresIcons: ['❄️', '🌿', '🗓️'],
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
    tagline: 'Soft, Pure & Protein Rich',
    features: ['100% Pure', 'High Protein', 'Soft & Fresh'],
    featuresIcons: ['🥛', '💪', '☁️'],
    isSubscription: false
  }
]

// Tailwind class mappings to eliminate dynamic inline styles from the data loop
const badgeClassMap: Record<string, string> = {
  'Farm Fresh': 'bg-green-50/70 text-green-700 border-green-200/50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  'Probiotic Rich': 'bg-blue-50/70 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  'Premium Quality': 'bg-amber-50/75 text-amber-800 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  'Refreshing': 'bg-green-55/70 text-green-800 border-green-200/50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  'High Protein': 'bg-purple-50/70 text-purple-750 border-purple-200/50 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
}

const gradientClassMap: Record<string, string> = {
  'A2 Cow Milk': 'bg-gradient-to-br from-[#FFFDF9] to-[#FAF5E6] dark:from-[#1e1a0f] dark:to-[#17140a]',
  'Fresh Curd': 'bg-gradient-to-br from-[#F8FAFC] to-[#EDF2F7] dark:from-[#171923] dark:to-[#0f1115]',
  'Pure Cow Ghee': 'bg-gradient-to-br from-[#FFFDF4] to-[#FEF7DC] dark:from-[#1a180f] dark:to-[#13110a]',
  'Buttermilk': 'bg-gradient-to-br from-[#F4FBF7] to-[#E6F7ED] dark:from-[#0f1d15] dark:to-[#0a140e]',
  'Fresh Paneer': 'bg-gradient-to-br from-[#FAF5FF] to-[#F5EBFF] dark:from-[#1a0f2e] dark:to-[#120a21]',
}

const buttonClassMap: Record<string, string> = {
  'A2 Cow Milk': 'bg-gradient-to-br from-slate-900 to-slate-850 hover:from-slate-800 hover:to-slate-750 dark:from-teal-700 dark:to-teal-800 dark:hover:from-teal-650 dark:hover:to-teal-750',
  'Fresh Curd': 'bg-gradient-to-br from-slate-900 to-slate-850 hover:from-slate-800 hover:to-slate-750 dark:from-teal-700 dark:to-teal-800 dark:hover:from-teal-650 dark:hover:to-teal-750',
  'Pure Cow Ghee': 'bg-gradient-to-br from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500',
  'Buttermilk': 'bg-gradient-to-br from-green-700 to-green-800 hover:from-green-600 hover:to-green-700',
  'Fresh Paneer': 'bg-gradient-to-br from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600',
}

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
      className="bg-gradient-to-b from-[#FFFDF7] via-[#FFFDF9] to-white dark:from-[#0f1115] dark:via-[#171923] dark:to-[#0f1115] py-28 relative overflow-hidden"
    >
      {/* Premium subtle background glow */}
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(253,246,227,0.5)_0%,rgba(253,246,227,0)_70%)] dark:bg-[radial-gradient(circle,rgba(30,35,45,0.3)_0%,transparent_70%)] rounded-full blur-[60px] z-0 pointer-events-none" />

      <div className="container-page relative z-10">
        
        {/* Header */}
        <ScrollReveal direction="up" delay={0}>
          <div className="text-center mb-20 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-warm-white border border-amber-500/20 text-[#B45309] dark:text-amber-450 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] mb-5 shadow-[0_4px_12px_rgba(180,83,9,0.03)]">
              <Award size={12} /> Our Products
            </div>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium text-slate-950 dark:text-white tracking-tight leading-none mb-5">
              Pure. Uncompromised. Royal.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-brown-600 font-medium max-w-[600px] mx-auto">
              Experience dairy crafted with devotion, certified pure, and delivered to your doorstep fresh before sunrise.
            </p>
          </div>
        </ScrollReveal>

        {/* Slider Wrapper */}
        <ScrollReveal direction="up" delay={150} duration={1000}>
          <div className="relative px-10">
            
            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 md:-left-2 top-1/2 -translate-y-1/2 w-13 h-13 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-950/8 dark:border-border flex items-center justify-center cursor-pointer z-10 shadow-[0_10px_25px_rgba(15,23,42,0.06)] text-slate-950 dark:text-white hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95 transition-all duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-8 overflow-x-auto hide-scrollbar py-6 px-2 scroll-smooth snap-x snap-mandatory"
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
                    className="relative flex flex-col w-[350px] min-w-[350px] p-6 bg-white dark:bg-slate-900 border border-amber-500/15 dark:border-border rounded-[32px] snap-start shadow-[0_16px_40px_rgba(15,23,42,0.03)] hover:shadow-2xl hover:-translate-y-2 hover:border-amber-300/45 dark:hover:border-amber-500/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group"
                  >
                    
                    {/* Category Badge */}
                    <div className={cn(
                      "absolute top-6 left-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border",
                      badgeClassMap[product.badge]
                    )}>
                      <span className="flex items-center">{getIcon(product.badgeIcon)}</span>
                      <span>{product.badge}</span>
                    </div>

                    {/* Product Visual Area */}
                    <div className={cn(
                      "w-full h-[240px] relative mb-5 rounded-brand-xl overflow-hidden flex items-center justify-center",
                      gradientClassMap[product.name]
                    )}>
                      {/* Realistic milk splash effect behind bottle */}
                      <div className="absolute inset-0 opacity-18 mix-blend-multiply bg-[radial-gradient(circle_at_center,#ffffff_0%,transparent_80%)] dark:bg-[radial-gradient(circle_at_center,#171923_0%,transparent_80%)] z-1" />

                      {/* Styled white splash vector path */}
                      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute w-[90%] h-[90%] opacity-90 z-2 scale-115 rotate-[15deg]">
                        <path fill="currentColor" className="text-white dark:text-slate-900/45" d="M37.5,-49.2C50.2,-41.8,63.1,-32.4,69.5,-19.1C75.8,-5.8,75.6,11.3,69.7,25.8C63.8,40.4,52.3,52.3,38.3,59.3C24.3,66.3,7.9,68.4,-7.8,66.1C-23.5,63.8,-38.4,57.1,-49.7,46.4C-61,35.7,-68.6,21,-70.6,5.7C-72.6,-9.7,-68.9,-25.6,-60.1,-37.2C-51.3,-48.9,-37.4,-56.3,-24.1,-62.1C-10.7,-67.9,2,-72,13.4,-68.6C24.8,-65.2,24.8,-56.7,37.5,-49.2Z" transform="translate(100 100)" />
                      </svg>

                      {/* Floating Product Image */}
                      <div className="relative w-[85%] h-[85%] z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:-translate-y-1">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 350px"
                          className="object-contain"
                          priority
                        />
                      </div>

                      {/* Soft light reflection */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/40 dark:from-slate-900/40 to-transparent pointer-events-none z-20" />
                    </div>

                    {/* Glassmorphism Product Details Card */}
                    <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/70 dark:border-border/60 rounded-brand-xl p-5 flex flex-col gap-4 shadow-sm mt-auto">
                      {/* Title & Tagline */}
                      <div>
                        <h3 className="font-playfair text-xl font-bold text-slate-950 dark:text-white mb-1 tracking-tight">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-brown-600 font-bold">
                          {product.tagline}
                        </p>
                      </div>

                      {/* Badges/Features row */}
                      <div className="flex flex-wrap gap-2">
                        {product.features.map((feat, idx) => (
                          <span 
                            key={feat}
                            className="inline-flex items-center gap-1 bg-[#F8F6F0] dark:bg-slate-950 border border-[#ECD8B0]/50 dark:border-border rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#5c4e37] dark:text-slate-400"
                          >
                            <span className="flex items-center">{getIcon(product.featuresIcons[idx])}</span>
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>

                      {/* Horizontal Divider */}
                      <div className="h-px bg-[#ECD8B0]/35 dark:bg-border/40" />

                      {/* Bottom Pricing & CTA */}
                      <div className="flex items-center justify-between w-full">
                        {/* Price */}
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                            Price
                          </p>
                          <p className="text-lg font-black text-slate-950 dark:text-white font-mono-num leading-tight">
                            {displayPrice} <span className="text-xs font-semibold text-slate-600 dark:text-brown-600">/ {displayUnit}</span>
                          </p>
                        </div>

                        {/* Subscribe / Buy Now Button */}
                        <Link href={product.isSubscription ? "/subscribe" : "/shop"}>
                          <button className={cn(
                            "h-11 px-5 rounded-brand-md text-white font-extrabold text-[13px] border-none cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_16px_rgba(15,23,42,0.08)] hover:scale-[1.03] hover:shadow-lg active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center gap-1.5",
                            buttonClassMap[product.name]
                          )}>
                            {product.isSubscription ? 'Subscribe' : 'Buy Now'}
                            <span className="text-[14px] font-normal">→</span>
                          </button>
                        </Link>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 md:-right-2 top-1/2 -translate-y-1/2 w-13 h-13 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-950/8 dark:border-border flex items-center justify-center cursor-pointer z-10 shadow-[0_10px_25px_rgba(15,23,42,0.06)] text-slate-950 dark:text-white hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95 transition-all duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>

          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
