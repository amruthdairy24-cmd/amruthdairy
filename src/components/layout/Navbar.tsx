'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, ShoppingCart, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#our-story', label: 'Our Story' },
  { href: '#about-us', label: 'About Us' },
  { href: '#products', label: 'Our Products' },
  { href: '/subscribe', label: 'Subscription' },
  { href: '/shop', label: 'Farm Shop' },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeLink, setActiveLink] = useState('#home')
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    // Initial check
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
    const updateCount = () => {
      const saved = localStorage.getItem('amruth_cart')
      if (saved) {
        try {
          const items = JSON.parse(saved)
          const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          setCartCount(count)
        } catch {
          setCartCount(0)
        }
      } else {
        setCartCount(0)
      }
    }
    updateCount()
    window.addEventListener('cart-updated', updateCount)
    window.addEventListener('storage', updateCount)
    return () => {
      window.removeEventListener('cart-updated', updateCount)
      window.removeEventListener('storage', updateCount)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      
      // Determine active section based on scroll position
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

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 h-[88px] flex items-center',
          scrolled
            ? 'bg-white/80 dark:bg-warm-white/80 backdrop-blur-md shadow-card border-b border-border/20 h-[80px]'
            : 'bg-transparent'
        )}
      >
        <div className="container-page flex items-center justify-between w-full">
          {/* Logo with Cow icon */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-brand-secondary border border-blue-100 dark:border-blue-900/30 transition-transform duration-500 group-hover:rotate-[360deg]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M5 10c0-2 2-3 4-3h6c2 0 4 1 4 3" />
                <path d="M5 10v6c0 2 2 3 4 3h6c2 0 4-1 4-3v-6" />
                <circle cx="9" cy="13" r="1" fill="currentColor" />
                <circle cx="15" cy="13" r="1" fill="currentColor" />
                <path d="M10 16c1 0.7 3 0.7 4 0" />
                <path d="M2.5 8.5C4 9.5 5 11 5 13" />
                <path d="M21.5 8.5c-1.5 1-2.5 2.5-2.5 4.5" />
                <path d="M7 7c-.5-1.5-1.5-2.5-3-3" />
                <path d="M17 7c.5-1.5 1.5-2.5 3-3" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-brand-primary dark:text-white">
                Amruth
              </span>
              <span className="text-[9px] font-black tracking-widest uppercase mt-0.5 text-brand-secondary">
                Dairy Farm
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label }) => {
              const isActive = activeLink === href
              const targetHref = href.startsWith('#') ? `/${href}` : href
              return (
                <Link
                  key={href}
                  href={targetHref}
                  onClick={() => setActiveLink(href)}
                  className={cn(
                    'text-sm font-bold transition-all relative py-1.5 text-brand-primary/80 dark:text-brown-600 hover:text-brand-secondary dark:hover:text-brand-secondary group',
                    isActive && 'text-brand-secondary dark:text-brand-secondary'
                  )}
                >
                  {label}
                  <span className={cn(
                    "absolute bottom-0 left-0 right-0 h-[2px] bg-brand-secondary rounded-full transform origin-left transition-transform duration-300",
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )} />
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {/* Cart Icon */}
            <div 
              onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
              className="relative cursor-pointer group mr-2"
            >
              <ShoppingCart size={20} className="text-brand-primary/80 dark:text-brown-600 group-hover:text-brand-secondary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-secondary text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Auth Actions */}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-transparent text-brand-primary dark:text-white font-semibold text-sm border-[1.5px] border-border hover:bg-slate-50/50 dark:hover:bg-cream-200/10 hover:border-brand-primary/45 transition-all duration-200"
                >
                  <User size={14} className="text-brand-primary dark:text-white" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white font-semibold text-sm border border-red-600/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_rgba(220,38,38,0.15)] hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Login button (Outline) */}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-transparent text-brand-primary dark:text-white font-semibold text-sm border-[1.5px] border-border hover:bg-slate-50/50 dark:hover:bg-cream-200/10 hover:border-brand-primary/45 transition-all duration-200"
                >
                  <User size={14} className="text-brand-primary dark:text-white" />
                  <span>Login</span>
                </Link>

                {/* Sign Up button (Elegant 3D Rounded Bubble style) */}
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold text-sm border border-blue-700/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_12px_rgba(29,78,216,0.15)] hover:scale-105 hover:shadow-md transition-all duration-200"
                >
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 focus:outline-none text-brand-primary dark:text-white"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-warm-white/95 backdrop-blur-lg flex flex-col pt-[100px] px-6">
          <nav className="flex flex-col gap-4 mb-8">
            {navLinks.map(({ href, label }) => {
              const targetHref = href.startsWith('#') ? `/${href}` : href
              return (
                <Link
                  key={href}
                  href={targetHref}
                  onClick={() => {
                    setActiveLink(href)
                    setMenuOpen(false)
                  }}
                  className="text-lg font-bold text-brand-primary hover:text-brand-secondary dark:text-white dark:hover:text-brand-secondary py-2 border-b border-slate-100 dark:border-border"
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-border dark:border-border mt-auto flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-semibold text-brown-600">Theme</span>
              <ThemeToggle />
            </div>
            
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-transparent text-brand-primary dark:text-white font-semibold text-base border-[1.5px] border-border"
                  >
                    <User size={16} />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMenuOpen(false)
                    }}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white font-semibold text-base border border-red-600/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_14px_rgba(220, 38, 38, 0.2)] cursor-pointer"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-transparent text-brand-primary dark:text-white font-semibold text-base border-[1.5px] border-border"
                  >
                    <User size={16} />
                    Login
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold text-base border border-blue-700/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_4px_14px_rgba(29, 78, 216, 0.2)]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
