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
  'Farm Fresh': 'bg-emerald-50/90 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'Probiotic Rich': 'bg-sky-50/90 text-sky-700 border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  'Premium Quality': 'bg-amber-50/90 text-amber-800 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  'Refreshing': 'bg-teal-50/90 text-teal-700 border-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  'High Protein': 'bg-indigo-50/90 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
}

// Light theme-colored showcases for product images (consistent in both modes to allow flawless mix-blend-multiply)
const lightGradientMap: Record<string, string> = {
  'A2 Cow Milk': 'bg-gradient-to-br from-[#FFFDF9] to-[#FAF5E6] border border-[#F5EAD2]/40',
  'Fresh Curd': 'bg-gradient-to-br from-[#F8FAFC] to-[#EDF2F7] border border-[#E2E8F0]/40',
  'Pure Cow Ghee': 'bg-gradient-to-br from-[#FFFDF4] to-[#FEF7DC] border border-[#F5EAD2]/40',
  'Buttermilk': 'bg-gradient-to-br from-[#F4FBF7] to-[#E6F7ED] border border-[#D1FAE5]/40',
  'Fresh Paneer': 'bg-gradient-to-br from-[#FAF5FF] to-[#F5EBFF] border border-[#E9D5FF]/40',
}

const buttonClassMap: Record<string, string> = {
  'A2 Cow Milk': 'bg-gradient-to-r from-[#02429C] to-[#013378] hover:from-[#013378] hover:to-[#00255c] shadow-[0_4px_14px_rgba(2,66,156,0.22)] text-white',
  'Fresh Curd': 'bg-gradient-to-r from-[#02429C] to-[#013378] hover:from-[#013378] hover:to-[#00255c] shadow-[0_4px_14px_rgba(2,66,156,0.22)] text-white',
  'Pure Cow Ghee': 'bg-gradient-to-r from-[#02429C] to-[#013378] hover:from-[#013378] hover:to-[#00255c] shadow-[0_4px_14px_rgba(2,66,156,0.22)] text-white',
  'Buttermilk': 'bg-gradient-to-r from-[#02429C] to-[#013378] hover:from-[#013378] hover:to-[#00255c] shadow-[0_4px_14px_rgba(2,66,156,0.22)] text-white',
  'Fresh Paneer': 'bg-gradient-to-r from-[#02429C] to-[#013378] hover:from-[#013378] hover:to-[#00255c] shadow-[0_4px_14px_rgba(2,66,156,0.22)] text-white',
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
      const container = scrollContainerRef.current
      const cards = Array.from(container.children) as HTMLElement[]
      if (cards.length === 0) return

      const containerRect = container.getBoundingClientRect()
      const containerLeft = container.scrollLeft

      // Calculate the exact scrollable coordinate for each card in the canvas
      const cardPositions = cards.map(card => {
        const cardRect = card.getBoundingClientRect()
        return {
          element: card,
          scrollPos: containerLeft + (cardRect.left - containerRect.left)
        }
      })

      if (direction === 'right') {
        // Find the first card whose position is to the right of the current scroll position
        const target = cardPositions.find(pos => pos.scrollPos > containerLeft + 20)
        if (target) {
          container.scrollTo({
            left: target.scrollPos - 8, // align with padding
            behavior: 'smooth'
          })
        }
      } else {
        // Find the card immediately to the left of the current scroll position
        const prevTargets = cardPositions.filter(pos => pos.scrollPos < containerLeft - 20)
        if (prevTargets.length > 0) {
          const target = prevTargets[prevTargets.length - 1]
          container.scrollTo({
            left: target.scrollPos - 8, // align with padding
            behavior: 'smooth'
          })
        }
      }
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
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-[#1f232f] border border-amber-500/20 text-[#B45309] dark:text-amber-400 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] mb-5 shadow-[0_4px_12px_rgba(180,83,9,0.03)]">
              <Award size={12} /> Our Products
            </div>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium text-slate-950 dark:text-white tracking-tight leading-none mb-5">
              Pure. Uncompromised. Royal.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium max-w-[600px] mx-auto">
              Experience dairy crafted with devotion, certified pure, and delivered to your doorstep fresh before sunrise.
            </p>
          </div>
        </ScrollReveal>

        {/* Slider Wrapper (Max width of 1308px limits the visible area to exactly 4 cards + gaps on desktop, hiding the 5th card) */}
        <ScrollReveal direction="up" delay={150} duration={1000}>
          <div className="relative max-w-[1308px] mx-auto px-10">
            
            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 md:-left-2 top-1/2 -translate-y-1/2 w-13 h-13 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-950/8 dark:border-border flex items-center justify-center cursor-pointer z-20 shadow-[0_10px_25px_rgba(15,23,42,0.06)] text-slate-950 dark:text-white hover:scale-110 hover:bg-white hover:shadow-xl active:scale-95 transition-all duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Scroll Container (Using gap-6 for compact spacing to fit 4 cards on desktop) */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar py-6 px-2 scroll-smooth snap-x snap-mandatory w-full"
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
                    className="relative flex flex-col w-[290px] min-w-[290px] md:w-[280px] md:min-w-[280px] lg:w-[285px] lg:min-w-[285px] p-0 bg-white dark:bg-[#171923]/90 border border-[#F2EDE4]/70 dark:border-slate-800/60 rounded-[32px] snap-start shadow-[0_12px_30px_rgba(180,140,60,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(180,140,60,0.12)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-2 hover:border-amber-300/40 dark:hover:border-amber-500/30 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group overflow-hidden"
                  >
                    {/* Hover Glow Accent */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/0 via-amber-500/3 to-amber-500/0 dark:via-amber-500/6 rounded-[34px] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none z-0" />
                    
                    {/* Product Visual Area (Completely Full Bleed with Zero Padding on the Image) */}
                    <div className="w-full h-[260px] relative rounded-t-[30px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
                      
                      {/* Product Image covering the entire area edge-to-edge */}
                      <div className="absolute inset-0 w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 290px"
                          className="object-cover"
                          priority
                        />
                      </div>

                      {/* Category Badge - Floating on top-left of the image */}
                      <div className={cn(
                        "absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-extrabold tracking-wider uppercase z-20 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border backdrop-blur-md",
                        badgeClassMap[product.badge]
                      )}>
                        <span className="flex items-center text-current">{getIcon(product.badgeIcon)}</span>
                        <span>{product.badge}</span>
                      </div>

                      {/* Soft light reflection overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-20" />
                    </div>

                    {/* Product Info Section (Padded below the visual block) */}
                    <div className="relative z-10 flex flex-col flex-1 px-5 pb-5 pt-4">
                      {/* Title & Tagline */}
                      <div className="mb-4 text-center">
                        <h3 className="font-playfair text-2xl font-extrabold text-slate-950 dark:text-white mb-1.5 tracking-tight transition-colors duration-300 group-hover:text-amber-650 dark:group-hover:text-amber-400">
                          {product.name}
                        </h3>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                          {product.tagline}
                        </p>
                      </div>

                      {/* Minimalist Organic Feature Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-5 justify-center">
                        {product.features.map((feat, idx) => (
                          <span 
                            key={feat}
                            className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#1f232f] border border-[#ECD8B0]/25 dark:border-slate-800 rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 hover:bg-[#F2ECE0] dark:hover:bg-[#272b38]"
                          >
                            <span className="text-amber-650 dark:text-amber-400 flex items-center">{getIcon(product.featuresIcons[idx])}</span>
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>

                      {/* Subtle thin horizontal separator */}
                      <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full mb-4 mt-auto" />

                      {/* Pricing & CTA Button */}
                      <div className="flex items-center justify-between">
                        {/* Price Display */}
                        <div>
                          <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                            Price
                          </p>
                          <p className="text-xl font-extrabold text-slate-950 dark:text-white font-mono-num leading-tight flex items-baseline">
                            {displayPrice} 
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">/ {displayUnit}</span>
                          </p>
                        </div>

                        {/* CTA Action Button */}
                        <Link href={product.isSubscription ? "/subscribe" : "/shop"}>
                          <button className={cn(
                            "h-11 px-5 rounded-full text-[13px] font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center gap-1.5 hover:scale-[1.03] active:scale-95 border-none cursor-pointer group/btn",
                            buttonClassMap[product.name]
                          )}>
                            <span>{product.isSubscription ? 'Subscribe' : 'Buy Now'}</span>
                            <span className="text-[14px] font-normal transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
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
