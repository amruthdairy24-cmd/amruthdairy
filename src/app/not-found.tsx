import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      
      {/* Background Blurs */}
      <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-[#E2E8F0]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Cow/Milk Icon Container */}
      <div className="w-20 h-20 bg-[#F0F9FF] border border-[#BAE6FD] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#0284C7]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <path d="M5 10c0-2 2-3 4-3h6c2 0 4 1 4 3" />
          <path d="M5 10v6c0 2 2 3 4 3h6c2 0 4-1 4-3v-6" />
          <circle cx="9" cy="13" r="1" fill="currentColor" />
          <circle cx="15" cy="13" r="1" fill="currentColor" />
          <path d="M10 16c1 0.7 3 0.7 4 0" />
        </svg>
      </div>

      <p className="text-xs uppercase tracking-widest text-[#0284C7] font-black mb-3">Error 404</p>
      <h1 className="text-4xl font-medium text-[#0F172A] mb-4 font-playfair" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        This page spilled!
      </h1>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8 font-medium">
        The page you&apos;re looking for doesn&apos;t exist. Maybe it was skipped — just like a delivery.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 relative z-10">
        {/* Go Home in 3D rounded glossy style */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '46px',
            padding: '0 32px',
            borderRadius: '12px',
            background: 'linear-gradient(to bottom, #0EA5E9 0%, #0369A1 100%)',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 4px 12px rgba(3, 105, 161, 0.15)',
            border: '1px solid rgba(3, 105, 161, 0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          className="hover:scale-105 hover:shadow-lg"
        >
          Go Home
        </Link>
        
        {/* My Account in clean outline style */}
        <Link
          href="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '46px',
            padding: '0 32px',
            borderRadius: '12px',
            background: 'transparent',
            color: '#0F172A',
            border: '1.5px solid rgba(15, 23, 42, 0.15)',
            fontWeight: 500,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
          className="hover:bg-slate-50 hover:border-slate-300 hover:scale-105"
        >
          My Account
        </Link>
      </div>
    </div>
  )
}
