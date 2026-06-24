// components/layout/Footer.tsx
import Link from 'next/link'
import { Milk, Phone, Globe, MapPin, Clock, ArrowUpRight, Heart, Home, Sprout } from 'lucide-react'

// Custom brand icons since the project's lucide-react version doesn't export them
function InstagramIcon({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function YoutubeIcon({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  )
}

const footerLinks = {
  Platform: [
    { label: 'Subscribe Now', href: '/subscribe' },
    { label: 'Our Products', href: '/#products' },
    { label: 'Login', href: '/login' },
    { label: 'My Dashboard', href: '/dashboard' },
  ],
  Company: [
    { label: 'About Us', href: '/#about-us' },
    { label: 'Our Story', href: '/#our-story' },
    { label: 'How It Works', href: '/#about-us' },
    { label: 'Admin Panel', href: '/admin' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Delivery Policy', href: '/delivery' },
  ],
}

const stats = [
  { value: '250+', label: 'Happy Families' },
  { value: '7AM', label: 'Daily Delivery' },
  { value: '100%', label: 'Farm Fresh' },
  { value: '0', label: 'Preservatives' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#0f172a] text-slate-300 relative overflow-hidden pt-16 dark:bg-warm-white dark:text-slate-400 dark:border-t dark:border-border">

      {/* ── TOP WAVE ──────────────────────────────── */}
      <div className="w-full overflow-hidden leading-none absolute top-0 left-0 right-0 h-12" aria-hidden>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full block">
          <path d="M0 60V30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0Z" className="fill-cream-50" />
        </svg>
      </div>

      {/* ── STATS BAND ────────────────────────────── */}
      <div className="container-page grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-b border-slate-800 dark:border-border mt-6">
        {stats.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center text-center">
            <span className="text-3xl md:text-4xl font-extrabold text-white dark:text-brand-primary tracking-tight">{value}</span>
            <span className="text-xs md:text-sm font-semibold text-slate-400 dark:text-brown-600 mt-1 uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center shadow-sm">
                <Milk size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight text-white dark:text-brand-primary leading-none">Amruth</p>
                <p className="text-[9px] font-black tracking-widest uppercase text-brand-secondary mt-1.5 leading-none">DAIRY FARM</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 dark:text-brown-600 leading-relaxed">
              Farm-fresh A2 milk delivered every morning to happy families in Padil, Mangalore. 
              Pure. Natural. No Additives. No Compromise.
            </p>

            {/* Info pills */}
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-850 dark:bg-cream-100 border border-slate-800 dark:border-border text-xs font-semibold text-slate-300 dark:text-brown-600">
                <MapPin size={12} className="text-brand-secondary" />
                Padil, Mangalore
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-850 dark:bg-cream-100 border border-slate-800 dark:border-border text-xs font-semibold text-slate-300 dark:text-brown-600">
                <Clock size={12} className="text-brand-secondary" />
                Delivery by 7:00 AM
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-2.5">
              <a href="tel:+919048571147" className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-300 dark:text-brown-600 hover:text-brand-secondary dark:hover:text-brand-secondary transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-cream-100 flex items-center justify-center border border-slate-800 dark:border-border text-slate-400 dark:text-brown-600 group-hover:bg-brand-secondary group-hover:text-white transition-all">
                  <Phone size={13} />
                </div>
                +91 90485 71147
              </a>
              <a
                href="https://ekodrix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-400 dark:text-brown-400 hover:text-brand-secondary dark:hover:text-brand-secondary transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-cream-100 flex items-center justify-center border border-slate-800 dark:border-border text-slate-400 dark:text-brown-600 group-hover:bg-brand-secondary group-hover:text-white transition-all">
                  <Globe size={13} />
                </div>
                <span>ekodrix.com</span>
                <ArrowUpRight size={10} className="text-slate-500" />
              </a>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: InstagramIcon, label: 'Instagram' },
                { icon: FacebookIcon, label: 'Facebook' },
                { icon: YoutubeIcon, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-9 h-9 rounded-lg bg-slate-800 dark:bg-cream-100 flex items-center justify-center border border-slate-800 dark:border-border text-slate-400 dark:text-brown-600 hover:bg-brand-secondary hover:text-white dark:hover:bg-brand-secondary dark:hover:text-white hover:border-brand-secondary transition-all duration-200 cursor-pointer"
                  aria-label={label}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* LINK COLUMNS */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-6">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white dark:text-brand-primary">{category}</h3>
              <ul className="flex flex-col gap-3.5 list-none pl-0">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="inline-flex items-center gap-2 text-sm text-slate-400 dark:text-brown-600 hover:text-brand-secondary dark:hover:text-brand-secondary hover:translate-x-1 transition-all duration-200 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-milk-300 group-hover:bg-brand-secondary transition-colors" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* NEWSLETTER / CTA COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white dark:text-brand-primary">Stay Fresh</h3>
            <p className="text-sm text-slate-400 dark:text-brown-600 leading-relaxed">
              Get updates on new products, offers & delivery schedules.
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Your WhatsApp number"
                className="flex-1 h-11 px-4 rounded-xl bg-slate-800 dark:bg-cream-100 border border-slate-700 dark:border-border text-sm text-white dark:text-brand-primary placeholder:text-slate-550 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
              />
              <button className="h-11 px-6 rounded-xl bg-brand-secondary text-white font-bold text-sm hover:bg-brand-secondary/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                Notify Me
              </button>
            </div>

            {/* Freshness card */}
            <div className="bg-slate-850/40 dark:bg-cream-100/45 border border-slate-800 dark:border-border rounded-2xl p-5 mt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-cream-100 flex items-center justify-center border border-slate-700 dark:border-border text-sky-400">
                  <Sprout size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white dark:text-brand-primary">Farm to Doorstep</p>
                  <p className="text-xs text-slate-400 dark:text-brown-600 mt-0.5">Milked at dawn, at your door by 7 AM</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-700 dark:bg-milk-200 rounded-full overflow-hidden mt-4">
                <div className="w-2/3 h-full bg-brand-secondary rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-brown-400 mt-2 uppercase tracking-wider">
                <span>Farm</span>
                <span>Processing</span>
                <span className="flex items-center gap-1 justify-end">Your Door <Home size={12} className="inline" /></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────── */}
      <div className="border-t border-slate-800 dark:border-border py-8 bg-slate-950 dark:bg-cream-50">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-brown-400">
          <p className="text-center md:text-left">
            © {year} Amruth Dairy Farm, Padil, Mangalore. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5 justify-center">
            <span className="flex items-center gap-1">
              Made with <Heart size={11} className="text-red-500 animate-pulse" fill="currentColor" /> in Mangalore
            </span>
          </div>

          <p className="text-center md:text-right">
            Developed by{' '}
            <a
              href="https://ekodrix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-400 dark:text-brand-primary hover:text-brand-secondary transition-colors"
            >
              EKodrix
            </a>
            {' '}· AMK-WEB-2026
          </p>
        </div>
      </div>

    </footer>
  )
}