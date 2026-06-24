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
import { ThemeToggle } from '@/components/ThemeToggle'

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
        
        const destination = getRedirectDestination(data);

        // Wait for success animation, then redirect
        setTimeout(() => {
          window.location.href = destination;
        }, 1400);

      } else {
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

  function getRedirectDestination(data: {
    role: string;
    is_new_user: boolean;
    has_active_subscription: boolean;
  }): string {
    if (data.role === 'admin') {
      return '/admin';
    }
    if (data.is_new_user) {
      return '/onboarding';
    }
    if (data.has_active_subscription) {
      return '/dashboard';
    }
    return '/onboarding';
  }

  const features = [
    { icon: Clock, label: 'Early Delivery', desc: 'At your doorstep before 7:00 AM daily.' },
    { icon: Plane, label: 'Vacation Pause', desc: 'Pause delivery dynamically with full refunds.' },
    { icon: Package, label: 'Premium Milk', desc: 'Rich, creamy, farm-sourced fresh milk.' },
    { icon: CreditCard, label: 'Zero Hassle', desc: 'Online bills, carrying balances forward.' },
  ]

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

            {/* PHONE STEP */}
            {step === 'phone' && (
              <motion.div
                key="phone"
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
                    onClick={() => { setAuthMode('login'); setError(''); }}
                    className={cn(
                      'text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 pb-2 border-b-2 border-transparent transition-all cursor-pointer',
                      authMode === 'login' && 'text-brand-primary dark:text-white border-brand-secondary font-extrabold'
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setError(''); }}
                    className={cn(
                      'text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 pb-2 border-b-2 border-transparent transition-all cursor-pointer',
                      authMode === 'signup' && 'text-brand-primary dark:text-white border-brand-secondary font-extrabold'
                    )}
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
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          if (error) setError('')
                        }}
                        className="w-full px-4 h-full text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
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
                      <>Send OTP <ChevronRight size={16} /></>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-1">
                  <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800/80" />
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">or continue with</span>
                  <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800/80" />
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

                <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-semibold mt-2">
                  {authMode === 'login' ? (
                    <>
                      New to Amruth Milk?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className="font-bold text-brand-secondary hover:underline cursor-pointer bg-transparent border-none p-0"
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
                        className="font-bold text-brand-secondary hover:underline cursor-pointer bg-transparent border-none p-0"
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
                className="flex flex-col gap-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={22} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">Verify OTP</h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Enter the 6-digit code sent to<br />
                    <strong className="text-slate-800 dark:text-slate-200">+91 {phone}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-6 gap-2 sm:gap-3 py-1">
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
                        'w-full aspect-square text-center text-lg font-bold text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all',
                        error ? 'border-red-500 ring-2 ring-red-500/10' : digit ? 'border-brand-secondary ring-2 ring-brand-secondary/10 bg-white dark:bg-slate-900' : ''
                      )}
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
                    <button onClick={startCountdown} className="font-bold text-brand-secondary hover:underline cursor-pointer bg-transparent border-none">
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleOtpSubmit(otp.join(''))}
                  disabled={loading || otp.some(d => d === '')}
                  className="w-full h-12 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_4px_16px_rgba(2,132,199,0.3)] active:translate-y-0 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:translate-y-0"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Verifying...</>
                  ) : 'Verify & Login'}
                </button>

                <button 
                  onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError('') }} 
                  className="w-full text-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer bg-transparent border-none"
                >
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