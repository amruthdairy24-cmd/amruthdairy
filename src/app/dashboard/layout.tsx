'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, SkipForward, Palmtree, PlusCircle, FileText,
  LogOut, User, ShoppingBag, Milk, ArrowLeftRight, CalendarDays,
  Menu, X, ChevronDown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ConfirmModal } from '@/components/ui'
import { DashboardDataProvider, useDashboardData } from '@/contexts/DashboardDataContext'
import { Logo } from '@/components/layout/Logo'

const sidebarGroups = [
  {
    title: 'MAIN',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/products', icon: ShoppingBag, label: 'Our Products' },
      { href: '/dashboard/history', icon: CalendarDays, label: 'Delivery History' },
      { href: '/dashboard/bills', icon: FileText, label: 'My Bills' },
    ]
  },
  {
    title: 'SERVICES',
    items: [
      { href: '/dashboard/skip', icon: SkipForward, label: 'Skip Day' },
      { href: '/dashboard/vacation', icon: Palmtree, label: 'Vacation Pause' },
      { href: '/dashboard/extra', icon: PlusCircle, label: 'Extra Milk' },
    ]
  },
  {
    title: 'ACCOUNT',
    items: [
      { href: '/dashboard/account', icon: User, label: 'Account' },
      { href: '#logout', icon: LogOut, label: 'Logout', isLogout: true },
    ]
  }
]

// Flat items for mobile bottom nav (max 5 for space)
const mobileNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/skip', icon: SkipForward, label: 'Skip' },
  { href: '/dashboard/extra', icon: PlusCircle, label: 'Extra' },
  { href: '/dashboard/bills', icon: FileText, label: 'Bills' },
  { href: '/dashboard/account', icon: User, label: 'Account' },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setTheme } = useTheme()
  const { data } = useDashboardData()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dateStr, setDateStr] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
    const d = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    setDateStr(`${days[d.getDay()]} , ${d.getDate()} ${months[d.getMonth()]}`)
  }, [])

  const profileName = data?.profile?.full_name || 'Customer'
  const profilePhone = data?.profile?.phone || ''
  const status = data?.subscription?.status || 'active'

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
    <div className="flex h-screen font-sans text-slate-900 dark:text-slate-100 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-[260px] z-30 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 transition-colors duration-300">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center justify-center flex-shrink-0">
          <Logo href="/dashboard" className="w-52 h-16 object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto hide-scrollbar">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] px-3 text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="space-y-[3px]">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
                  const Icon = item.icon
                  
                  const linkContent = (
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-150 relative overflow-hidden",
                        isActive 
                          ? "bg-[#014DA4]/10 dark:bg-[#014DA4]/15 text-[#014DA4] dark:text-blue-400 font-bold" 
                          : "text-slate-600 dark:text-slate-300 hover:text-[#014DA4] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/45 font-medium"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#014DA4]" />
                      )}
                      <Icon
                        size={17}
                        className={cn(
                          "relative z-10 flex-shrink-0 transition-colors",
                          isActive ? "text-[#014DA4] dark:text-blue-400" : "text-slate-450 dark:text-slate-400 dark:text-slate-500 group-hover:text-[#014DA4] dark:group-hover:text-blue-400"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="text-[13px] relative z-10">{item.label}</span>
                    </div>
                  )

                  if (item.isLogout) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full text-left bg-transparent border-none p-0 outline-none cursor-pointer block group"
                      >
                        {linkContent}
                      </button>
                    )
                  }

                  return (
                    <Link key={item.href} href={item.href} className="relative block group">
                      {linkContent}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Area */}
        <div className="p-4 flex-shrink-0 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-900/20">
          {dateStr && (
            <div className="py-1.5 px-3 rounded-xl text-[11px] font-bold text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
              📅 {dateStr}
            </div>
          )}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[13px] text-white flex-shrink-0 bg-gradient-to-br from-[#014DA4] to-brand-secondary shadow-sm shadow-brand-primary/10">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{profileName}</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-555 truncate mt-0.5 leading-none">{profilePhone}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Topbar */}
        <header className="bg-white dark:bg-slate-900 flex items-center justify-between px-6 z-20 flex-shrink-0 sticky top-0 border-b border-slate-100 dark:border-slate-800 h-16 transition-colors duration-300">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent border-none cursor-pointer flex items-center justify-center"
            >
              <Menu size={22} />
            </button>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase truncate">
              {getBreadcrumbs()}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Status Badge */}
            <div
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                status === 'active' 
                  ? "bg-green-500/10 text-green-700 border-green-200/40" 
                  : "bg-amber-500/10 text-amber-700 border-amber-200/40"
              )}
            >
              <span 
                className={cn(
                  "w-1.5 h-1.5 rounded-full", 
                  status === 'active' ? "bg-green-500" : "bg-amber-500"
                )} 
              />
              {status === 'active' ? 'Active Plan' : status === 'paused' ? 'Paused' : 'Payment Due'}
            </div>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />
            
            <ThemeToggle />

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />

            {/* Profile Chip */}
            <div className="flex items-center gap-2 p-1 rounded-xl transition-colors cursor-pointer border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white bg-gradient-to-br from-[#014DA4] to-brand-secondary">
                {initials}
              </div>
              <div className="hidden sm:block text-left min-w-0 pr-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">{profileName.split(' ')[0]}</p>
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Subscriber</p>
              </div>
              <ChevronDown size={13} className="text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-24 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.015)] transition-colors duration-300">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors min-w-0 text-center",
                isActive ? "text-[#014DA4] dark:text-blue-400 font-bold scale-105" : "text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-[#014DA4] dark:hover:text-blue-400"
              )}
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold truncate">{item.label}</span>
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-[70] lg:hidden shadow-2xl flex flex-col bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 transition-colors duration-300"
            >
              <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex-1 flex justify-center py-1">
                  <Logo href="/dashboard" className="w-52 h-16 object-contain" />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {sidebarGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] px-3 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      {group.title}
                    </p>
                    <div className="space-y-[3px]">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
                        const Icon = item.icon
                        
                        const linkContent = (
                          <div
                            className={cn(
                              "flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-150 relative overflow-hidden",
                              isActive 
                                ? "bg-[#014DA4]/10 dark:bg-[#014DA4]/15 text-[#014DA4] dark:text-blue-400 font-bold" 
                                : "text-slate-655 dark:text-slate-300 hover:text-[#014DA4] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/45 font-medium"
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#014DA4]" />
                            )}
                            <Icon
                              size={17}
                              className={isActive ? "text-[#014DA4] dark:text-blue-400" : "text-slate-455 dark:text-slate-400 dark:text-slate-500"}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="text-[13px]">{item.label}</span>
                          </div>
                        )

                        if (item.isLogout) {
                          return (
                            <button
                              key={item.label}
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                setShowLogoutConfirm(true)
                              }}
                              className="w-full text-left bg-transparent border-none p-0 outline-none cursor-pointer block group"
                            >
                              {linkContent}
                            </button>
                          )
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="relative block group"
                          >
                            {linkContent}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-4 flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-all border border-red-200/45 bg-red-500/10 text-red-600 hover:bg-red-500/15 cursor-pointer h-9"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
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
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardDataProvider>
  )
}

