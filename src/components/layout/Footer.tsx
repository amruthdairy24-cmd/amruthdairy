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
    { label: 'How It Works', href: '/#about-us' }, // or keep as is or map properly
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
    <footer className="ft-root">

      {/* ── TOP WAVE ──────────────────────────────── */}
      <div className="ft-wave-top" aria-hidden>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 60V30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0Z" fill="#FFFDF7"/>
        </svg>
      </div>

      {/* ── STATS BAND ────────────────────────────── */}
      <div className="ft-stats-band">
        {stats.map(({ value, label }) => (
          <div key={label} className="ft-stat">
            <span className="ft-stat-value">{value}</span>
            <span className="ft-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <div className="ft-main">
        <div className="ft-grid">

          {/* BRAND COLUMN */}
          <div className="ft-brand-col">

            {/* Logo */}
            <div className="ft-logo">
              <div className="ft-logo-icon flex items-center justify-center">
                <Milk size={20} className="text-white" />
              </div>
              <div>
                <p className="ft-logo-name">Amruth</p>
                <p className="ft-logo-sub">DAIRY FARM</p>
              </div>
            </div>

            <p className="ft-brand-desc">
              Farm-fresh A2 milk delivered every morning to happy families in Padil, Mangalore. 
              Pure. Natural. No Additives. No Compromise.
            </p>

            {/* Info pills */}
            <div className="ft-info-pills">
              <div className="ft-info-pill">
                <MapPin size={12} className="ft-info-icon" />
                Padil, Mangalore
              </div>
              <div className="ft-info-pill">
                <Clock size={12} className="ft-info-icon" />
                Delivery by 7:00 AM
              </div>
            </div>

            {/* Contact */}
            <div className="ft-contacts">
              <a href="tel:+919048571147" className="ft-contact-link">
                <div className="ft-contact-icon-wrap">
                  <Phone size={13} />
                </div>
                +91 90485 71147
              </a>
              <a
                href="https://ekodrix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ft-contact-link ft-contact-link-muted"
              >
                <div className="ft-contact-icon-wrap ft-contact-icon-muted">
                  <Globe size={13} />
                </div>
                ekodrix.com
                <ArrowUpRight size={10} className="ft-ext-icon" />
              </a>
            </div>

            {/* Social icons */}
            <div className="ft-social-row">
              {[
                { icon: InstagramIcon, label: 'Instagram' },
                { icon: FacebookIcon, label: 'Facebook' },
                { icon: YoutubeIcon, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="ft-social-btn" aria-label={label}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* LINK COLUMNS */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="ft-link-col">
              <h3 className="ft-link-heading">{category}</h3>
              <ul className="ft-link-list">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="ft-link">
                      <span className="ft-link-dot" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* NEWSLETTER / CTA COLUMN */}
          <div className="ft-cta-col">
            <h3 className="ft-link-heading">Stay Fresh</h3>
            <p className="ft-cta-desc">
              Get updates on new products, offers & delivery schedules.
            </p>
            <div className="ft-newsletter">
              <input
                type="tel"
                placeholder="Your WhatsApp number"
                className="ft-newsletter-input"
              />
              <button className="ft-newsletter-btn">
                Notify Me
              </button>
            </div>

            {/* Freshness card */}
            <div className="ft-freshness-card">
              <div className="ft-freshness-row flex items-start gap-3">
                <div className="ft-freshness-icon-wrap flex items-center justify-center p-2 bg-slate-800 border border-slate-700 rounded-lg text-sky-400">
                  <Sprout size={20} />
                </div>
                <div>
                  <p className="ft-freshness-title">Farm to Doorstep</p>
                  <p className="ft-freshness-desc">Milked at dawn, at your door by 7 AM</p>
                </div>
              </div>
              <div className="ft-freshness-bar">
                <div className="ft-freshness-bar-fill" />
              </div>
              <div className="ft-freshness-labels">
                <span>Farm</span>
                <span>Processing</span>
                <span className="flex items-center gap-1 justify-end">Your Door <Home size={12} className="inline" /></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────── */}
      <div className="ft-bottom">
        <div className="ft-bottom-inner">
          <p className="ft-copyright">
            © {year} Amruth Dairy Farm, Padil, Mangalore. All rights reserved.
          </p>

          <div className="ft-bottom-center">
            <span className="ft-made-with">
              Made with <Heart size={11} className="ft-heart" fill="currentColor" /> in Mangalore
            </span>
          </div>

          <p className="ft-built-by">
            Developed by{' '}
            <a
              href="https://ekodrix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ft-ekodrix-link"
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