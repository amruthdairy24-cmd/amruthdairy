'use client'
import { Milk, SkipForward, PalmtreeIcon, Plus, FileText, ShoppingBag, Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ThemeToggle'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/skip', icon: '⏭️', label: 'Skip Day' },
  { href: '/dashboard/vacation', icon: '🏖️', label: 'Vacation' },
  { href: '/dashboard/extra', icon: '➕', label: 'Extra Milk' },
  { href: '/dashboard/bills', icon: '💰', label: 'My Bills' },
  { href: '/shop', icon: '🛒', label: 'Shop' },
  { href: '/account', icon: '👤', label: 'Account' },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [profileName, setProfileName] = useState('Customer')
  const [profilePhone, setProfilePhone] = useState('')
  const [status, setStatus] = useState<string>('active')

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
      } catch (err) {}
    }
    fetchProfile()
  }, [])
  return (
    <div className="min-h-screen flex bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-cream-100 fixed top-0 bottom-0 left-0 z-30 border-r border-border/50 dark:border-slate-800/80">
        
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-50 dark:border-slate-900/50">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#014DA4] to-brand-secondary flex items-center justify-center text-white border border-[#E2E8F0]/10 transition-transform duration-500 group-hover:rotate-[360deg]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                <path d="M5 10c0-2 2-3 4-3h6c2 0 4 1 4 3" />
                <path d="M5 10v6c0 2 2 3 4 3h6c2 0 4-1 4-3v-6" />
                <circle cx="9" cy="13" r="1" fill="currentColor" />
                <circle cx="15" cy="13" r="1" fill="currentColor" />
                <path d="M10 16c1 0.7 3 0.7 4 0" />
                <path d="M2.5 8.5C4 9.5 5 11 5 13" />
                <path d="M21.5 8.5c-1.5 1-2.5 2.5-2.5 4.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Amruth</p>
              <p className="text-[10px] text-brand-secondary dark:text-brand-secondary/85 font-black uppercase tracking-wider">Dairy Farm</p>
            </div>
          </Link>
        </div>

        {/* Customer info */}
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#014DA4] to-brand-secondary text-white font-black text-sm flex items-center justify-center flex-shrink-0 border border-[#E2E8F0]/10">
              {profileName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profileName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profilePhone}</p>
            </div>
          </div>
          <div className="mt-3">
            <span className={cn(
              "text-[10px] font-bold border rounded-xl px-2.5 py-0.5 inline-block",
              status === 'active' 
                ? "text-[#16a34a] bg-green-500/10 border-green-500/20" 
                : "text-amber-600 bg-amber-500/10 border-amber-500/20"
            )}>
              ● {status === 'active' ? 'Active Subscription' : 'Subscription ' + status}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Account navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl mb-1',
                'text-sm font-semibold text-slate-655 dark:text-white/70',
                'transition-all duration-150',
                'hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#014DA4] dark:hover:text-brand-secondary',
                item.href === '/account' && 'bg-[#014DA4]/10 dark:bg-white/10 text-[#014DA4] dark:text-white border-l-[3.5px] border-[#014DA4] dark:border-white'
              )}
            >
              <span role="img" aria-label={item.label}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-semibold text-white/40 hover:bg-white/10 hover:text-white transition-colors border-none cursor-pointer bg-transparent text-left">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 flex flex-col min-w-0">
        {/* Desktop Topbar header */}
        <header className="hidden lg:flex items-center justify-between px-8 bg-white dark:bg-cream-100 border-b border-border/45 dark:border-slate-800/80 h-16 sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Profile & Security Settings
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile top nav */}
        <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-cream-100 px-4 py-3 flex items-center justify-between border-b border-border/45 dark:border-slate-800/80">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#014DA4] to-brand-secondary rounded-lg flex items-center justify-center text-white">
              <span className="text-sm">🥛</span>
            </div>
            <span className="text-sm font-bold text-slate-950 dark:text-white">Amruth Milk</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{profileName}</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-8 relative">
          {children}
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden sticky bottom-0 bg-white dark:bg-cream-100 border-t border-border/50 dark:border-slate-800/80 flex z-30 transition-colors duration-300" aria-label="Mobile navigation">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.href === '/account'
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 text-slate-450 dark:text-slate-500 hover:text-[#014DA4] dark:hover:text-sky-400 transition-colors min-w-0",
                  isActive && "text-[#014DA4] dark:text-sky-400"
                )}
              >
                <span className="text-lg" role="img" aria-label={item.label}>{item.icon}</span>
                <span className="text-[9px] font-bold truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </main>
    </div>
  )
}
