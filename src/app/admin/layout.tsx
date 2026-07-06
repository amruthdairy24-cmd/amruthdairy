'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Repeat,
  Truck,
  CreditCard,
  Package,
  Layers,
  Clock,
  BarChart2,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

// Nav Items Grouped by Section
const sidebarGroups = [
  {
    title: 'Operations',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/admin/customers', icon: Users, label: 'Customers' },
      { href: '/admin/subscriptions', icon: Repeat, label: 'Subscriptions' },
      { href: '/admin/deliveries', icon: Truck, label: 'Deliveries' },
    ]
  },
  {
    title: 'Management',
    items: [
      { href: '/admin/billing', icon: CreditCard, label: 'Billing' },
      { href: '/admin/products', icon: Package, label: 'Products' },
      { href: '/admin/capacity', icon: Layers, label: 'Capacity' },
      { href: '/admin/waitlist', icon: Clock, label: 'Waitlist' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ]
  }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { setTheme } = useTheme()
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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length <= 1) return 'Admin / Dashboard'
    return `Admin / ${parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')}`
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen font-sans text-slate-900 dark:text-slate-100 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* =========================================
          DESKTOP SIDEBAR
      ========================================= */}
      <aside className="hidden lg:flex flex-col w-[260px] z-30 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 transition-colors duration-300">
        {/* Logo Area */}
        <div className="px-5 flex items-center gap-3 flex-shrink-0 h-[72px] border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-[#014DA4] to-brand-secondary shadow-md shadow-brand-primary/10">
            <span className="text-lg">🐄</span>
          </div>
          <div>
            <p className="text-[18px] font-black text-slate-900 dark:text-white leading-none tracking-tight font-display">Amruth</p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-1.5 text-brand-secondary">
              Dairy Admin
            </p>
          </div>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto hide-scrollbar">
          {sidebarGroups.map((group, gIdx) => (
            <div key={group.title} className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] px-3 text-slate-500 dark:text-slate-400">
                {group.title}
              </p>
              <div className="space-y-[3px]">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative block group"
                    >
                      <div className={cn(
                        "flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-150 relative overflow-hidden border border-transparent",
                        isActive 
                          ? "bg-[#014DA4]/10 dark:bg-[#014DA4]/15 text-[#014DA4] dark:text-blue-400 font-bold" 
                          : "text-slate-600 dark:text-slate-300 hover:text-[#014DA4] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/45 font-medium"
                      )}>
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#014DA4]" />
                        )}

                        <Icon 
                          size={17} 
                          strokeWidth={isActive ? 2.5 : 2} 
                          className={cn(
                            "relative z-10 flex-shrink-0 transition-colors",
                            isActive ? "text-[#014DA4] dark:text-blue-400" : "text-slate-400 group-hover:text-[#014DA4] dark:group-hover:text-blue-400"
                          )}
                        />
                        <span className="text-[13px] relative z-10">{item.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Area */}
        <div className="p-4 flex-shrink-0 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-900/20">
          {/* Date Chip */}
          {dateStr && (
            <div className="py-1.5 px-3 rounded-xl text-[11px] font-bold text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
              📅 {dateStr}
            </div>
          )}

          {/* User Chip */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[13px] text-white flex-shrink-0 bg-gradient-to-br from-[#014DA4] to-brand-secondary shadow-sm shadow-brand-primary/10">
              A
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">Admin User</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-550 truncate mt-0.5 leading-none">Super Admin</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-all border border-red-200/45 bg-red-500/10 text-red-600 hover:bg-red-500/15 hover:text-red-750 outline-none cursor-pointer h-[34px]"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT AREA (Topbar + Body Content)
      ========================================= */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-900 flex items-center justify-between px-6 z-20 flex-shrink-0 sticky top-0 h-16 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
          {/* Mobile Menu Trigger & Breadcrumb */}
          <div className="flex items-center gap-4 w-[240px] flex-shrink-0 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-slate-500 dark:text-slate-455 hover:text-slate-800 dark:hover:text-white bg-transparent border-none cursor-pointer flex items-center justify-center"
            >
              <Menu size={22} />
            </button>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
              {getBreadcrumbs()}
            </span>
          </div>

          {/* Search bar - Center */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            {/* Global search removed per request */}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 w-[240px] flex-shrink-0 justify-end">
            <ThemeToggle />

            {/* Notification Bell */}
            <button className="relative flex items-center justify-center rounded-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-800 w-[38px] h-[38px] bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Bell size={18} className="text-slate-500 dark:text-slate-400" />
              {/* Red dot badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
            </button>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />

            {/* Admin Profile Chip */}
            <div className="flex items-center gap-2 p-1 rounded-xl transition-colors cursor-pointer border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white bg-gradient-to-br from-[#014DA4] to-brand-secondary">
                A
              </div>
              <div className="hidden sm:block text-left min-w-0 pr-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">Admin</p>
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Super Admin</p>
              </div>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* =========================================
          MOBILE OVERLAY MENU (Matching theme)
      ========================================= */}
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
              className="fixed top-0 bottom-0 left-0 w-[280px] z-[70] lg:hidden shadow-2xl flex flex-col bg-white border-r border-slate-150 transition-colors duration-300"
            >
              <div className="px-6 flex items-center justify-between flex-shrink-0 h-[72px] border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-[#014DA4] to-brand-secondary shadow-sm">
                    <span className="text-lg">🐄</span>
                  </div>
                  <div>
                    <p className="text-[18px] font-black text-slate-900 leading-none tracking-tight font-display">Amruth</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1 text-brand-secondary">
                      Dairy Admin
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {sidebarGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] px-3 text-slate-400">
                      {group.title}
                    </p>
                    <div className="space-y-[3px]">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin')
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="relative block group"
                          >
                            <div className={cn(
                              "flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-155 relative overflow-hidden border border-transparent",
                              isActive 
                                ? "bg-[#014DA4]/10 text-[#014DA4] font-bold" 
                                : "text-slate-600 hover:text-[#014DA4] hover:bg-slate-50 font-medium"
                            )}>
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#014DA4]" />
                              )}
                              <Icon 
                                size={17} 
                                className={cn(
                                  "relative z-10 flex-shrink-0",
                                  isActive ? "text-[#014DA4]" : "text-slate-400"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                              />
                              <span className="text-[13px] relative z-10">{item.label}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              
              <div className="p-4 flex-shrink-0 border-t border-slate-100">
                {/* Mobile Logout */}
                <button
                  onClick={handleSignOut}
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
    </div>
  )
}
