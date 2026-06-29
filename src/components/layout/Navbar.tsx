'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
const navLinks = [
  { href: '#products', label: 'Products' },
  { href: '/subscribe', label: 'Subscription' },
  { href: '/shop', label: 'Farm Shop' },
  { href: '#about-us', label: 'About Us' },
  { href: '#our-story', label: 'Our Story' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('#home')
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

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
      <header className={`fixed w-full z-50 transition-all duration-500 h-[75px] flex items-center px-10 ${isScrolled || forceWhiteBg ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
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
                  className={`text-sm font-bold transition-all duration-300 ${isActive
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
                  onClick={handleLogout}
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
                        handleLogout()
                        setMenuOpen(false)
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
    </>
  )
}