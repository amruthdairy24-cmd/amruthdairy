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
    <div className="login-root">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className="login-left">

        {/* Top bar */}
        <div className="login-left-header">
          <div className="brand-logo">
            <div className="brand-cow-icon">🐄</div>
            <div className="brand-text">
              <span className="brand-name">Amruth</span>
              <span className="brand-sub">DAIRY FARM</span>
            </div>
          </div>
          <div className="purity-badge">
            <span className="purity-dot" />
            100% PURE • FARM FRESH
          </div>
        </div>

        {/* Hero content */}
        <div className="login-left-hero">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="hero-title">
              Start Your Morning<br />
              With Creamy <span className="hero-title-blue">Goodness</span>
            </h1>
            <p className="hero-desc">
              Manage your daily milk subscription with ease.
              Skip days, pause for vacation, order extras, and
              check your balances with a single tap.
            </p>

            {/* Features */}
            <div className="features-grid">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="feature-item">
                  <Icon size={16} className="feature-icon" />
                  <div>
                    <p className="feature-label">{label}</p>
                    <p className="feature-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Milk bottle visual */}
        <div className="milk-visual-area">
          <div className="splash-base" />
          <div className="splash-left" />
          <div className="splash-right" />
          <div className="splash-drop-1" />
          <div className="splash-drop-2" />
          <div className="splash-drop-3" />
          <div className="bottle-wrap">
            <div className="bottle">
              <div className="bottle-cap" />
              <div className="bottle-neck" />
              <div className="bottle-body">
                <div className="bottle-label">
                  <div className="bottle-label-cow">🐄</div>
                  <div className="bottle-label-name">Amruth<br />Dairy</div>
                  <div className="bottle-label-type">A2 COW MILK</div>
                  <div className="bottle-label-pure">100% Pure &amp; Natural<br />Farm Fresh</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-left-footer">
          © {new Date().getFullYear()} Amruth Dairy Farm. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="login-right">

        {/* Background circles */}
        <div className="right-splash-bg" aria-hidden>
          <div className="right-splash-circle-1" />
          <div className="right-splash-circle-2" />
          <div className="right-splash-circle-3" />
        </div>

        {/* Mobile back */}
        <div className="mobile-back">
          <a href="/" className="mobile-back-link">
            <ArrowLeft size={14} /> Back
          </a>
        </div>

        {/* Dev banner */}
        {isDev && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="dev-banner"
          >
            <span className="dev-banner-icon">🛠️</span>
            <div>
              <p className="dev-banner-title">Dev Mode Active</p>
              <p className="dev-banner-desc">
                Register with any email → OTP <code className="dev-code">123456</code>
                {' '}· Or login with existing credentials
              </p>
            </div>
          </motion.div>
        )}

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="form-card"
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
              >
                {/* Tab switcher */}
                <div className="auth-tabs">
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

                <div className="form-header">
                  <h2 className="form-title">{greeting}</h2>
                  <p className="form-subtitle">
                    Sign in with your username or email address.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="form-body">

                  {/* Identifier */}
                  <div className="field-group">
                    <label htmlFor={`${formId}-identifier`} className="field-label">
                      USERNAME OR EMAIL
                    </label>
                    <div className={cn('input-wrap', error && !password && 'input-error')}>
                      <span className="input-icon-left">
                        <AtSign size={15} />
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
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !identifier.trim() || !password}
                    className="btn-primary"
                  >
                    {loading ? (
                      <><span className="spinner" /> Signing in...</>
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

                <div className="form-header">
                  <h2 className="form-title">Join Amruth Milk! 🥛</h2>
                  <p className="form-subtitle">
                    Create your account to start your fresh milk subscription.
                  </p>
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
              >
                <div className="form-header" style={{ textAlign: 'center' }}>
                  <div className="otp-phone-icon">
                    <Mail size={22} />
                  </div>
                  <h2 className="form-title">Check Your Email</h2>
                  <p className="form-subtitle">
                    We sent a 6-digit code to<br />
                    <strong style={{ color: '#1a1a2e' }}>{regEmail}</strong>
                  </p>
                </div>

                {/* OTP boxes */}
                <div className="otp-boxes">
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

                {/* Resend */}
                <div className="resend-row">
                  {countdown > 0 ? (
                    <span className="resend-timer">
                      Resend in <strong>{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="resend-btn"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOtpVerify(otp.join(''))}
                  disabled={loading || otp.some(d => d === '')}
                  className="btn-primary"
                  style={{ marginBottom: 12 }}
                >
                  {loading ? (
                    <><span className="spinner" /> Verifying...</>
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
                  You&apos;re In! 🎉
                </h2>
                <p className="form-subtitle">Preparing your subscription desk...</p>
                <div className="success-loader">
                  <motion.div
                    className="success-loader-bar"
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
        <div className="secure-badge">
          <ShieldCheck size={16} className="secure-icon" />
          <div>
            <p className="secure-title">Secure Login</p>
            <p className="secure-desc">Your data is safe with us</p>
          </div>
        </div>

      </div>
    </div>
  )
}