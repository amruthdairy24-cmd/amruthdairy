'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'
import { 
  Clock, 
  Heart, 
  ArrowRight, 
  Truck, 
  Phone, 
  Globe, 
  MapPin,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

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

// Custom brand icons since the project's lucide-react version doesn't export them
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

// Custom brand icons since the project's lucide-react version doesn't export them
function XIcon({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
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
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
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
    { label: 'Our Story', href: '/our-story' },
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

export function Footer() {
  const [activeAccordion, setActiveAccordion] = useState<Record<string, boolean>>({
    Platform: false,
    Company: false,
    Legal: false,
    'Stay Fresh': false,
  })

  const toggleSection = (section: string) => {
    setActiveAccordion(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <footer className="bg-[#013378] text-white relative overflow-hidden pt-8">

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-12 gap-8 xl:gap-0">

          {/* BRAND COLUMN */}
          <div className="col-span-1 md:col-span-3 xl:col-span-3 border-b border-white/10 pb-6 xl:border-b-0 xl:pb-0 flex flex-col gap-5 xl:pr-8">
            {/* Logo */}
            <div className="flex items-center justify-start">
              <Logo href="/" forceWhiteLogo className="w-24 h-auto object-contain" />
            </div>

            <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed">
              Farm-fresh milk delivered every morning to happy families in Padil, Mangaluru. 
            </p>

            {/* Contact & Info List */}
            <div className="flex flex-col gap-2.5 text-xs md:text-sm text-blue-100/90">
              <div className="inline-flex items-center gap-2">
                <MapPin size={14} className="text-blue-300 shrink-0" />
                <span>Padil, Mangaluru</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock size={14} className="text-blue-300 shrink-0" />
                <span>Daily delivery by 7:00 AM</span>
              </div>
              <a href="tel:+919048371147" className="inline-flex items-center gap-2 hover:text-white transition-colors group">
                <Phone size={14} className="text-blue-300 shrink-0" />
                <span>+91 9880143808</span>
              </a>
              
            </div>

            {/* Social icons */}
            <div className="flex items-center justify-start gap-2.5 mt-1">
              {[
                { icon: FacebookIcon, label: 'Facebook', href: '#' },
                { icon: XIcon, label: 'Twitter/X', href: '#' },
                { icon: InstagramIcon, label: 'Instagram', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                  aria-label={label}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* LINK COLUMNS */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="col-span-1 md:col-span-1 xl:col-span-2 border-b border-white/10 pb-5 xl:border-b-0 xl:pb-0 xl:pl-8 xl:pr-4 flex flex-col gap-5">
              <button 
                onClick={() => toggleSection(category)}
                className="w-full flex items-center justify-between text-xs md:text-sm font-extrabold uppercase tracking-widest text-white text-left xl:pointer-events-none cursor-pointer"
              >
                <span>{category}</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 xl:hidden text-blue-200/70 ${activeAccordion[category] ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <ul className={`flex flex-col gap-3 list-none pl-0 ${activeAccordion[category] ? 'block' : 'hidden'} xl:block`}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="inline-flex items-center text-xs md:text-sm text-blue-100/90 hover:text-white hover:translate-x-1 transition-all duration-200 group">
                      <ChevronRight size={12} className="mr-1.5 text-blue-300/80 group-hover:text-white transition-colors shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* NEWSLETTER / CTA COLUMN */}
          <div className="col-span-1 md:col-span-3 xl:col-span-3 border-b border-white/10 pb-5 xl:border-b-0 xl:pb-0 xl:pl-8 flex flex-col gap-5">
            <button 
              onClick={() => toggleSection('Stay Fresh')}
              className="w-full flex items-center justify-between text-xs md:text-sm font-extrabold uppercase tracking-widest text-white text-left xl:pointer-events-none cursor-pointer"
            >
              <span>Stay Fresh</span>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 xl:hidden text-blue-200/70 ${activeAccordion['Stay Fresh'] ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <div className={`flex flex-col gap-5 ${activeAccordion['Stay Fresh'] ? 'block' : 'hidden'} xl:block`}>
              <p className="text-xs md:text-sm text-blue-100/80 leading-relaxed">
                Get updates on new products, offers & delivery schedules.
              </p>
              <div className="relative flex items-center w-full">
                <input
                  type="tel"
                  placeholder="Your WhatsApp number"
                  className="w-full h-10 pl-4 pr-11 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder:text-blue-200/50 focus:outline-none focus:bg-white/15 focus:border-white/30"
                />
                <button 
                  className="absolute right-1 w-8 h-8 rounded-full bg-white text-[#013378] hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Freshness card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3.5 mt-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white shrink-0 bg-white/5">
                    <Truck size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Farm to Doorstep</p>
                    <p className="text-[11px] text-blue-100/70 mt-0.5">Milked at dawn, at your door by 7AM</p>
                  </div>
                </div>
                
                {/* Progress bar timeline */}
                <div className="relative w-full">
                  <div className="w-full h-1 bg-white/20 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full w-1/2 bg-[#38bdf8] rounded-full" />
                    
                    {/* Nodes */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#38bdf8] border-2 border-[#013378]" />
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#38bdf8] border-2 border-[#013378]" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/30" />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-blue-200/60 mt-2 tracking-wider">
                    <span>Farm</span>
                    <span>Processing</span>
                    <span>Your Door</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────── */}
      <div className="border-t border-white/10 py-6 bg-[#00255c]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-xs text-blue-100/75">
          {/* Left spacer to center copyright on desktop */}
          <div className="hidden md:block" />
          
          <p className="text-center">
            © 2005 Amruth Dairy Farm, Padi, Mangaluru. All rights reserved.
          </p>
          
          <p className="text-center md:text-right">
            Developed by{' '}
            <a
              href="https://ekodrix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-blue-100 transition-colors"
            >
              EKodrix
            </a>
          </p>
        </div>
      </div>

      {/* SVG Color Swap Filter for Logo */}
      <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="logo-invert-filter">
            <feColorMatrix type="matrix" values="
              -1  0  0  0  1
              -1  0  0  0  1
              -1  0  0  0  1
              -1  0  0  1  0
            " />
          </filter>
        </defs>
      </svg>

    </footer>
  )
}