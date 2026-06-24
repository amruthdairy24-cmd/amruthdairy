// app/(auth)/login/page.tsx
'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { 
  ChevronRight, Mail, Lock, User, CheckCircle,
  Clock, Plane, Package, CreditCard, ShieldCheck,
  ArrowLeft, Eye, EyeOff, AtSign
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'login' | 'register' | 'verify' | 'success' | 'forgot' | 'forgot-verify' | 'reset' | 'reset-success'

interface ApiResponse {
  success: boolean
  message?: string
  role?: string
  is_new_user?: boolean
  has_active_subscription?: boolean
}

// ─── Redirect helper ──────────────────────────────────────────────────────────
function getRedirectDestination(data: ApiResponse): string {
  if (data.role === 'admin') return '/admin'
  if (data.is_new_user) return '/onboarding'
  if (data.has_active_subscription) return '/dashboard'
  return '/onboarding'
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [step, setStep]           = useState<Step>('login')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [isDev, setIsDev]         = useState(false)
  const [greeting, setGreeting]   = useState('Welcome Back! 👋')

  // Login form
  const [identifier, setIdentifier]   = useState('')  // username or email
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register form
  const [regUsername, setRegUsername]         = useState('')
  const [regEmail, setRegEmail]               = useState('')
  const [regPassword, setRegPassword]         = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // OTP (registration)
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)

  // Forgot Password
  const [forgotEmail, setForgotEmail]         = useState('')
  const [forgotOtp, setForgotOtp]             = useState(['', '', '', '', '', ''])
  const [forgotToken, setForgotToken]         = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotCountdown, setForgotCountdown] = useState(0)
  const forgotIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const formId = useId()

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') setIsDev(true)
    const hour = new Date().getHours()
    if (hour < 12)      setGreeting('Good Morning! 🌅')
    else if (hour < 17) setGreeting('Good Afternoon! ☀️')
    else                setGreeting('Good Evening! 🌙')

    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'register') setStep('register')

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // ── Countdown timer (OTP resend) ────────────────────────────────────────────
  function startCountdown() {
    setCountdown(60)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function startForgotCountdown() {
    setForgotCountdown(60)
    if (forgotIntervalRef.current) clearInterval(forgotIntervalRef.current)
    forgotIntervalRef.current = setInterval(() => {
      setForgotCountdown(prev => {
        if (prev <= 1) { clearInterval(forgotIntervalRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── LOGIN submit ─────────────────────────────────────────────────────────────
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password) { setError('Please fill in all fields.'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      })
      const data: ApiResponse = await res.json()

      if (data.success) {
        setStep('success')
        setTimeout(() => { window.location.href = getRedirectDestination(data) }, 1400)
      } else {
        setError(data.message || 'Login failed. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── REGISTER submit → send OTP ────────────────────────────────────────────────
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all fields.'); return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(regUsername.trim())) {
      setError('Username: 3–20 chars, letters, numbers, and underscore only.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('Please enter a valid email address.'); return
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }

    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          username: regUsername.trim(),
          password: regPassword,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setStep('verify')
        startCountdown()
        // Focus first OTP box after animation
        setTimeout(() => {
          const el = document.getElementById(`${formId}-otp-0`) as HTMLInputElement
          el?.focus()
        }, 300)
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────────
  async function handleResendOtp() {
    if (countdown > 0) return
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          username: regUsername.trim(),
          password: regPassword,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOtp(['', '', '', '', '', ''])
        startCountdown()
      } else {
        setError(data.message || 'Failed to resend OTP.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP input handling ────────────────────────────────────────────────────────
  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      const next = document.getElementById(`${formId}-otp-${index + 1}`) as HTMLInputElement
      next?.focus()
    }
    if (newOtp.every(d => d !== '') && value) handleOtpVerify(newOtp.join(''))
  }

  function handleOtpKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`${formId}-otp-${index - 1}`) as HTMLInputElement
      prev?.focus()
    }
  }

  // ── OTP verify ───────────────────────────────────────────────────────────────
  async function handleOtpVerify(code: string) {
    if (code.length !== 6) return
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          token: code,
          password: regPassword
        }),
      })
      const data: ApiResponse = await res.json()

      if (data.success) {
        setStep('success')
        setTimeout(() => { window.location.href = getRedirectDestination(data) }, 1400)
      } else {
        setError(data.message || 'Invalid code. Please try again.')
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => {
          const el = document.getElementById(`${formId}-otp-0`) as HTMLInputElement
          el?.focus()
        }, 50)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function clearError() { if (error) setError('') }

  // ── FORGOT PASSWORD: send OTP ─────────────────────────────────────────────
  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail.trim()) { setError('Please enter your email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setError('Please enter a valid email address.'); return
    }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('forgot-verify')
        startForgotCountdown()
        setForgotOtp(['', '', '', '', '', ''])
        setTimeout(() => {
          const el = document.getElementById(`${formId}-fotp-0`) as HTMLInputElement
          el?.focus()
        }, 300)
      } else {
        setError(data.message || 'Failed to send reset code.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── FORGOT OTP input ──────────────────────────────────────────────────────
  function handleForgotOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return
    const next = [...forgotOtp]
    next[index] = value.slice(-1)
    setForgotOtp(next)
    if (value && index < 5) {
      const el = document.getElementById(`${formId}-fotp-${index + 1}`) as HTMLInputElement
      el?.focus()
    }
    if (next.every(d => d !== '') && value) {
      setForgotToken(next.join(''))
      setStep('reset')
      setError('')
    }
  }

  function handleForgotOtpKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
      const el = document.getElementById(`${formId}-fotp-${index - 1}`) as HTMLInputElement
      el?.focus()
    }
  }

  // ── FORGOT OTP resend ─────────────────────────────────────────────────────
  async function handleForgotResend() {
    if (forgotCountdown > 0) return
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (data.success) {
        setForgotOtp(['', '', '', '', '', ''])
        startForgotCountdown()
      } else {
        setError(data.message || 'Failed to resend code.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  // ── RESET PASSWORD submit ─────────────────────────────────────────────────
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          token: forgotToken,
          newPassword,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('reset-success')
      } else {
        setError(data.message || 'Failed to reset password.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Features list ─────────────────────────────────────────────────────────────
  const features = [
    { icon: Clock,      label: 'Early Delivery',  desc: 'At your doorstep before 7:00 AM daily.' },
    { icon: Plane,      label: 'Vacation Pause',  desc: 'Pause delivery dynamically with full refunds.' },
    { icon: Package,    label: 'Premium Milk',    desc: 'Rich, creamy, farm-sourced fresh milk.' },
    { icon: CreditCard, label: 'Zero Hassle',     desc: 'Online bills, carrying balances forward.' },
  ]

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-cream-50 dark:bg-warm-white text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 relative overflow-hidden bg-brand-primary text-white milk-drop-pattern">
        
        {/* Top bar */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce">🐄</div>
            <div className="flex flex-col">
              <span className="text-xl font-black font-display tracking-tight leading-none text-cream-50">Amruth</span>
              <span className="text-[9px] font-bold tracking-[3px] text-brand-secondary mt-0.5">DAIRY FARM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-extrabold tracking-wider uppercase text-cream-50">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-ping" />
              100% PURE • FARM FRESH
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Hero content */}
        <div className="max-w-xl my-auto z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl xl:text-5xl font-black font-display tracking-tight leading-tight mb-4">
              Start Your Morning<br />
              With Creamy <span className="text-brand-secondary">Goodness</span>
            </h1>
            <p className="text-slate-300 font-medium text-sm xl:text-base leading-relaxed mb-8">
              Manage your daily milk subscription with ease.
              Skip days, pause for vacation, order extras, and
              check your balances with a single tap.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                  <Icon size={16} className="text-brand-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-white">{label}</p>
                    <p className="text-xs text-slate-300 font-medium mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Premium glassmorphic bottle graphic */}
        <div className="absolute right-12 bottom-12 w-36 h-72 opacity-25 lg:opacity-40 hidden xl:block pointer-events-none z-0 select-none">
          <div className="w-full h-full border border-white/20 rounded-[30px] bg-white/5 backdrop-blur-md p-4 flex flex-col items-center justify-center relative shadow-2xl">
            <div className="w-12 h-8 border border-white/20 rounded-t-xl bg-white/10 absolute -top-8" />
            <div className="w-1.5 h-full bg-white/10 absolute left-1/2 -translate-x-1/2 top-0" />
            <div className="text-center flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">🐄</div>
              <div className="text-sm font-black tracking-widest text-white">AMRUTH</div>
              <div className="text-[7px] font-bold text-slate-400 tracking-wider">PURE A2 MILK</div>
              <div className="w-10 h-0.5 bg-brand-secondary my-2" />
              <div className="text-[6px] text-slate-300 font-medium">100% Pure & Natural<br />Farm Fresh</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-400 font-medium z-10">
          © {new Date().getFullYear()} Amruth Dairy Farm. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────── */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden bg-cream-50 dark:bg-warm-white transition-colors duration-300 min-h-screen">
        
        {/* Milk splash background on right */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] opacity-30 dark:opacity-[0.03] pointer-events-none z-0" aria-hidden>
          <div className="absolute top-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full bg-brand-secondary/30 blur-[80px]" />
          <div className="absolute top-[20%] right-[-20%] w-[200px] h-[200px] rounded-full bg-amber-500/20 blur-[60px]" />
        </div>

        {/* Mobile top bar */}
        <div className="flex items-center justify-between z-10 lg:hidden w-full mb-6">
          <Link href="/" className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900">
            <ArrowLeft size={14} /> Back
          </Link>
          <ThemeToggle />
        </div>

        {/* Dev banner */}
        {isDev && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/45 bg-amber-50 dark:bg-amber-950/20 flex gap-3 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-sm z-10"
          >
            <span className="text-lg">🛠️</span>
            <div>
              <p className="font-extrabold text-amber-900 dark:text-amber-300">Dev Mode Active</p>
              <p className="font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                Use OTP <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-[11px] font-mono border border-amber-200/30">123456</code> to login instantly
              </p>
            </div>
          </motion.div>
        )}

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-brand-2xl border border-border/40 dark:border-slate-800/80 bg-white dark:bg-cream-100 shadow-[0_4px_24px_var(--shadow)] z-10 flex flex-col gap-6"
        >
          <AnimatePresence mode="wait">

            {/* ═══ LOGIN STEP ════════════════════════════════════════════════ */}
            {step === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col gap-6"
              >
                {/* Tab Switcher */}
                <div className="flex border-b border-slate-100 dark:border-slate-800/60 pb-3 gap-6">
                  <button
                    type="button"
                    className="auth-tab auth-tab-active"
                    aria-current="page"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('register'); setError('') }}
                    className="auth-tab"
                  >
                    Create Account
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                    {authMode === 'login' ? greeting : 'Join Amruth Milk! 🥛'}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {authMode === 'login'
                      ? 'Login to continue your healthy journey with us.'
                      : 'Create an account to start your fresh milk subscription.'}
                  </p>
                </div>

                <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      {authMode === 'login' ? 'REGISTERED MOBILE NUMBER' : 'MOBILE NUMBER'}
                    </label>
                    <div className={cn(
                      'flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/10 transition-all overflow-hidden h-12',
                      error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
                    )}>
                      <span className="flex items-center gap-1 px-4 h-full border-r border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900 select-none">
                        <Phone size={13} />
                        +91
                      </span>
                      <input
                        id={`${formId}-identifier`}
                        type="text"
                        autoComplete="username"
                        placeholder="username or email@example.com"
                        value={identifier}
                        onChange={e => { setIdentifier(e.target.value); clearError() }}
                        className="text-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="field-group">
                    <label htmlFor={`${formId}-password`} className="field-label">
                      PASSWORD
                    </label>
                    <div className={cn('input-wrap', error && 'input-error')}>
                      <span className="input-icon-left">
                        <Lock size={15} />
                      </span>
                      <input
                        id={`${formId}-password`}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); clearError() }}
                        className="text-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="input-icon-right"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {error && <p className="field-error">⚠️ {error}</p>}
                    {error && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">⚠️ {error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:translate-y-0"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Sending OTP...</>
                    ) : (
                      <>Sign In <ChevronRight size={16} /></>
                    )}
                  </button>
                </form>

                <p className="form-footer-text">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(''); setForgotOtp(['','','','','','']); setNewPassword(''); setError(''); setStep('forgot') }}
                    className="form-link"
                  >
                    Forgot Password?
                  </button>
                </p>
              </motion.div>
            )}

            {/* ═══ REGISTER STEP ═════════════════════════════════════════════ */}
            {step === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                {/* Tab switcher */}
                <div className="auth-tabs">
                  <button
                    type="button"
                    onClick={() => { setStep('login'); setError('') }}
                    className="auth-tab"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="auth-tab auth-tab-active"
                    aria-current="page"
                  >
                    Create Account
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Google', icon: '𝐆' },
                    { label: 'Apple', icon: '🍎' },
                    { label: 'SMS', icon: '💬' },
                  ].map(s => (
                    <button key={s.label} className="flex items-center justify-center gap-1.5 px-2 h-10 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                      <span className="text-xs">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleRegisterSubmit} className="form-body">

                  {/* Username */}
                  <div className="field-group">
                    <label htmlFor={`${formId}-username`} className="field-label">
                      USERNAME
                    </label>
                    <div className={cn('input-wrap')}>
                      <span className="input-icon-left">
                        <User size={15} />
                      </span>
                      <input
                        id={`${formId}-username`}
                        type="text"
                        autoComplete="username"
                        placeholder="e.g. amruth_raj"
                        maxLength={20}
                        value={regUsername}
                        onChange={e => { setRegUsername(e.target.value); clearError() }}
                        className="text-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="field-group">
                    <label htmlFor={`${formId}-email`} className="field-label">
                      EMAIL ADDRESS
                    </label>
                    <div className={cn('input-wrap')}>
                      <span className="input-icon-left">
                        <Mail size={15} />
                      </span>
                      <input
                        id={`${formId}-email`}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={e => { setRegEmail(e.target.value); clearError() }}
                        className="text-input"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="field-group">
                    <label htmlFor={`${formId}-reg-password`} className="field-label">
                      PASSWORD
                    </label>
                    <div className={cn('input-wrap')}>
                      <span className="input-icon-left">
                        <Lock size={15} />
                      </span>
                      <input
                        id={`${formId}-reg-password`}
                        type={showRegPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        value={regPassword}
                        onChange={e => { setRegPassword(e.target.value); clearError() }}
                        className="text-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(v => !v)}
                        className="input-icon-right"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !regUsername || !regEmail || !regPassword}
                    className="btn-primary"
                  >
                    {loading ? (
                      <><span className="spinner" /> Sending OTP...</>
                    ) : (
                      <>Send Verification Code <ChevronRight size={16} /></>
                    )}
                  </button>
                </form>

                <p className="form-footer-text">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setStep('login'); setError('') }}
                    className="form-link"
                  >
                    Sign In Here
                  </button>
                </p>
              </motion.div>
            )}

            {/* ═══ VERIFY OTP STEP ═══════════════════════════════════════════ */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mx-auto mb-4">
                    <Mail size={22} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">Check Your Email</h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    We sent a 6-digit code to<br />
                    <strong className="text-slate-800 dark:text-slate-200">{regEmail}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-6 gap-2 sm:gap-3 py-1">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`${formId}-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKeyDown(e, i)}
                      className={cn(
                        'w-full aspect-square text-center text-lg font-bold text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all',
                        error ? 'border-red-500 ring-2 ring-red-500/10' : digit ? 'border-brand-secondary ring-2 ring-brand-secondary/10 bg-white dark:bg-slate-900' : ''
                      )}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-500 flex items-center justify-center gap-1">
                    ⚠️ {error}
                  </p>
                )}

                <div className="text-center text-xs py-1">
                  {countdown > 0 ? (
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">
                      Resend in <strong className="text-slate-700 dark:text-slate-300">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="font-bold text-brand-secondary hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOtpVerify(otp.join(''))}
                  disabled={loading || otp.some(d => d === '')}
                  className="w-full h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:translate-y-0"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Verifying...</>
                  ) : 'Verify & Activate Account'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('register'); setOtp(['','','','','','']); setError('') }}
                  className="back-phone-btn"
                >
                  ← Edit Email Address
                </button>
              </motion.div>
            )}

            {/* ═══ SUCCESS STEP ══════════════════════════════════════════════ */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 dark:text-green-400 flex items-center justify-center"
                >
                  <CheckCircle size={32} />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white mt-6">Login Verified!</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">Preparing your subscription desk...</p>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-6">
                  <motion.div
                    className="h-full bg-green-500 dark:bg-green-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}

            {/* ═══ FORGOT PASSWORD — ENTER EMAIL ══════════════════════════════ */}
            {step === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="form-header">
                  <h2 className="form-title">Forgot Password? 🔐</h2>
                  <p className="form-subtitle">
                    Enter the email address you registered with. We will send a reset code.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="form-body">
                  <div className="field-group">
                    <label htmlFor={`${formId}-forgot-email`} className="field-label">
                      EMAIL ADDRESS
                    </label>
                    <div className={cn('input-wrap', error && 'input-error')}>
                      <span className="input-icon-left">
                        <Mail size={15} />
                      </span>
                      <input
                        id={`${formId}-forgot-email`}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={e => { setForgotEmail(e.target.value); clearError() }}
                        className="text-input"
                        autoFocus
                      />
                    </div>
                    {error && <p className="field-error">⚠️ {error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !forgotEmail.trim()}
                    className="btn-primary"
                  >
                    {loading ? (
                      <><span className="spinner" /> Sending Code...</>
                    ) : (
                      <>Send Reset Code <ChevronRight size={16} /></>
                    )}
                  </button>
                </form>

                <p className="form-footer-text">
                  Remembered it?{' '}
                  <button
                    type="button"
                    onClick={() => { setStep('login'); setError('') }}
                    className="form-link"
                  >
                    Back to Sign In
                  </button>
                </p>
              </motion.div>
            )}

            {/* ═══ FORGOT PASSWORD — VERIFY OTP ═══════════════════════════════ */}
            {step === 'forgot-verify' && (
              <motion.div
                key="forgot-verify"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="form-header" style={{ textAlign: 'center' }}>
                  <div className="otp-phone-icon">
                    <Mail size={22} />
                  </div>
                  <h2 className="form-title">Check Your Email</h2>
                  <p className="form-subtitle">
                    We sent a 6-digit reset code to<br />
                    <strong style={{ color: '#1a1a2e' }}>{forgotEmail}</strong>
                  </p>
                </div>

                <div className="otp-boxes">
                  {forgotOtp.map((digit, i) => (
                    <input
                      key={i}
                      id={`${formId}-fotp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleForgotOtpChange(e.target.value, i)}
                      onKeyDown={e => handleForgotOtpKeyDown(e, i)}
                      className={cn(
                        'otp-box',
                        error ? 'otp-box-error' : digit ? 'otp-box-filled' : ''
                      )}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="field-error" style={{ textAlign: 'center', marginBottom: 12 }}>
                    ⚠️ {error}
                  </p>
                )}

                <div className="resend-row">
                  {forgotCountdown > 0 ? (
                    <span className="resend-timer">
                      Resend in <strong>{forgotCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleForgotResend}
                      disabled={loading}
                      className="resend-btn"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setStep('forgot'); setForgotOtp(['','','','','','']); setError('') }}
                  className="back-phone-btn"
                >
                  ← Change Email
                </button>
              </motion.div>
            )}

            {/* ═══ RESET PASSWORD — NEW PASSWORD FORM ═════════════════════════ */}
            {step === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="form-header">
                  <h2 className="form-title">Set New Password 🔑</h2>
                  <p className="form-subtitle">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetSubmit} className="form-body">
                  <div className="field-group">
                    <label htmlFor={`${formId}-new-password`} className="field-label">
                      NEW PASSWORD
                    </label>
                    <div className={cn('input-wrap', error && 'input-error')}>
                      <span className="input-icon-left">
                        <Lock size={15} />
                      </span>
                      <input
                        id={`${formId}-new-password`}
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); clearError() }}
                        className="text-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(v => !v)}
                        className="input-icon-right"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {error && <p className="field-error">⚠️ {error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newPassword || newPassword.length < 8}
                    className="btn-primary"
                  >
                    {loading ? (
                      <><span className="spinner" /> Resetting...</>
                    ) : (
                      <>Reset Password <ChevronRight size={16} /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ═══ RESET SUCCESS ═══════════════════════════════════════════════ */}
            {step === 'reset-success' && (
              <motion.div
                key="reset-success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="success-view"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="success-icon"
                >
                  <CheckCircle size={32} />
                </motion.div>
                <h2 className="form-title" style={{ marginTop: 16 }}>
                  Password Reset! 🎉
                </h2>
                <p className="form-subtitle">Your password has been updated successfully.</p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: 20 }}
                  onClick={() => { setStep('login'); setNewPassword(''); setForgotEmail(''); setForgotToken(''); setError('') }}
                >
                  Sign In Now <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Secure badge */}
        <div className="flex items-center justify-center gap-2.5 text-slate-400 dark:text-slate-500 text-xs font-bold mt-6 select-none">
          <ShieldCheck size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <div className="text-left">
            <p className="font-extrabold text-slate-500 dark:text-slate-400 leading-none">Secure Login</p>
            <p className="font-medium text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Your data is safe with us</p>
          </div>
        </div>

      </div>
    </div>
  )
}
