// app/(auth)/login/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  ChevronRight, Phone, Smartphone, CheckCircle, 
  Clock, Plane, Package, CreditCard, ShieldCheck,
  ArrowLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp' | 'success'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [greeting, setGreeting] = useState('Welcome Back! 👋')
  const [isDev, setIsDev] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') setIsDev(true)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning! 🌅')
    else if (hour < 17) setGreeting('Good Afternoon! ☀️')
    else setGreeting('Good Evening! 🌙')

    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') {
      setAuthMode('signup')
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  function startCountdown() {
    setCountdown(30)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phone.length !== 10) { setError('Please enter a valid 10-digit mobile number'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (data.success) { setStep('otp'); startCountdown() }
      else setError(data.message || 'Failed to send OTP')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
      next?.focus()
    }
    if (newOtp.every(d => d !== '') && value) handleOtpSubmit(newOtp.join(''))
  }

  function handleOtpKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement
      prev?.focus()
    }
  }

  async function handleOtpSubmit(code: string) {
    if (code.length !== 6) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: code }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('success');

        // ── Decide where to redirect ─────────────────────
        // Read ONLY from verify-otp response
        // NO extra API calls — session may not be propagated yet
        
        const destination = getRedirectDestination(data);

        // Wait for success animation, then redirect
        setTimeout(() => {
          window.location.href = destination;
        }, 1400);

      } else {
        // OTP wrong or expired
        setError(data.message || 'Wrong OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        
        // Focus first OTP box
        setTimeout(() => {
          const firstBox = document.getElementById('otp-0') as HTMLInputElement;
          firstBox?.focus();
        }, 50);
      }

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('[login] OTP submit error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────
  // PURE FUNCTION: Decide redirect from API response
  // No API calls — just logic on the data we already have
  // ─────────────────────────────────────────────────────
  function getRedirectDestination(data: {
    role: string;
    is_new_user: boolean;
    has_active_subscription: boolean;
  }): string {
    
    // Admin always goes to admin panel
    if (data.role === 'admin') {
      return '/admin';
    }

    // New user — never logged in before
    // Must complete onboarding (name, address, choose plan)
    if (data.is_new_user) {
      return '/onboarding';
    }

    // Existing user with active/paused/pending subscription
    if (data.has_active_subscription) {
      return '/dashboard';
    }

    // Existing user but no subscription
    // (cancelled before, or never completed onboarding)
    return '/onboarding';
  }

  const features = [
    { icon: Clock, label: 'Early Delivery', desc: 'At your doorstep before 7:00 AM daily.' },
    { icon: Plane, label: 'Vacation Pause', desc: 'Pause delivery dynamically with full refunds.' },
    { icon: Package, label: 'Premium Milk', desc: 'Rich, creamy, farm-sourced fresh milk.' },
    { icon: CreditCard, label: 'Zero Hassle', desc: 'Online bills, carrying balances forward.' },
  ]

  return (
    <div className="login-root">
      
      {/* ── LEFT PANEL ─────────────────────────────────── */}
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
          {/* Milk splash circles (CSS art) */}
          <div className="splash-base" />
          <div className="splash-left" />
          <div className="splash-right" />
          <div className="splash-drop-1" />
          <div className="splash-drop-2" />
          <div className="splash-drop-3" />
          {/* Bottle */}
          <div className="bottle-wrap">
            <div className="bottle">
              <div className="bottle-cap" />
              <div className="bottle-neck" />
              <div className="bottle-body">
                <div className="bottle-label">
                  <div className="bottle-label-cow">🐄</div>
                  <div className="bottle-label-name">Amruth<br />Dairy</div>
                  <div className="bottle-label-type">A2 COW MILK</div>
                  <div className="bottle-label-pure">100% Pure & Natural<br />Farm Fresh</div>
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

      {/* ── RIGHT PANEL ────────────────────────────────── */}
      <div className="login-right">
        
        {/* Milk splash background on right */}
        <div className="right-splash-bg" aria-hidden>
          <div className="right-splash-circle-1" />
          <div className="right-splash-circle-2" />
          <div className="right-splash-circle-3" />
        </div>

        {/* Mobile back */}
        <div className="mobile-back">
          <Link href="/" className="mobile-back-link">
            <ArrowLeft size={14} /> Back
          </Link>
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
                Use OTP <code className="dev-code">123456</code> to login instantly
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

            {/* PHONE STEP */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
              >
                {/* Tab Switcher */}
                <div className="auth-tabs">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(''); }}
                    className={cn('auth-tab', authMode === 'login' && 'auth-tab-active')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setError(''); }}
                    className={cn('auth-tab', authMode === 'signup' && 'auth-tab-active')}
                  >
                    Create Account
                  </button>
                </div>

                <div className="form-header">
                  <h2 className="form-title">
                    {authMode === 'login' ? greeting : 'Join Amruth Milk! 🥛'}
                  </h2>
                  <p className="form-subtitle">
                    {authMode === 'login'
                      ? 'Login to continue your healthy journey with us.'
                      : 'Create an account to start your fresh milk subscription.'}
                  </p>
                </div>

                <form onSubmit={handlePhoneSubmit} className="form-body">
                  <div className="field-group">
                    <label className="field-label">
                      {authMode === 'login' ? 'REGISTERED MOBILE NUMBER' : 'MOBILE NUMBER'}
                    </label>
                    <div className={cn('phone-input-wrap', error && 'phone-input-error')}>
                      <span className="phone-prefix">
                        <Phone size={13} />
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          if (error) setError('')
                        }}
                        className="phone-input"
                        autoFocus
                      />
                    </div>
                    {error && <p className="field-error">⚠️ {error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="btn-primary"
                  >
                    {loading ? (
                      <><span className="spinner" /> Sending OTP...</>
                    ) : (
                      <>Send OTP <ChevronRight size={16} /></>
                    )}
                  </button>
                </form>

                <div className="divider">
                  <span className="divider-line" />
                  <span className="divider-text">or continue with</span>
                  <span className="divider-line" />
                </div>

                <div className="social-row">
                  {[
                    { label: 'Google', icon: '𝐆' },
                    { label: 'Apple', icon: '🍎' },
                    { label: 'Facebook', icon: 'f' },
                  ].map(s => (
                    <button key={s.label} className="social-btn">
                      <span className="social-icon">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>

                <p className="form-footer-text">
                  {authMode === 'login' ? (
                    <>
                      New to Amruth Milk?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className="form-link bg-transparent border-none p-0 cursor-pointer font-bold text-blue-600 hover:underline"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                      >
                        Create an Account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="form-link bg-transparent border-none p-0 cursor-pointer font-bold text-blue-600 hover:underline"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                      >
                        Sign In Here
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            )}

            {/* OTP STEP */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="form-header" style={{ textAlign: 'center' }}>
                  <div className="otp-phone-icon">
                    <Smartphone size={22} />
                  </div>
                  <h2 className="form-title">Verify OTP</h2>
                  <p className="form-subtitle">
                    Enter the 6-digit code sent to<br />
                    <strong style={{ color: '#1a1a2e' }}>+91 {phone}</strong>
                  </p>
                </div>

                <div className="otp-boxes">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
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
                    />
                  ))}
                </div>

                {error && (
                  <p className="field-error" style={{ textAlign: 'center', marginBottom: 12 }}>
                    ⚠️ {error}
                  </p>
                )}

                <div className="resend-row">
                  {countdown > 0 ? (
                    <span className="resend-timer">
                      Resend in <strong>{countdown}s</strong>
                    </span>
                  ) : (
                    <button onClick={startCountdown} className="resend-btn">
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleOtpSubmit(otp.join(''))}
                  disabled={loading || otp.some(d => d === '')}
                  className="btn-primary"
                  style={{ marginBottom: 12 }}
                >
                  {loading ? (
                    <><span className="spinner" /> Verifying...</>
                  ) : 'Verify & Login'}
                </button>

                <button onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError('') }} className="back-phone-btn">
                  ← Edit Phone Number
                </button>
              </motion.div>
            )}

            {/* SUCCESS STEP */}
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
                <h2 className="form-title" style={{ marginTop: 16 }}>Login Verified!</h2>
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