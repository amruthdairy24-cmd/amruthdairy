// app/(auth)/login/page.tsx
'use client'

import { useState, useEffect, useRef, useId } from 'react'
import {
  ChevronRight, Mail, Lock, User, CheckCircle,
  Eye, EyeOff, AtSign
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
// import { ThemeToggle } from '@/components/ThemeToggle'


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
  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register form
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // OTP (registration)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', ''])
  const [forgotToken, setForgotToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [forgotCountdown, setForgotCountdown] = useState(0)
  const forgotIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const formId = useId()

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'register' || params.get('mode') === 'signup') setStep('register')

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
  async function handleForgotOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return
    const next = [...forgotOtp]
    next[index] = value.slice(-1)
    setForgotOtp(next)
    if (value && index < 5) {
      const el = document.getElementById(`${formId}-fotp-${index + 1}`) as HTMLInputElement
      el?.focus()
    }
    if (next.every(d => d !== '') && value) {
      const code = next.join('')
      setForgotToken(code)
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/auth/verify-forgot-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), token: code }),
        })
        const data = await res.json()
        if (data.success) {
          setStep('reset')
        } else {
          setError(data.message || 'Invalid code. Please try again.')
          setForgotOtp(['', '', '', '', '', ''])
          setTimeout(() => {
            const el = document.getElementById(`${formId}-fotp-0`) as HTMLInputElement
            el?.focus()
          }, 50)
        }
      } catch {
        setError('Network error. Please check your connection.')
      } finally {
        setLoading(false)
      }
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

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen  "
        style={{
          backgroundImage: "url('/images/bg/login-bg-image.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 text-slate-800 transition-colors duration-300 pt-[50px]'>
          {/* ── LEFT PANEL ─────────────────────────────────── */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 relative overflow-hidden text-white bg-cover bg-center bg-no-repeat">

            {/* Hero content */}
            <div className="max-w-xl my-auto z-10 relative">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-4xl xl:text-5xl font-black font-display tracking-tight leading-tight mb-4">
                  Start Your Morning<br />
                  With <span className="text-yellow-400">Creamy Goodness</span>
                </h1>
                <p className="text-white font-medium text-sm mb-8">
                  Manage your daily milk subscription with ease.
                  Skip days, pause for vacation, order extras, and
                  check your balances with a single tap.
                </p>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="text-xs text-black font-medium z-10 mt-5">
              © {new Date().getFullYear()} Amruth Dairy Farm. All rights reserved.
            </div>
          </div>

          {/* ── RIGHT PANEL ────────────────────────────────── */}
          <div className="col-span-1 lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden transition-colors duration-300 min-h-screen">

            {/* Mobile top bar */}

            {/* Form card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md mx-auto my-auto p-8 sm:p-5 rounded-[10px] z-10 bg-white flex flex-col gap-8"
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
                    className="flex flex-col gap-7"
                  >
                    {/* Tab Switcher */}
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl backdrop-blur-sm">
                      <button
                        type="button"
                        className="flex-1 h-11 cursor-pointer  rounded-xl bg-[#02429C] text-white font-bold text-sm shadow-lg shadow-slate-900/5 transition-all"
                        aria-current="page"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStep('register'); setError('') }}
                        className="flex-1 h-11 cursor-pointer  rounded-xl text-slate-600 font-bold text-sm hover:text-slate-900 transition-all"
                      >
                        Create Account
                      </button>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2.5">
                        <div className={cn(
                          'group flex items-center rounded-2xl border-2 bg-white transition-all overflow-hidden h-14',
                          error && !password
                            ? 'border-red-400'
                            : 'border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20'
                        )}>
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <AtSign size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-identifier`}
                            type="text"
                            autoComplete="username"
                            placeholder="username or email@example.com"
                            value={identifier}
                            onChange={e => { setIdentifier(e.target.value); clearError() }}
                            className="flex-1 h-full pr-5 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col gap-2.5">
                        <div className={cn(
                          'group flex items-center rounded-2xl border-2 bg-white transition-all overflow-hidden h-14',
                          error
                            ? 'border-red-400'
                            : 'border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20'
                        )}>
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <Lock size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-password`}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); clearError() }}
                            className="flex-1 h-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="flex items-center cursor-pointer  px-5 h-full text-slate-400 hover:text-brand-secondary transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                          </button>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs font-bold text-red-500 flex items-center gap-1.5 pl-1"
                          >
                            <span className="text-base">⚠️</span> {error}
                          </motion.p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="group relative cursor-pointer  w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold text-white transition-all overflow-hidden  disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2.5">
                          {loading ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Login...
                            </>
                          ) : (
                            <>
                              Sign In
                              <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </button>
                    </form>

                    <p className="text-center text-sm font-semibold text-slate-500">
                      <button
                        type="button"
                        onClick={() => { setForgotEmail(''); setForgotOtp(['', '', '', '', '', '']); setNewPassword(''); setError(''); setStep('forgot') }}
                        className="text-brand-secondary cursor-pointer hover:text-brand-primary underline underline-offset-2 transition-colors"
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
                    className="flex flex-col gap-7"
                  >
                    {/* Tab switcher */}
                    <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => { setStep('login'); setError('') }}
                        className="flex-1 h-11 cursor-pointer  rounded-xl text-slate-600 font-bold text-sm hover:text-slate-900 transition-all"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        className="flex-1 h-11 cursor-pointer  rounded-xl bg-[#02429C] text-white font-bold text-sm shadow-lg shadow-slate-900/5 transition-all"
                        aria-current="page"
                      >
                        Create Account
                      </button>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">

                      {/* Username */}
                      <div className="flex flex-col gap-2.5">
                        <div className="group flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20 bg-white transition-all overflow-hidden h-14">
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <User size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-username`}
                            type="text"
                            autoComplete="username"
                            placeholder="e.g. amruth_raj"
                            maxLength={20}
                            value={regUsername}
                            onChange={e => { setRegUsername(e.target.value); clearError() }}
                            className="flex-1 h-full pr-5 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-2.5">
                        <div className="group flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20 bg-white transition-all overflow-hidden h-14">
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <Mail size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-email`}
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={regEmail}
                            onChange={e => { setRegEmail(e.target.value); clearError() }}
                            className="flex-1 h-full pr-5 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col gap-2.5">
                        <div className="group flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20 bg-white transition-all overflow-hidden h-14">
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <Lock size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-reg-password`}
                            type={showRegPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Minimum 8 characters"
                            value={regPassword}
                            onChange={e => { setRegPassword(e.target.value); clearError() }}
                            className="flex-1 h-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(v => !v)}
                            className="flex items-center cursor-pointer  px-5 h-full text-slate-500 hover:text-brand-secondary transition-colors"
                            aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                          >
                            {showRegPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                          </button>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs font-bold text-red-500 flex items-center gap-1.5 pl-1"
                          >
                            <span className="text-base">⚠️</span> {error}
                          </motion.p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="group cursor-pointer  relative w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2.5">
                          {loading ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              Send Verification Code
                              <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </button>
                    </form>

                    <p className="text-center text-sm font-semibold text-slate-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setStep('login'); setError('') }}
                        className="text-brand-secondary cursor-pointer  hover:text-brand-primary underline underline-offset-2 transition-colors"
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
                    className="flex flex-col gap-2"
                  >
                    <div className="text-center space-y-4">
                      {/* <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 text-brand-secondary flex items-center justify-center mx-auto ring-8 ring-brand-secondary/5"
                  > */}
                      {/* <Mail size={32} strokeWidth={2.5} />
                  </motion.div> */}
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
                          Check Your Email
                        </h2>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2">
                          We sent a 6-digit code to<br />
                          <strong className="text-slate-800">{regEmail}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 py-2">
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
                            'w-full aspect-square text-center text-xl font-black text-slate-800 rounded-2xl border-2 bg-white focus:outline-none transition-all',
                            error
                              ? 'border-red-400 ring-4 ring-red-400/20'
                              : digit
                                ? 'border-brand-secondary ring-4 ring-brand-secondary/20 shadow-lg shadow-brand-secondary/10'
                                : 'border-slate-200 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20'
                          )}
                          aria-label={`Digit ${i + 1}`}
                        />
                      ))}
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-bold text-red-500 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">⚠️</span> {error}
                      </motion.p>
                    )}

                    <div className="text-center py-2">
                      {countdown > 0 ? (
                        <span className="text-sm text-slate-500 font-semibold">
                          Resend code in <strong className="text-brand-secondary font-black tabular-nums">{countdown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="text-sm cursor-pointer font-bold text-brand-secondary hover:text-brand-primary underline underline-offset-2 transition-colors"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOtpVerify(otp.join(''))}
                      className="group relative cursor-pointer  w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center gap-2.5">
                        {loading ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Activate Account'
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep('register'); setOtp(['', '', '', '', '', '']); setError('') }}
                      className="text-sm font-bold cursor-pointer text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mt-2"
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
                    className="flex flex-col items-center justify-center py-8 text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 text-green-500 flex items-center justify-center ring-8 ring-green-500/10"
                    >
                      <CheckCircle size={48} strokeWidth={2.5} />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
                        Login Verified!
                      </h2>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2">
                        Preparing your subscription desk...
                      </p>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
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
                    className="flex flex-col gap-7"
                  >
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl cursor-pointer sm:text-3xl font-black font-display text-slate-900 tracking-tight">
                        Forgot Password?
                      </h2>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        Enter the email address you registered with. We will send a reset code.
                      </p>
                    </div>

                    <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2.5">
                        <label htmlFor={`${formId}-forgot-email`} className="text-[11px] font-black tracking-wider text-slate-500 uppercase pl-1">

                        </label>
                        <div className={cn(
                          'group flex items-center rounded-2xl border-2 bg-white transition-all overflow-hidden h-14',
                          error
                            ? 'border-red-400'
                            : 'border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20'
                        )}>
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <Mail size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-forgot-email`}
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={e => { setForgotEmail(e.target.value); clearError() }}
                            className="flex-1 h-full pr-5 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                            autoFocus
                          />
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs font-bold text-red-500 flex items-center gap-1.5 pl-1"
                          >
                            <span className="text-base">⚠️</span> {error}
                          </motion.p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="group relative w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2.5">
                          {loading ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending Code...
                            </>
                          ) : (
                            <>
                              Send Reset Code
                              <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </button>
                    </form>

                    <p className="text-center text-sm font-semibold text-slate-500">
                      Remembered it?{' '}
                      <button
                        type="button"
                        onClick={() => { setStep('login'); setError('') }}
                        className="text-brand-secondary cursor-pointer hover:text-brand-primary underline underline-offset-2 transition-colors"
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
                    className="flex flex-col gap-2"
                  >
                    <div className="text-center space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 text-brand-secondary flex items-center justify-center mx-auto ring-8 ring-brand-secondary/5"
                      >
                        <Mail size={32} strokeWidth={2.5} />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
                          Check Your Email
                        </h2>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2">
                          We sent a 6-digit reset code to<br />
                          <strong className="text-slate-800">{forgotEmail}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3 py-2">
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
                            'w-full aspect-square text-center text-xl font-black text-slate-800 rounded-2xl border-2 bg-white focus:outline-none transition-all',
                            error
                              ? 'border-red-400 ring-4 ring-red-400/20'
                              : digit
                                ? 'border-brand-secondary ring-4 ring-brand-secondary/20 shadow-lg shadow-brand-secondary/10'
                                : 'border-slate-200 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20'
                          )}
                          aria-label={`Digit ${i + 1}`}
                        />
                      ))}
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-bold text-red-500 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">⚠️</span> {error}
                      </motion.p>
                    )}

                    <div className="text-center py-2">
                      {forgotCountdown > 0 ? (
                        <span className="text-sm text-slate-500 font-semibold">
                          Resend code in <strong className="text-brand-secondary font-black tabular-nums">{forgotCountdown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleForgotResend}
                          disabled={loading}
                          className="text-sm font-bold text-brand-secondary hover:text-brand-primary underline underline-offset-2 transition-colors"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => { setStep('forgot'); setForgotOtp(['', '', '', '', '', '']); setError('') }}
                      className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
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
                    className="flex flex-col gap-7"
                  >
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
                        Set New Password 🔑
                      </h2>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        Choose a strong password for your account.
                      </p>
                    </div>

                    <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2.5">
                        <label htmlFor={`${formId}-new-password`} className="text-[11px] font-black tracking-wider text-slate-500 uppercase pl-1">
                          NEW PASSWORD
                        </label>
                        <div className={cn(
                          'group flex items-center rounded-2xl border-2 bg-white transition-all overflow-hidden h-14',
                          error
                            ? 'border-red-400'
                            : 'border-slate-200 focus-within:border-brand-secondary focus-within:shadow-lg focus-within:shadow-brand-secondary/20'
                        )}>
                          <span className="flex items-center px-5 h-full text-slate-400 group-focus-within:text-brand-secondary transition-colors">
                            <Lock size={18} strokeWidth={2.5} />
                          </span>
                          <input
                            id={`${formId}-new-password`}
                            type={showNewPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Minimum 8 characters"
                            value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); clearError() }}
                            className="flex-1 h-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(v => !v)}
                            className="flex items-center px-5 h-full text-slate-400 hover:text-brand-secondary transition-colors"
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                          </button>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs font-bold text-red-500 flex items-center gap-1.5 pl-1"
                          >
                            <span className="text-base">⚠️</span> {error}
                          </motion.p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !newPassword || newPassword.length < 8}
                        className="group relative w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold text-white transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2.5">
                          {loading ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>
                              Reset Password
                              <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
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
                    className="flex flex-col items-center justify-center py-8 text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 text-green-500 flex items-center justify-center ring-8 ring-green-500/10"
                    >
                      <CheckCircle size={48} strokeWidth={2.5} />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
                        Password Reset! 🎉
                      </h2>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed mt-2">
                        Your password has been updated successfully.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="group relative w-full h-14 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold text-white transition-all overflow-hidden"
                      onClick={() => { setStep('login'); setNewPassword(''); setForgotEmail(''); setForgotToken(''); setError('') }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center gap-2.5 cursor-pointer">
                        Sign In Now
                        <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}