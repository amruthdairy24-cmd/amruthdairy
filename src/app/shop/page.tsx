'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Plus, Minus, ArrowLeft, ShoppingCart,
  X, Truck, CheckCircle, Loader2, Leaf,
  ChevronRight, Zap, Star, Milk, Flame, Award, Calendar, Wind, Sprout, Clock, Heart, RefreshCw, AlertCircle
} from 'lucide-react'

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
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

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
   CATEGORY CONFIG — matches your reference image exactly
───────────────────────────────────────────────────────── */
const CAT: Record<string, {
  emoji: string
  label: string
  tagline: string
  badge: string
  badgeBg: string   // inline — avoids Tailwind purge issues
  badgeColor: string
  cardBg: string    // top image area background
  accentHex: string // button + accent color
  btnText: string   // button text color
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
   Matches reference: large emoji top, white card bottom
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
      style={{
        background: '#ffffff',
        borderRadius: 24,
        border: '1px solid #E8DCC8',
        boxShadow: hovered
          ? '0 20px 48px rgba(180,140,60,0.18), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 2px 12px rgba(180,140,60,0.10)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* ── IMAGE / EMOJI AREA ── */}
      <div
        style={{
          background: cfg.cardBg,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: cfg.badgeBg,
            color: cfg.badgeColor,
            fontSize: 9,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 999,
            letterSpacing: '1.2px',
            textTransform: 'uppercase' as const,
            border: `1px solid ${cfg.badgeColor}22`,
          }}
        >
          <Leaf size={7} />
          {cfg.badge}
        </div>

        {/* Low stock */}
        {product.stock < 10 && product.stock > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: 9,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              border: '1px solid #fecaca',
            }}
          >
            Only {product.stock} left
          </div>
        )}

        {/* Product visual */}
        <motion.div
          animate={hovered ? { scale: 1.08, y: -6 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          {product.image_url ? (
            <>
              {/* Glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: cfg.accentHex,
                  borderRadius: '50%',
                  filter: 'blur(24px)',
                  opacity: 0.15,
                  transform: 'scale(1.2)',
                }}
              />
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: 'contain',
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
                }}
              />
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  background: cfg.accentHex,
                  borderRadius: '50%',
                  filter: 'blur(28px)',
                  opacity: 0.18,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <div
                style={{
                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: cfg.accentHex,
                }}
              >
                {getCategoryIcon(cfg.emoji, "w-16 h-16")}
              </div>
            </div>
          )}
        </motion.div>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase' as const,
                letterSpacing: '1px',
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 999,
                padding: '6px 16px',
              }}
            >
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT AREA ── */}
      <div
        style={{
          padding: '16px 16px 16px',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 10,
          flex: 1,
        }}
      >
        {/* Name + tagline */}
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#292524',
              lineHeight: 1.25,
              marginBottom: 3,
              fontFamily: 'var(--font-display)',
            }}
          >
            {product.name}
          </p>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: cfg.accentHex,
              lineHeight: 1.4,
            }}
          >
            {cfg.tagline}
          </p>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
          {cfg.features.map((f) => (
            <span
              key={f}
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#57534E',
                background: '#FFF8E8',
                border: '1px solid #E8DCC8',
                borderRadius: 999,
                padding: '2px 7px',
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Description */}
        {product.description && (
          <p
            style={{
              fontSize: 10.5,
              color: '#A8A29E',
              fontWeight: 500,
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: '#E8DCC8' }} />

        {/* Price + CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#292524',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                ₹{product.price}
              </span>
              <span
                style={{ fontSize: 10, fontWeight: 600, color: '#A8A29E', marginLeft: 3 }}
              >
                / {product.unit}
              </span>
            </div>
          </div>

          {product.stock > 0 && (
            <>
              {inCart > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={onRemove}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: '1px solid #E8DCC8',
                      background: '#FFF8E8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#57534E',
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#292524',
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {inCart}
                  </span>
                  <button
                    onClick={onAdd}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: 'none',
                      background: cfg.accentHex,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onAdd}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: cfg.accentHex,
                    color: cfg.btnText,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap' as const,
                    boxShadow: `0 3px 10px ${cfg.accentHex}40`,
                    letterSpacing: '0.2px',
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
   BANNER CARDS (bottom row like reference)
───────────────────────────────────────────────────────── */
function DeliveryCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(145deg, #dbeafe 0%, #bfdbfe 100%)',
        borderRadius: 24,
        border: '1px solid #93c5fd',
        padding: 24,
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: 300,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'rgba(255,255,255,0.7)',
          color: '#0369A1',
          fontSize: 9,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 999,
          letterSpacing: '1px',
          textTransform: 'uppercase' as const,
          border: '1px solid #93c5fd',
          marginBottom: 'auto',
          width: 'fit-content',
        }}
      >
        <Clock size={10} /> ON TIME, EVERY TIME
      </div>

      {/* Big visual */}
      <div style={{ textAlign: 'center', padding: '20px 0', position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)',
          }}
        />
        <div style={{ color: '#0369A1', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }}>
          <Milk size={64} />
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#1e3a8a',
            marginBottom: 4,
            fontFamily: 'var(--font-display)',
            lineHeight: 1.2,
          }}
        >
          Delivered Before 7 AM
        </h3>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#0EA5E9', marginBottom: 14 }}>
          Every Morning. Every Day.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Early Morning', icon: <Clock size={10} /> },
            { label: 'Safe Delivery', icon: <CheckCircle size={10} /> },
            { label: 'Fresh & Pure', icon: <Leaf size={10} /> }
          ].map((f) => (
            <span
              key={f.label}
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#0369A1',
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid #bfdbfe',
                borderRadius: 999,
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
        <button
          style={{
            width: '100%',
            height: 40,
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
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
      style={{
        background: 'linear-gradient(145deg, #dcfce7 0%, #bbf7d0 100%)',
        borderRadius: 24,
        border: '1px solid #86efac',
        padding: 24,
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: 300,
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px 0', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#16a34a', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.08))' }}>
          <Sprout size={64} />
        </div>
      </div>

      <div>
        <p
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#16a34a',
            textTransform: 'uppercase' as const,
            letterSpacing: '1.5px',
            marginBottom: 4,
          }}
        >
          FROM OUR FARM
        </p>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#14532d',
            marginBottom: 6,
            fontFamily: 'var(--font-display)',
          }}
        >
          From Our Farm
        </h3>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#166534',
            lineHeight: 1.6,
            marginBottom: 14,
            opacity: 0.8,
          }}
        >
          From our healthy cows to your home before sunrise.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Ethical Farming', icon: <Leaf size={10} /> },
            { label: 'Healthy Cows', icon: <Sprout size={10} /> },
            { label: 'Sustainable', icon: <RefreshCw size={10} /> }
          ].map((f) => (
            <span
              key={f.label}
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#166534',
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid #86efac',
                borderRadius: 999,
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 40,
            borderRadius: 12,
            border: '1.5px solid #86efac',
            background: 'rgba(255,255,255,0.55)',
            color: '#166534',
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
          }}
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
      style={{
        background: '#ffffff',
        borderRadius: 24,
        border: '1px solid #E8DCC8',
        padding: 24,
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: 300,
        boxShadow: '0 2px 12px rgba(180,140,60,0.08)',
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: '#292524',
          marginBottom: 4,
          fontFamily: 'var(--font-display)',
        }}
      >
        Choose Your Plan
      </h3>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#A8A29E', marginBottom: 16 }}>
        Daily delivery at your convenience
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {plans.map((p) => (
          <button
            key={p.label}
            onClick={() => setSel(p.label)}
            style={{
              padding: '10px 6px',
              borderRadius: 14,
              border: sel === p.label ? '2px solid #1a3a8f' : '1.5px solid #E8DCC8',
              background: sel === p.label ? '#eff6ff' : '#FFFDF7',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ color: '#1a3a8f' }}>{getCategoryIcon(p.emoji, "w-6 h-6")}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: sel === p.label ? '#1a3a8f' : '#57534E',
              }}
            >
              {p.label}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: sel === p.label ? '#0EA5E9' : '#A8A29E',
              }}
            >
              ₹{p.price}/day
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 16 }}>
        {[
          'Pause or Skip anytime',
          'Easy monthly billing',
          'Cancel anytime'
        ].map((f) => (
          <p key={f} style={{ fontSize: 11, fontWeight: 600, color: '#57534E', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={12} className="text-green-600" />
            <span>{f}</span>
          </p>
        ))}
      </div>

      <Link
        href="/subscribe"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #0f172a, #1e3a8f)',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 800,
          textDecoration: 'none',
          marginTop: 'auto',
        }}
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
      <div
        style={{
          minHeight: '100vh',
          background: '#FFFDF7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'var(--font-body)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: 360,
            width: '100%',
            background: '#ffffff',
            borderRadius: 28,
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(180,140,60,0.15)',
            border: '1px solid #E8DCC8',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
            }}
          >
            <CheckCircle color="#fff" size={32} />
          </motion.div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#292524',
              marginBottom: 8,
              fontFamily: 'var(--font-display)',
            }}
          >
            Order Placed!
          </h2>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#A8A29E', marginBottom: 20, lineHeight: 1.7 }}>
            Your farm-fresh products will arrive with your morning milk!
          </p>
          <div
            style={{
              background: '#FFFDF7',
              border: '1px solid #E8DCC8',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#57534E' }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#292524' }}>₹{orderResult.total_amount}</span>
            </div>
            <div style={{ height: 1, background: '#E8DCC8', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#57534E' }}>Delivery</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#292524' }}>
                {new Date(orderResult.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href="/dashboard"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 14,
                border: '1px solid #E8DCC8',
                background: '#FFF8E8',
                color: '#57534E',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
            <button
              onClick={() => { setOrderSuccess(false); setOrderResult(null) }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                color: '#292524',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
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
      <div
        style={{
          minHeight: '100vh',
          background: '#FFFDF7',
          fontFamily: 'var(--font-body)',
          color: '#292524',
          paddingTop: '88px',
        }}
      >

      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #0a1628 0%, #1a3a8f 55%, #0d2260 100%)',
          padding: '48px 5% 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(96,165,250,0.25), transparent)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: '30%',
            width: 400,
            height: 200,
            background: 'radial-gradient(ellipse, rgba(96,165,250,0.1), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 20,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' as const }}
          >
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#93c5fd',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase' as const,
                  marginBottom: 14,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Star size={10} /> Premium Farm Products
              </span>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  letterSpacing: '-0.5px',
                  fontFamily: 'var(--font-display)',
                  marginBottom: 10,
                }}
              >
                Amruth Farm <span style={{ color: '#93c5fd' }}>Shop</span>
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(219,234,254,0.75)', fontWeight: 500, maxWidth: 420, lineHeight: 1.7 }}>
                Handcrafted from our dairy farm — pure ghee, raw honey, fresh butter &amp; more.
                Delivered with your morning milk.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: <Leaf className="text-blue-300 w-6 h-6 mx-auto" />, top: '100% Pure', bot: 'No additives' },
                { icon: <Clock className="text-blue-300 w-6 h-6 mx-auto" />, top: 'By 7 AM', bot: 'Every morning' },
              ].map((s) => (
                <div
                  key={s.top}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    padding: '14px 20px',
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div style={{ marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.top}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#93c5fd' }}>{s.bot}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div
        style={{
          position: 'sticky',
          top: 64,
          zIndex: 30,
          background: 'rgba(255,253,247,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8DCC8',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '10px 5%',
            display: 'flex',
            gap: 8,
            overflowX: 'auto' as const,
          }}
        >
          {categories.map((cat) => {
            const cfg = CAT[cat]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: isActive ? '1.5px solid #292524' : '1.5px solid #E8DCC8',
                  background: isActive ? '#292524' : '#ffffff',
                  color: isActive ? '#ffffff' : '#57534E',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                <span className="flex items-center">{cat === 'all' ? <ShoppingBag size={12} /> : getCategoryIcon(cfg?.emoji || '📦', "w-3 h-3")}</span>
                <span style={{ textTransform: 'capitalize' as const }}>
                  {cat === 'all' ? 'All Products' : (cfg?.label || cat)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 5% 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '3px solid #E8DCC8',
                borderTopColor: '#D97706',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: 12, fontWeight: 600, color: '#A8A29E' }}>Loading farm products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: '#A8A29E', marginBottom: 16 }}><ShoppingBag size={48} /></div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#292524', marginBottom: 8 }}>No products yet</h3>
            <p style={{ fontSize: 12, color: '#A8A29E', fontWeight: 600 }}>Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 48 }}>
            {Object.entries(filtered).map(([category, items]) => {
              const cfg = CAT[category] || CAT.other
              return (
                <section key={category}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: '#FFF8E8',
                        border: '1px solid #E8DCC8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cfg.accentHex,
                      }}
                    >
                      {getCategoryIcon(cfg.emoji, "w-5 h-5")}
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: '#292524',
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1.2,
                          marginBottom: 2,
                        }}
                      >
                        {cfg.label}
                      </h2>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#A8A29E' }}>
                        {items.length} product{items.length > 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>

                  {/* Grid — THIS IS THE KEY FIX */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {items.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
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
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: '#FFF8E8',
                      border: '1px solid #E8DCC8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#D97706',
                    }}
                  >
                    <Award size={22} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#292524',
                        fontFamily: 'var(--font-display)',
                        marginBottom: 2,
                      }}
                    >
                      Why Amruth?
                    </h2>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#A8A29E' }}>Our promise to you</p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 16,
                  }}
                >
                  <FarmCard />
                  <DeliveryCard />
                  <PlanCard />
                </div>
              </section>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 14,
              padding: '14px 20px',
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#dc2626',
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </main>

      {/* ── FLOATING CART (Responsive) ── */}
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
              style={{
                width: '100%',
                height: 56,
                borderRadius: 18,
                border: 'none',
                background: 'linear-gradient(135deg, #1a3a8f, #2563eb)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(37,99,235,0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingBag size={16} color="#fff" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800 }}>
                  {cartCount} item{cartCount > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 900 }}>₹{cartTotal}</span>
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
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 50,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: 420,
                background: '#FFFDF7',
                zIndex: 51,
                display: 'flex',
                flexDirection: 'column' as const,
                boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
              }}
            >
              {/* Cart header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E8DCC8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#292524', fontFamily: 'var(--font-display)' }}>Your Cart</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#A8A29E', marginTop: 2 }}>
                    {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} · ₹${cartTotal}` : 'Empty'}
                  </p>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid #E8DCC8',
                    background: '#FFF8E8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} color="#57534E" />
                </button>
              </div>

              {/* Cart items */}
              <div style={{ flex: 1, overflowY: 'auto' as const, padding: '16px 20px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ color: '#A8A29E', marginBottom: 12, opacity: 0.3 }}><ShoppingCart size={48} className="mx-auto" /></div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#A8A29E' }}>Your cart is empty</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      style={{
                        marginTop: 12,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#D97706',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Continue Shopping →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
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
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: '#ffffff',
                            border: '1px solid #E8DCC8',
                            borderRadius: 16,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background: cfg.cardBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: cfg.accentHex,
                              flexShrink: 0,
                            }}
                          >
                            {getCategoryIcon(cfg.emoji, "w-6 h-6")}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: '#292524',
                                whiteSpace: 'nowrap' as const,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {product.name}
                            </p>
                            <p style={{ fontSize: 10, fontWeight: 600, color: '#A8A29E' }}>
                              ₹{product.price} × {quantity} = ₹{product.price * quantity}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                border: '1px solid #E8DCC8',
                                background: '#FFF8E8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Minus size={10} color="#57534E" />
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#292524', minWidth: 18, textAlign: 'center' }}>
                              {quantity}
                            </span>
                            <button
                              onClick={() => addToCart(product)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                border: 'none',
                                background: cfg.accentHex,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Plus size={10} color="#fff" />
                            </button>
                          </div>
                          <button
                            onClick={() => clearItem(product.id)}
                            style={{
                              padding: 4,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: 6,
                            }}
                          >
                            <X size={13} color="#D1C4B8" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Cart footer */}
              {cart.length > 0 && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #E8DCC8',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: 12,
                  }}
                >
                  {/* Summary */}
                  <div
                    style={{
                      background: '#FFFDF7',
                      border: '1px solid #E8DCC8',
                      borderRadius: 14,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#57534E' }}>Subtotal</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#292524' }}>₹{cartTotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#57534E' }}>Delivery</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>FREE</span>
                    </div>
                    <div style={{ height: 1, background: '#E8DCC8' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#292524' }}>Total</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#292524', fontFamily: 'var(--font-display)' }}>
                        ₹{cartTotal}
                      </span>
                    </div>
                  </div>

                  {/* Delivery note */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#FFF8E8',
                      border: '1px solid #E8DCC8',
                      borderRadius: 10,
                      padding: '8px 12px',
                    }}
                  >
                    <Truck size={13} color="#D97706" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706' }}>
                      Delivered tomorrow morning with your milk <Milk size={10} style={{ display: 'inline' }} />
                    </span>
                  </div>

                  {/* Checkout button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={ordering}
                    style={{
                      width: '100%',
                      height: 52,
                      borderRadius: 14,
                      border: 'none',
                      background: ordering
                        ? '#93c5fd'
                        : 'linear-gradient(135deg, #1a3a8f 0%, #2563eb 100%)',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: ordering ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: ordering ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
                    }}
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

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <Footer />
    </>
  )
}