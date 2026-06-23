'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, SkipForward, Palmtree, PlusCircle, FileText,
  LogOut, User, ShoppingBag, Milk, ArrowLeftRight, CalendarDays,
  Menu, X, ChevronDown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const sidebarGroups = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/history', icon: CalendarDays, label: 'Delivery History' },
      { href: '/dashboard/bills', icon: FileText, label: 'My Bills' },
    ]
  },
  {
    title: 'Actions',
    items: [
      { href: '/dashboard/skip', icon: SkipForward, label: 'Skip Day' },
      { href: '/dashboard/vacation', icon: Palmtree, label: 'Vacation Pause' },
      { href: '/dashboard/extra', icon: PlusCircle, label: 'Extra Milk' },
      { href: '/dashboard/quantity', icon: ArrowLeftRight, label: 'Change Plan' },
    ]
  },
  {
    title: 'More',
    items: [
      { href: '/shop', icon: ShoppingBag, label: 'Farm Shop' },
      { href: '/account', icon: User, label: 'Account' },
    ]
  }
]

// Flat items for mobile bottom nav (max 5 for space)
const mobileNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/skip', icon: SkipForward, label: 'Skip' },
  { href: '/dashboard/extra', icon: PlusCircle, label: 'Extra' },
  { href: '/dashboard/bills', icon: FileText, label: 'Bills' },
  { href: '/account', icon: User, label: 'Account' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [profileName, setProfileName] = useState('Customer')
  const [profilePhone, setProfilePhone] = useState('')
  const [status, setStatus] = useState<string>('active')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setMounted(true)
    const d = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    setDateStr(`${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`)
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/customer/dashboard')
        const data = await res.json()
        if (data.success && data.profile) {
          setProfileName(data.profile.full_name || 'Customer')
          setProfilePhone(data.profile.phone || '')
          if (data.subscription) {
            setStatus(data.subscription.status)
          }
        }
      } catch (err) {
        console.error('Failed to load layout profile details')
      }
    }
    fetchProfile()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length <= 1) return 'My Milk / Dashboard'
    return `My Milk / ${parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')}`
  }

  const initials = profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (!mounted) return null

  return (
    <div className="flex h-screen font-sans text-[#0f172a] overflow-hidden" style={{ background: '#F5F2EB' }}>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className="hidden lg:flex flex-col w-[260px] z-30 flex-shrink-0"
        style={{
          background: '#0f172a',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)'
        }}
      >
        {/* Logo */}
        <div
          className="px-5 flex items-center gap-3 flex-shrink-0"
          style={{ height: '72px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
          >
            <span style={{ fontSize: '18px' }}>🥛</span>
          </div>
          <div>
            <p className="text-[20px] font-black text-white leading-none tracking-tight font-display">Amruth</p>
            <p className="text-[8px] font-extrabold uppercase tracking-widest mt-1" style={{ color: '#D97706', letterSpacing: '2px' }}>
              My Subscription
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar-hidden">
          {sidebarGroups.map((group, gIdx) => (
            <div key={group.title}>
              <p
                className="text-[9px] font-extrabold uppercase tracking-[2px] px-3 mb-1.5"
                style={{ color: 'rgba(255,255,255,0.25)', paddingTop: gIdx === 0 ? '4px' : '16px' }}
              >
                {group.title}
              </p>
              <div className="space-y-[2px]">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} className="relative block group">
                      <div
                        className="flex items-center gap-3 px-3 rounded-xl transition-all duration-150 relative overflow-hidden"
                        style={{
                          height: '42px',
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(30,58,143,0.9), rgba(37,99,235,0.8))'
                            : 'transparent',
                          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                          border: isActive ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent',
                          boxShadow: isActive ? '0 2px 12px rgba(37,99,235,0.4)' : 'none'
                        }}
                      >
                        {!isActive && (
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                        )}
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-[3px]"
                            style={{ background: '#60a5fa' }}
                          />
                        )}
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                          className="relative z-10 flex-shrink-0"
                        />
                        <span className="text-[13px] font-bold relative z-10">{item.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Area */}
        <div className="p-3 flex-shrink-0 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {dateStr && (
            <div
              className="py-1.5 px-3 rounded-lg text-[11px] font-bold text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)'
              }}
            >
              📅 {dateStr}
            </div>
          )}
          <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div
              className="w-[34px] h-[34px] rounded-lg flex items-center justify-center font-black text-[13px] text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1e3a8f, #2563eb)' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{profileName}</p>
              <p className="text-[10px] font-semibold text-white/40 truncate">{profilePhone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-all border outline-none cursor-pointer"
            style={{
              height: '34px',
              background: 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.15)',
              color: 'rgba(239,68,68,0.7)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
              e.currentTarget.style.color = 'rgba(239,68,68,0.7)'
            }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Topbar */}
        <header
          className="bg-white flex items-center px-6 z-20 flex-shrink-0 sticky top-0"
          style={{ height: '64px', borderBottom: '1px solid #e8edf5', justifyContent: 'space-between' }}
        >
          <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-[#475569] hover:text-[#0f172a] bg-transparent border-none cursor-pointer"
            >
              <Menu size={22} />
            </button>
            <span className="text-[11px] font-bold tracking-wide text-[#94a3b8] truncate">
              {getBreadcrumbs()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold"
              style={{
                background: status === 'active' ? '#dcfce7' : '#fef3c7',
                color: status === 'active' ? '#16a34a' : '#d97706',
                border: `1px solid ${status === 'active' ? '#bbf7d0' : '#fde68a'}`
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === 'active' ? '#16a34a' : '#d97706' }} />
              {status === 'active' ? 'Active Plan' : status === 'paused' ? 'Paused' : 'Payment Due'}
            </div>

            <div className="w-[1px]" style={{ height: '24px', background: '#e8edf5' }} />

            {/* Profile Chip */}
            <div
              className="flex items-center gap-2 p-1 rounded-xl transition-colors cursor-pointer border border-[#e8edf5]"
              style={{ background: '#f8fafc' }}
            >
              <div
                className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center font-black text-xs text-white"
                style={{ background: 'linear-gradient(135deg, #1e3a8f, #2563eb)' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left min-w-0 pr-1">
                <p className="text-[12px] font-bold text-[#0f172a] leading-none">{profileName.split(' ')[0]}</p>
                <p className="text-[10px] font-semibold text-[#94a3b8] mt-0.5 leading-none">Subscriber</p>
              </div>
              <ChevronDown size={14} className="text-[#94a3b8]" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-24 lg:pb-6" style={{ background: '#F5F2EB' }}>
          {children}
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e8edf5',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
        }}
      >
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors min-w-0"
              style={{
                color: isActive ? '#2563eb' : '#94a3b8',
                textDecoration: 'none'
              }}
            >
              <Icon size={18} />
              <span className="text-[9px] font-extrabold truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ===== MOBILE SLIDE-OUT MENU ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-[70] lg:hidden shadow-2xl flex flex-col"
              style={{ background: '#0f172a' }}
            >
              <div
                className="px-6 flex items-center justify-between flex-shrink-0"
                style={{ height: '72px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
                  >
                    <span style={{ fontSize: '18px' }}>🥛</span>
                  </div>
                  <div>
                    <p className="text-[20px] font-black text-white leading-none tracking-tight font-display">Amruth</p>
                    <p className="text-[8px] font-extrabold uppercase tracking-widest mt-1" style={{ color: '#D97706' }}>
                      My Subscription
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/10 bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                {sidebarGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-[9px] font-extrabold uppercase tracking-[2px] px-3 mb-1.5 text-white/20">
                      {group.title}
                    </p>
                    <div className="space-y-[2px]">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="relative block group"
                          >
                            <div
                              className="flex items-center gap-3 px-3 rounded-xl transition-all relative overflow-hidden"
                              style={{
                                height: '42px',
                                background: isActive
                                  ? 'linear-gradient(135deg, rgba(30,58,143,0.9), rgba(37,99,235,0.8))'
                                  : 'transparent',
                                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                                border: isActive ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent',
                                boxShadow: isActive ? '0 2px 12px rgba(37,99,235,0.4)' : 'none'
                              }}
                            >
                              <Icon
                                size={18}
                                style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                                className="relative z-10 flex-shrink-0"
                              />
                              <span className="text-[13px] font-bold relative z-10">{item.label}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-all border outline-none cursor-pointer"
                  style={{
                    height: '36px',
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.15)',
                    color: 'rgba(239,68,68,0.7)',
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
