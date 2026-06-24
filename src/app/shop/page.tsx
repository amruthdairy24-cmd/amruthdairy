'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Plus, Minus, ShoppingCart,
  X, Truck, CheckCircle, Loader2, Leaf,
  ChevronRight, Zap, Star, Milk, Flame, Award, Clock, Sprout, RefreshCw, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

function getCategoryIcon(emoji: string, className?: string) {
  switch (emoji) {
    case '🥛': return <Milk className={className} />
    case '🫕': return <Flame className={className} />
    case '🍯': return <Award className={className} />
    case '🧈': return <Award className={className} />
    case '🧀': return <Award className={className} />
    case '🥣': return <Milk className={className} />
    case '🥤': return <Milk className={className} />
    case '🌿': return <Leaf className={className} />
    case '🍼': return <Milk className={className} />
    case '🏺': return <Milk className={className} />
    default: return <ShoppingBag className={className} />
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  unit: string
  category: string
  image_url: string | null
  is_active: boolean
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
}

/* ─────────────────────────────────────────────────────────
   CATEGORY CONFIG
───────────────────────────────────────────────────────── */
const CAT: Record<string, {
  emoji: string
  label: string
  tagline: string
  badge: string
  badgeBg: string   
  badgeColor: string
  cardBg: string    
  accentHex: string 
  btnText: string   
  features: string[]
}> = {
  milk: {
    emoji: '🥛',
    label: 'Farm Fresh Milk',
    tagline: 'Pure. Natural. Trusted.',
    badge: 'FARM FRESH',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    cardBg: 'linear-gradient(160deg, #eef4ff 0%, #dbe8ff 50%, #f0f5ff 100%)',
    accentHex: '#1a3a8f',
    btnText: '#ffffff',
    features: ['100% Pure', 'No Additives', 'Farm Fresh'],
  },
  ghee: {
    emoji: '🫕',
    label: 'Pure Cow Ghee',
    tagline: 'Traditional | Pure | Premium',
    badge: 'PREMIUM QUALITY',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
    cardBg: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 50%, #fffde7 100%)',
    accentHex: '#92400e',
    btnText: '#ffffff',
    features: ['100% Pure', 'Hand Crafted', 'Aromatic'],
  },
  honey: {
    emoji: '🍯',
    label: 'Farm Honey',
    tagline: 'Raw | Unfiltered | Pure',
    badge: 'NATURAL',
    badgeBg: '#ffedd5',
    badgeColor: '#9a3412',
    cardBg: 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%)',
    accentHex: '#c2410c',
    btnText: '#ffffff',
    features: ['Raw Honey', 'Unfiltered', 'Farm Direct'],
  },
  butter: {
    emoji: '🧈',
    label: 'Fresh Butter',
    tagline: 'Creamy | Rich | Delicious',
    badge: 'CHURNED FRESH',
    badgeBg: '#fef9c3',
    badgeColor: '#854d0e',
    cardBg: 'linear-gradient(160deg, #fefce8 0%, #fef9c3 50%, #fefce8 100%)',
    accentHex: '#854d0e',
    btnText: '#ffffff',
    features: ['Fresh Churned', 'A2 Milk', 'No Salt'],
  },
  dairy: {
    emoji: '🧀',
    label: 'Dairy Products',
    tagline: 'Soft | Pure | Protein Rich',
    badge: 'HIGH PROTEIN',
    badgeBg: '#ede9fe',
    badgeColor: '#5b21b6',
    cardBg: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%)',
    accentHex: '#6d28d9',
    btnText: '#ffffff',
    features: ['100% Pure', 'High Protein', 'Soft & Fresh'],
  },
  curd: {
    emoji: '🥣',
    label: 'Fresh Curd',
    tagline: 'Rich & Thick | Good for Gut',
    badge: 'PROBIOTIC RICH',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    cardBg: 'linear-gradient(160deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)',
    accentHex: '#0369A1',
    btnText: '#ffffff',
    features: ['Rich & Thick', 'Good for Gut', 'Daily Fresh'],
  },
  buttermilk: {
    emoji: '🥤',
    label: 'Buttermilk',
    tagline: 'Cool & Light | Good for Digestion',
    badge: 'REFRESHING',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    cardBg: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
    accentHex: '#16a34a',
    btnText: '#ffffff',
    features: ['Cool & Light', 'Good for Digestion', 'Daily Fresh'],
  },
  other: {
    emoji: '🌿',
    label: 'Specialty Items',
    tagline: 'Handcrafted | Premium | Pure',
    badge: 'SPECIALTY',
    badgeBg: '#f1f5f9',
    badgeColor: '#475569',
    cardBg: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)',
    accentHex: '#334155',
    btnText: '#ffffff',
    features: ['Premium', 'Handcrafted', 'Pure'],
  },
}

/* ─────────────────────────────────────────────────────────
   PREMIUM PRODUCT CARD
───────────────────────────────────────────────────────── */
function ProductCard({
  product,
  inCart,
  onAdd,
  onRemove,
}: {
  product: Product
  inCart: number
  onAdd: () => void
  onRemove: () => void
}) {
  const key = (product.category || 'other').toLowerCase()
  const cfg = CAT[key] || CAT.other
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col transition-all duration-300",
        hovered ? "shadow-lg -translate-y-1" : "shadow-sm translate-y-0"
      )}
    >
      {/* ── IMAGE / EMOJI AREA ── */}
      <div
        className="h-48 flex items-center justify-center relative overflow-hidden"
        style={{ background: cfg.cardBg }}
      >
        {/* Badge */}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-200/10"
          style={{
            background: cfg.badgeBg,
            color: cfg.badgeColor,
          }}
        >
          <Leaf size={7} />
          {cfg.badge}
        </div>

        {/* Low stock */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-3 right-3 bg-red-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
            Only {product.stock} left
          </div>
        )}

        {/* Product visual */}
        <motion.div
          animate={hovered ? { scale: 1.08, y: -6 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative z-10"
        >
          {product.image_url ? (
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-15 scale-125"
                style={{ background: cfg.accentHex }}
              />
              <img
                src={product.image_url}
                alt={product.name}
                className="w-35 h-35 object-contain relative z-10 drop-shadow-md"
              />
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute w-20 h-20 rounded-full blur-2xl opacity-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ background: cfg.accentHex }}
              />
              <div
                className="drop-shadow-sm flex justify-center items-center"
                style={{ color: cfg.accentHex }}
              >
                {getCategoryIcon(cfg.emoji, "w-16 h-16")}
              </div>
            </div>
          )}
        </motion.div>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-full px-3.5 py-1.5 shadow-xs">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="p-5 flex flex-col gap-2.5 flex-1 bg-white dark:bg-slate-900">
        {/* Name + tagline */}
        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug mb-0.5 font-display">
            {product.name}
          </p>
          <p
            className="text-[10px] font-bold leading-normal"
            style={{ color: cfg.accentHex }}
          >
            {cfg.tagline}
          </p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1">
          {cfg.features.map((f) => (
            <span
              key={f}
              className="text-[9px] font-bold text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-full px-2 py-0.5"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Divider */}
        <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-slate-900 dark:text-white font-display leading-none">
                ₹{product.price}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 ml-1">
                / {product.unit}
              </span>
            </div>
          </div>

          {product.stock > 0 && (
            <>
              {inCart > 0 ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={onRemove}
                    className="w-7.5 h-7.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-150 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-black text-slate-900 dark:text-white min-w-[20px] text-center">
                    {inCart}
                  </span>
                  <button
                    onClick={onAdd}
                    className="w-7.5 h-7.5 rounded-lg border-none cursor-pointer flex items-center justify-center text-white transition-colors"
                    style={{ backgroundColor: cfg.accentHex }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onAdd}
                  className="h-8.5 px-3.5 rounded-xl border-none text-white text-[11px] font-black cursor-pointer flex items-center gap-1 whitespace-nowrap tracking-wide transition-all shadow-xs"
                  style={{ 
                    backgroundColor: cfg.accentHex, 
                    boxShadow: `0 3px 10px ${cfg.accentHex}25` 
                  }}
                >
                  Add to Cart
                  <ChevronRight size={12} />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   BANNER CARDS
───────────────────────────────────────────────────────── */
function DeliveryCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-3xl p-6 flex flex-col justify-between min-h-[300px] relative overflow-hidden"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/50 text-sky-700 dark:text-sky-400 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-900/30 tracking-widest uppercase mb-4 w-fit">
        <Clock size={10} /> ON TIME, EVERY TIME
      </div>

      {/* Big visual */}
      <div className="text-center py-5 relative flex justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-blue-500/5 to-transparent blur-md" />
        <div className="text-sky-700 dark:text-sky-400 drop-shadow-sm">
          <Milk size={64} />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-extrabold text-blue-900 dark:text-blue-200 mb-1 font-display leading-tight">
          Delivered Before 7 AM
        </h3>
        <p className="text-xs font-semibold text-sky-500 dark:text-sky-400 mb-4.5">
          Every Morning. Every Day.
        </p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { label: 'Early Morning', icon: <Clock size={10} /> },
            { label: 'Safe Delivery', icon: <CheckCircle size={10} /> },
            { label: 'Fresh & Pure', icon: <Leaf size={10} /> }
          ].map((f) => (
            <span
              key={f.label}
              className="text-[9px] font-bold text-sky-700 dark:text-sky-400 bg-white/60 dark:bg-slate-900/40 border border-blue-200/50 dark:border-blue-900/30 rounded-full px-2.5 py-1 inline-flex items-center gap-1"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
        <button className="w-full h-10 rounded-xl border-none bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 active:scale-[0.98] text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all">
          How It Works <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  )
}

function FarmCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-6 flex flex-col justify-between min-h-[300px] relative overflow-hidden"
    >
      <div className="text-center py-5 flex-1 flex justify-center items-center">
        <div className="text-emerald-600 dark:text-emerald-400 drop-shadow-sm">
          <Sprout size={64} />
        </div>
      </div>

      <div>
        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-450 tracking-widest uppercase mb-1">
          FROM OUR FARM
        </p>
        <h3 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mb-1.5 font-display">
          From Our Farm
        </h3>
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed mb-4.5 opacity-80">
          From our healthy cows to your home before sunrise.
        </p>
        <div className="flex gap-2 mb-4.5 flex-wrap">
          {[
            { label: 'Ethical Farming', icon: <Leaf size={10} /> },
            { label: 'Healthy Cows', icon: <Sprout size={10} /> },
            { label: 'Sustainable', icon: <RefreshCw size={10} /> }
          ].map((f) => (
            <span
              key={f.label}
              className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-white/60 dark:bg-slate-900/40 border border-emerald-200/50 dark:border-emerald-900/30 rounded-full px-2.5 py-1 inline-flex items-center gap-1"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 h-10 rounded-xl border-1.5 border-emerald-300 dark:border-emerald-800 bg-white/65 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-emerald-700 dark:text-emerald-400 text-xs font-black text-decoration-none transition-all"
        >
          Know Our Farm <ChevronRight size={13} />
        </Link>
      </div>
    </motion.div>
  )
}

function PlanCard() {
  const [sel, setSel] = useState('1 Litre')
  const plans = [
    { label: '500ml', emoji: '🥛', price: 30 },
    { label: '1 Litre', emoji: '🍼', price: 60 },
    { label: '2 Litre', emoji: '🏺', price: 110 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between min-h-[300px] shadow-sm relative overflow-hidden"
    >
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5 font-display">
          Choose Your Plan
        </h3>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-4.5">
          Daily delivery at your convenience
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4.5">
          {plans.map((p) => {
            const isActive = sel === p.label
            return (
              <button
                key={p.label}
                onClick={() => setSel(p.label)}
                className={cn(
                  'p-2.5 rounded-2xl cursor-pointer flex flex-col items-center gap-1 transition-all border-2',
                  isActive 
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
                )}
              >
                <span className="text-blue-650 dark:text-blue-400">{getCategoryIcon(p.emoji, "w-6 h-6")}</span>
                <span className={cn('text-[10px] font-black', isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400')}>
                  {p.label}
                </span>
                <span className={cn('text-[9px] font-bold', isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500')}>
                  ₹{p.price}/day
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 mb-4.5">
          {[
            'Pause or Skip anytime',
            'Easy monthly billing',
            'Cancel anytime'
          ].map((f) => (
            <p key={f} className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-450" />
              <span>{f}</span>
            </p>
          ))}
        </div>
      </div>

      <Link
        href="/subscribe"
        className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 hover:from-slate-800 hover:to-blue-800 text-white text-xs font-black text-decoration-none mt-auto transition-all"
      >
        View All Plans <ChevronRight size={13} />
      </Link>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    order_id: string; total_amount: number; delivery_date: string
  } | null>(null)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => { fetchProducts() }, [])

  // Sync cart from/to localStorage & window events
  useEffect(() => {
    const saved = localStorage.getItem('amruth_cart')
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('amruth_cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }))
  }, [cart])

  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true)
    window.addEventListener('open-cart', handleOpenCart)
    return () => window.removeEventListener('open-cart', handleOpenCart)
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) setProducts(data.products)
    } catch { setError('Failed to load products') }
    finally { setLoading(false) }
  }

  function addToCart(product: Product) {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      if (ex) return prev.map(i => i.product.id === product.id
        ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === id)
      if (ex && ex.quantity > 1) return prev.map(i => i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter(i => i.product.id !== id)
    })
  }

  function clearItem(id: string) { setCart(prev => prev.filter(i => i.product.id !== id)) }

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const getQty = (id: string) => cart.find(i => i.product.id === id)?.quantity || 0

  async function handleCheckout() {
    if (!cart.length) return
    setOrdering(true); setError('')
    try {
      const res = await fetch('/api/products/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(i => ({ product_id: i.product.id, product_name: i.product.name, unit_price: i.product.price, quantity: i.quantity })) })
      })
      const data = await res.json()
      if (data.success) { setOrderSuccess(true); setOrderResult(data); setCart([]); setCartOpen(false) }
      else setError(data.message || 'Order failed')
    } catch { setError('Network error. Please try again.') }
    finally { setOrdering(false) }
  }

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = (p.category || 'other').toLowerCase()
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const categories = ['all', ...Object.keys(grouped)]
  const filtered = activeCategory === 'all' ? grouped : { [activeCategory]: grouped[activeCategory] || [] }

  /* ── ORDER SUCCESS ── */
  if (orderSuccess && orderResult) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-[360px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-8 text-center shadow-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-emerald-450 via-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-md shadow-emerald-500/20"
          >
            <CheckCircle color="#fff" size={32} />
          </motion.div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 font-display">
            Order Placed!
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-5 leading-relaxed">
            Your farm-fresh products will arrive with your morning milk!
          </p>
          <div className="bg-[#FFFDF7] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Total</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">₹{orderResult.total_amount}</span>
            </div>
            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-2.5" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Delivery</span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {new Date(orderResult.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/dashboard"
              className="flex-1 h-11 rounded-2xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs font-black flex items-center justify-center text-decoration-none hover:bg-slate-100 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => { setOrderSuccess(false); setOrderResult(null) }}
              className="flex-1 h-11 rounded-2xl border-none bg-gradient-to-r from-amber-400 to-amber-555 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] text-slate-900 text-xs font-black cursor-pointer shadow-sm transition-all"
            >
              Shop More
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ── MAIN ── */
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FFFDF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-[88px] transition-colors duration-350">

        {/* ── HERO BANNER ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 px-6 py-12 md:px-12">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 left-[30%] w-100 h-50 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />

          <div className="max-w-6xl mx-auto flex flex-wrap items-end justify-between gap-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-end justify-between gap-6 w-full"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3.5 py-1.5 text-[10px] font-bold text-blue-300 tracking-widest uppercase mb-4 backdrop-blur-md">
                  <Star size={10} className="fill-current" /> Premium Farm Products
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight font-display tracking-tight mb-2.5">
                  Amruth Farm <span className="text-blue-300">Shop</span>
                </h1>
                <p className="text-xs md:text-sm text-blue-200/80 font-medium max-w-md leading-relaxed">
                  Handcrafted from our dairy farm — pure ghee, raw honey, fresh butter &amp; more.
                  Delivered with your morning milk.
                </p>
              </div>

              <div className="flex gap-3">
                {[
                  { icon: <Leaf className="text-blue-300 w-6 h-6 mx-auto" />, top: '100% Pure', bot: 'No additives' },
                  { icon: <Clock className="text-blue-300 w-6 h-6 mx-auto" />, top: 'By 7 AM', bot: 'Every morning' },
                ].map((s) => (
                  <div
                    key={s.top}
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-center backdrop-blur-md"
                  >
                    <div className="mb-1.5">{s.icon}</div>
                    <div className="text-xs font-black text-white mb-0.5">{s.top}</div>
                    <div className="text-[9px] font-bold text-blue-300">{s.bot}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── CATEGORY FILTER ── */}
        <div className="sticky top-16 z-30 bg-[#FFFDF7]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => {
              const cfg = CAT[cat]
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold cursor-pointer transition-all duration-150 whitespace-nowrap",
                    isActive 
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  )}
                >
                  <span>{cat === 'all' ? <ShoppingBag size={12} /> : getCategoryIcon(cfg?.emoji || '📦', "w-3.5 h-3.5")}</span>
                  <span className="capitalize">
                    {cat === 'all' ? 'All Products' : (cfg?.label || cat)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── PRODUCTS ── */}
        <main className="max-w-6xl mx-auto px-6 py-8 pb-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Loading farm products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <ShoppingBag size={48} className="text-slate-305 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1.5">No products yet</h3>
              <p className="text-xs font-semibold text-slate-400">Check back soon!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {Object.entries(filtered).map(([category, items]) => {
                const cfg = CAT[category] || CAT.other
                return (
                  <section key={category}>
                    {/* Section header */}
                    <div className="flex items-center gap-3.5 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center" style={{ color: cfg.accentHex }}>
                        {getCategoryIcon(cfg.emoji, "w-5 h-5")}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white font-display leading-tight mb-0.5">
                          {cfg.label}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {items.length} product{items.length > 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {items.map((product, i) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <ProductCard
                            product={product}
                            inCart={getQty(product.id)}
                            onAdd={() => addToCart(product)}
                            onRemove={() => removeFromCart(product.id)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )
              })}

              {/* ── BANNER CARDS ── */}
              {activeCategory === 'all' && (
                <section className="border-t border-slate-200/50 dark:border-slate-850 pt-12">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-450">
                      <Award size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white font-display leading-tight">
                        Why Amruth?
                      </h2>
                      <p className="text-[10px] font-bold text-slate-405 dark:text-slate-500">Our promise to you</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FarmCard />
                    <DeliveryCard />
                    <PlanCard />
                  </div>
                </section>
              )}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 rounded-xl p-4 text-center text-xs font-bold text-rose-700 dark:text-rose-455 mt-6 flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </main>

        {/* ── FLOATING CART ── */}
        <AnimatePresence>
          {cartCount > 0 && !cartOpen && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[320px] z-50"
            >
              <button
                onClick={() => setCartOpen(true)}
                className="w-full h-14 rounded-2xl border-none bg-gradient-to-r from-blue-900 to-blue-750 hover:from-blue-800 hover:to-blue-650 text-white flex items-center justify-between px-5 cursor-pointer shadow-lg shadow-blue-950/30 transition-all duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <ShoppingBag size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-bold">
                    {cartCount} item{cartCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black">₹{cartTotal}</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CART DRAWER ── */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCartOpen(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-[#FFFDF7] dark:bg-slate-950 z-51 flex flex-col shadow-2xl border-l border-slate-200/40 dark:border-slate-850"
              >
                {/* Cart header */}
                <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-display">Your Cart</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} · ₹${cartTotal}` : 'Empty'}
                    </p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-slate-550 dark:text-slate-400" />
                  </button>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-slate-300 dark:text-slate-700 mb-3"><ShoppingCart size={48} className="mx-auto" /></div>
                      <p className="text-xs font-bold text-slate-450 dark:text-slate-500">Your cart is empty</p>
                      <button
                        onClick={() => setCartOpen(false)}
                        className="mt-3 text-xs font-black text-amber-600 dark:text-amber-500 bg-transparent border-none cursor-pointer hover:underline"
                      >
                        Continue Shopping →
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {cart.map(({ product, quantity }) => {
                        const key = (product.category || 'other').toLowerCase()
                        const cfg = CAT[key] || CAT.other
                        return (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs"
                          >
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: cfg.cardBg, color: cfg.accentHex }}
                            >
                              {getCategoryIcon(cfg.emoji, "w-6 h-6")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {product.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                ₹{product.price} × {quantity} = ₹{product.price * quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="w-6.5 h-6.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="text-xs font-black text-slate-900 dark:text-white min-w-[18px] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => addToCart(product)}
                                className="w-6.5 h-6.5 rounded-lg border-none cursor-pointer flex items-center justify-center text-white transition-colors"
                                style={{ backgroundColor: cfg.accentHex }}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            <button
                              onClick={() => clearItem(product.id)}
                              className="p-1 bg-transparent border-none cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <X size={13} className="text-slate-300 dark:text-slate-600" />
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Cart footer */}
                {cart.length > 0 && (
                  <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3.5 shadow-inner">
                    {/* Summary */}
                    <div className="bg-[#FFFDF7] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-550 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span className="text-slate-900 dark:text-white">₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-550 dark:text-slate-400">
                        <span>Delivery</span>
                        <span className="text-emerald-600 dark:text-emerald-450 font-black">FREE</span>
                      </div>
                      <div className="h-[1px] bg-slate-200 dark:bg-slate-800" />
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-900 dark:text-white">
                        <span>Total</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white font-display">
                          ₹{cartTotal}
                        </span>
                      </div>
                    </div>

                    {/* Delivery note */}
                    <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30 rounded-xl p-3 shadow-xs">
                      <Truck size={13} className="text-amber-600 dark:text-amber-450 shrink-0" />
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-snug">
                        Delivered tomorrow morning with your milk <Milk size={10} className="inline ml-0.5 text-slate-500 dark:text-slate-400" />
                      </span>
                    </div>

                    {/* Checkout button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckout}
                      disabled={ordering}
                      className="w-full h-12.5 rounded-xl border-none bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white text-sm font-black cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-blue-950/10 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {ordering ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Zap size={15} /> Place Order · ₹{cartTotal}</>
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  )
}