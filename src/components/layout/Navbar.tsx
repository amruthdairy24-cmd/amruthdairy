'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConfirmModal } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
const navLinks = [
  {href:'/' ,label:'Home'},
  { href: '/#products', label: 'Products' },
  { href: '/subscribe', label: 'Subscription' },
  // { href: '/shop', label: 'Farm Shop' },
  { href: '/#about-us', label: 'About Us' },
  { href: '/#our-story', label: 'Our Story' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('#home')
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { cartItems, isCartOpen, openCart, closeCart, updateQuantity, removeFromCart, cartTotal } = useCart()
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      const sections = ['home', 'our-story', 'about-us', 'products', 'plans']
      const scrollPos = window.scrollY + 120

      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveLink(`#${section}`)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const forceWhiteBg = pathname === '/login' || pathname === '/signup' || pathname === '/subscribe'

  return (
    <>
      <header className={`fixed w-full z-50 transition-all duration-500 h-[70px] flex items-center px-10 ${isScrolled || forceWhiteBg ? 'bg-white shadow-sm' : 'bg-white shadow-sm md:bg-transparent md:shadow-none'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/logo/amruth-logo.png" alt="logo" width={100} height={100} className="w-25 h-15" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label }) => {
              const targetHref = href.startsWith("#") ? `/${href}` : href
              const isActive = activeLink === href

              return (
                <Link
                  key={href}
                  href={targetHref}
                  onClick={() => setActiveLink(href)}
                  className={`font-cabinet text-sm font-bold transition-all duration-300 ${isActive
                      ? "text-brand-secondary"
                      : "text-brand-primary/80 dark:text-slate-300 hover:text-brand-secondary"
                    }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={openCart}
              className="relative p-2 text-brand-primary dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-transparent text-brand-primary dark:text-white font-semibold text-sm border-[1.5px] border-border dark:border-slate-800 hover:bg-slate-50/50 dark:bg-slate-800/50 hover:border-brand-primary/45 transition-all duration-200"
                >
                  <User size={14} className="text-brand-primary dark:text-white" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white font-semibold text-sm border border-red-600/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_rgba(220,38,38,0.15)] hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 h-10 px-15 rounded-xl bg-[#02429C] text-white font-semibold text-sm hover:bg-[#013378] transition-all"
                >
                  {/* <User size={14} className="text-white" /> */}
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={openCart}
              className="relative p-1.5 focus:outline-none text-brand-primary dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ShoppingCart size={22} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 focus:outline-none text-brand-primary dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm z-40 bg-white flex flex-col pt-[100px] px-6 shadow-2xl"
            >
              <nav className="flex flex-col gap-2 mb-8">
                {navLinks.map(({ href, label }) => {
                  const targetHref = href.startsWith('#') ? `/${href}` : href
                  const isActive = activeLink === href
                  return (
                    <Link
                      key={href}
                      href={targetHref}
                      onClick={() => {
                        setActiveLink(href)
                        setMenuOpen(false)
                      }}
                      className={`text-lg font-semibold py-3 px-4 rounded-xl transition-all ${isActive
                          ? 'bg-blue-50 text-[#02429C]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#02429C]'
                        }`}
                    >
                      {label}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 mt-auto mb-6 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-50 text-brand-primary font-semibold text-base border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <User size={18} />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        setShowLogoutConfirm(true)
                      }}
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-red-50 text-red-600 font-semibold text-base border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#02429C] text-white font-semibold text-base hover:bg-[#013378] transition-colors shadow-md"
                    >
                      <User size={18} />
                      Login
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] z-[70] bg-white flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart size={24} className="text-[#1230AE]" />
                  Your Cart
                </h2>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                    <ShoppingCart size={64} className="opacity-20" />
                    <p>Your cart is empty.</p>
                    <button
                      onClick={closeCart}
                      className="mt-4 px-6 py-2 bg-[#1230AE] text-white rounded-full font-semibold hover:bg-[#0f2a96] transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {cartItems.map(item => (
                      <div key={item.name} className="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="relative w-20 h-20 rounded-xl bg-[#F8FAFC] overflow-hidden flex-shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-slate-900">{item.name}</h3>
                              <p className="text-xs text-slate-500">{item.price} / {item.unit}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.name)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-slate-200 rounded-full">
                              <button
                                onClick={() => updateQuantity(item.name, item.quantity - 1)}
                                className="p-1.5 hover:bg-slate-50 rounded-l-full text-slate-600"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.name, item.quantity + 1)}
                                className="p-1.5 hover:bg-slate-50 rounded-r-full text-slate-600"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="font-extrabold text-slate-900">
                              ₹{(parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-xl font-extrabold text-slate-900">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="w-full py-3.5 bg-[#1230AE] text-white rounded-xl font-bold shadow-[0_4px_12px_rgba(18,48,174,0.25)] hover:bg-[#0f2a96] hover:-translate-y-0.5 transition-all active:scale-[0.98]">
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your session?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        danger
      />
    </>
  )
}