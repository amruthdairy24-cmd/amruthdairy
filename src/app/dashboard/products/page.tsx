'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingBag, Search, Sparkles, Milk, Flame, Award, Leaf, Calendar,
  Sprout, Activity, Wind, Heart, ShieldCheck, Check, Loader2, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  category: string
  description?: string
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBadgeIcon(name: string | null | undefined, size = 12) {
  switch (name) {
    case '🌱': return <Sprout size={size} />
    case '🥣': return <Milk size={size} />
    case '🍯': return <Award size={size} />
    case '🍃': return <Leaf size={size} />
    case '🧀': return <Award size={size} />
    case '🥛': return <Milk size={size} />
    case '🧪': return <ShieldCheck size={size} />
    case '🛡️': return <ShieldCheck size={size} />
    case '🥄': return <Check size={size} />
    case '✨': return <Award size={size} />
    case '🗓️': return <Calendar size={size} />
    case '🔥': return <Flame size={size} />
    case '👋': return <Check size={size} />
    case '👃': return <Heart size={size} />
    case '❄️': return <Wind size={size} />
    case '🌿': return <Leaf size={size} />
    case '💪': return <Activity size={size} />
    case '☁️': return <Wind size={size} />
    default: return <Sparkles size={size} />
  }
}

// ─── Styles Config ──────────────────────────────────────────────────────────

const badgeClassMap: Record<string, string> = {
  'Farm Fresh':     'bg-emerald-50/90 text-emerald-705 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'Probiotic Rich': 'bg-sky-50/90 text-sky-700 border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  'Premium Quality':'bg-amber-50/90 text-amber-800 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  'Refreshing':     'bg-teal-50/90 text-teal-700 border-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  'High Protein':   'bg-indigo-50/90 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
}
const FALLBACK_BADGE_CLASS = 'bg-slate-50/90 text-slate-705 border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'

const categoryConfig: Record<string, {
  label: string
  gradient: string
  emoji: string
}> = {
  milk: { label: 'Milk', gradient: 'from-blue-50 to-sky-100 dark:from-blue-950/20 dark:to-sky-950/20', emoji: '🥛' },
  curd: { label: 'Curd & Dairy', gradient: 'from-sky-50 to-indigo-100 dark:from-sky-950/20 dark:to-indigo-950/20', emoji: '🥣' },
  ghee: { label: 'Cow Ghee', gradient: 'from-amber-50 to-yellow-100 dark:from-amber-950/20 dark:to-yellow-950/20', emoji: '🫕' },
  butter: { label: 'Butter', gradient: 'from-yellow-50 to-amber-100 dark:from-yellow-950/20 dark:to-amber-950/20', emoji: '🧈' },
  dairy: { label: 'Paneer & Cheese', gradient: 'from-purple-50 to-indigo-100 dark:from-purple-950/20 dark:to-indigo-950/20', emoji: '🧀' },
  honey: { label: 'Farm Honey', gradient: 'from-orange-50 to-yellow-100 dark:from-orange-950/20 dark:to-yellow-950/20', emoji: '🍯' },
  buttermilk: { label: 'Drinks', gradient: 'from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/20', emoji: '🥤' },
  other: { label: 'Specialty', gradient: 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950', emoji: '🌿' }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
} as const

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [milkPrice, setMilkPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, setRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/admin/settings?key=price_per_litre').catch(() => null)
        ])

        const prodJson = await prodRes.json()
        if (prodJson.success && prodJson.products) {
          const active = prodJson.products
            .filter((p: Product) => p.is_active)
            .sort((a: Product, b: Product) => {
              const ao = a.display_order ?? 9999
              const bo = b.display_order ?? 9999
              return ao !== bo ? ao - bo : 0
            })
          setProducts(active)
        }

        if (setRes) {
          const setJson = await setRes.json()
          if (setJson?.success && setJson.value?.amount) {
            setMilkPrice(setJson.value.amount)
          }
        }
      } catch (err) {
        console.error('Failed to load products page data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Categories list derived from products
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => {
      if (p.category) cats.add(p.category.toLowerCase())
    })
    return ['all', ...Array.from(cats)]
  }, [products])

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category?.toLowerCase() === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  // Get count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length }
    products.forEach(p => {
      const cat = p.category?.toLowerCase() || 'other'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [products])

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full space-y-8"
    >
      {/* Premium Header Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-[#014DA4] to-indigo-650 p-6 sm:p-8 text-white shadow-lg border border-blue-600/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[10.5px] font-extrabold uppercase tracking-wider backdrop-blur-md">
              <ShoppingBag size={12} className="text-blue-200" /> Amruth Catalogue
            </span>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-none">
              Explore Our Products
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-blue-100/90 max-w-xl">
              From fresh farm milk to premium ghee and organic honey, discover our range of certified pure, uncompromised dairy products delivered to your doorstep.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 h-11 rounded-xl bg-white text-slate-800 hover:bg-slate-50 font-black text-xs shadow-sm transition-all duration-200 cursor-pointer self-start md:self-center hover:scale-[1.03] active:scale-[0.98]"
          >
            Back to Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Filters Area */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-4 rounded-2xl shadow-3xs"
      >
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-sm font-semibold text-slate-700 dark:text-slate-205 placeholder-slate-400 focus:outline-none focus:border-[#014DA4] focus:ring-1 focus:ring-[#014DA4]"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat) => {
            const config = categoryConfig[cat] || categoryConfig.other
            const count = categoryCounts[cat] || 0
            const isSelected = selectedCategory === cat

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "h-9 px-4 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-[#014DA4] text-white shadow-sm"
                    : "bg-slate-105 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-300 border border-transparent"
                )}
              >
                <span>{config.emoji}</span>
                <span className="capitalize">{config.label || cat}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative flex flex-col w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[30px] overflow-hidden animate-pulse h-[400px]">
              <div className="w-full h-[220px] bg-slate-150 dark:bg-slate-800" />
              <div className="flex flex-col flex-1 px-5 pb-5 pt-4 space-y-3">
                <div className="h-5 bg-slate-150 dark:bg-slate-800 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded w-1/2 mx-auto" />
                <div className="flex gap-1.5 justify-center">
                  {[1, 2].map(x => <div key={x} className="h-5 w-16 bg-slate-150 dark:bg-slate-800 rounded-full" />)}
                </div>
                <div className="mt-auto h-11 bg-slate-150 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-3xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-805 flex items-center justify-center text-slate-400 mb-4">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white">No products found</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-xs">
            Try adjusting your category selection or searching for another term.
          </p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              let displayPrice = `₹${product.price}`
              let displayUnit = product.unit

              if (product.is_subscription && milkPrice) {
                displayPrice = `₹${milkPrice}`
                displayUnit = 'Litre'
              }

              const catKey = (product.category || 'other').toLowerCase()
              const catCfg = categoryConfig[catKey] || categoryConfig.other
              const badgeCls = product.badge
                ? (badgeClassMap[product.badge] ?? FALLBACK_BADGE_CLASS)
                : FALLBACK_BADGE_CLASS

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={product.id}
                  className="flex flex-col w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[30px] shadow-3xs hover:shadow-sm hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                >
                  {/* Product Visual Area */}
                  <div className={cn(
                    "w-full h-[220px] relative rounded-t-[28px] overflow-hidden transition-all duration-300 bg-gradient-to-br",
                    catCfg.gradient
                  )}>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-505"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-7xl select-none opacity-60">
                          {product.badge_icon || catCfg.emoji}
                        </span>
                      </div>
                    )}

                    {product.badge && (
                      <div className={cn(
                        "absolute top-4 left-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase z-20 border shadow-3xs backdrop-blur-md",
                        badgeCls
                      )}>
                        <span>{getBadgeIcon(product.badge_icon, 10)}</span>
                        <span>{product.badge}</span>
                      </div>
                    )}

                    {/* Subscription badge */}
                    {product.is_subscription && (
                      <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase z-20 bg-blue-600 text-white border border-blue-500 shadow-3xs">
                        <Milk size={10} />
                        <span>Subscription</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="mb-4 text-center">
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white group-hover:text-[#014DA4] dark:group-hover:text-blue-450 transition-colors leading-snug">
                        {product.name}
                      </h3>
                      {product.tagline && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          {product.tagline}
                        </p>
                      )}
                    </div>

                    {/* Features Badges */}
                    {product.features && product.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-5 justify-center">
                        {product.features.map((feat, idx) => (
                          <span
                            key={feat}
                            className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-505 dark:text-slate-400"
                          >
                            <span className="text-[#014DA4] dark:text-blue-455">{getBadgeIcon(product.features_icons?.[idx], 9)}</span>
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Separator */}
                    <div className="h-[1px] bg-slate-100 dark:bg-slate-800 w-full mb-4 mt-auto" />

                    {/* Pricing and CTAs */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                            Price
                          </p>
                          <p className="text-base font-black text-slate-800 dark:text-white leading-tight flex items-baseline">
                            {displayPrice}
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1">/ {displayUnit}</span>
                          </p>
                        </div>

                        {/* Inventory */}
                        <div className="text-right">
                          <p className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                            Status
                          </p>
                          <span className={cn(
                            "text-[10px] font-bold",
                            product.stock_available > 0 ? "text-emerald-600 dark:text-emerald-450" : "text-rose-500"
                          )}>
                            {product.stock_available > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons depending on type */}
                      {product.is_subscription ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Link href="/dashboard/quantity" className="w-full">
                            <button className="w-full h-9 rounded-xl text-[10.5px] font-extrabold transition-all border border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1">
                              Manage Sub
                            </button>
                          </Link>
                          <Link href="/dashboard/extra" className="w-full">
                            <button className="w-full h-9 rounded-xl text-[10.5px] font-extrabold transition-all bg-[#014DA4] text-white hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-1">
                              Order Extra
                            </button>
                          </Link>
                        </div>
                      ) : (
                        <Link href="/shop" className="block w-full">
                          <button className="w-full h-9 rounded-xl text-[10.5px] font-extrabold transition-all bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-none cursor-pointer flex items-center justify-center gap-1 group/btn">
                            <span>Order from Shop</span>
                            <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}
