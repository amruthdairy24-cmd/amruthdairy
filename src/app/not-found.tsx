import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden transition-colors duration-300">
      
      {/* Background Blurs */}
      <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-[#E2E8F0]/20 dark:bg-slate-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cow/Milk Icon Container */}
      <div className="w-20 h-20 bg-[#F0F9FF] dark:bg-slate-900 border border-[#BAE6FD] dark:border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#0284C7] dark:text-sky-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <path d="M5 10c0-2 2-3 4-3h6c2 0 4 1 4 3" />
          <path d="M5 10v6c0 2 2 3 4 3h6c2 0 4-1 4-3v-6" />
          <circle cx="9" cy="13" r="1" fill="currentColor" />
          <circle cx="15" cy="13" r="1" fill="currentColor" />
          <path d="M10 16c1 0.7 3 0.7 4 0" />
        </svg>
      </div>

      <p className="text-xs uppercase tracking-widest text-[#0284C7] dark:text-sky-400 font-black mb-3">Error 404</p>
      <h1 className="text-4xl font-black text-[#0F172A] dark:text-white mb-4 font-playfair tracking-tight">
        This page spilled!
      </h1>
      <p className="text-sm text-slate-505 dark:text-slate-400 max-w-xs leading-relaxed mb-8 font-medium">
        The page you&apos;re looking for doesn&apos;t exist. Maybe it was skipped — just like a delivery.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 relative z-10">
        {/* Go Home button */}
        <Link
          href="/"
          className="inline-flex items-center justify-center h-[46px] px-8 rounded-xl bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 hover:scale-105 active:scale-98 text-white font-bold text-[0.95rem] no-underline shadow-sm border border-sky-700/15 transition-all duration-200"
        >
          Go Home
        </Link>
        
        {/* My Account button */}
        <Link
          href="/dashboard/account"
          className="inline-flex items-center justify-center h-[46px] px-8 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 border-1.5 border-slate-900/15 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-[0.95rem] no-underline hover:scale-105 active:scale-98 transition-all duration-200"
        >
          My Account
        </Link>
      </div>
    </div>
  )
}
