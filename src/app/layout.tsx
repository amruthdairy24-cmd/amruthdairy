import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { bespokeStencil, panchangVariable, cabinetGrotesk } from "@/lib/fonts";
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})



export const metadata: Metadata = {
  title: 'Amruth Milk — Farm Fresh Milk Subscription · Padil, Mangalore',
  description:
    'Manage your daily milk subscription with one tap. Skip, pause for vacation, order extra, pay bills online. Fresh milk from Amruth Dairy, Padil, Mangalore — delivered to your door every morning.',
  keywords: [
    'milk subscription Mangalore',
    'fresh milk delivery Padil',
    'Amruth Milk',
    'dairy subscription India',
    'milk delivery Mangalore',
  ],
  authors: [{ name: 'EKodrix', url: 'https://ekodrix.com' }],
  openGraph: {
    title: 'Amruth Milk — Farm Fresh Daily Milk Subscription',
    description: 'Fresh milk delivered every morning. Manage subscriptions, skip days, pause for vacation — all online.',
    type: 'website',
    locale: 'en_IN',
  },
}

import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import { PageLoader } from '@/components/layout/PageLoader'
import { CartProvider } from '@/contexts/CartContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${bespokeStencil.variable} ${panchangVariable.variable} ${cabinetGrotesk.variable}`}>
      <body suppressHydrationWarning className="font-body antialiased bg-cream-50 text-brown-800 transition-colors duration-300 overflow-x-hidden">
        <ThemeProvider>
          <CartProvider>
            <PageLoader />
            {children}
            <Toaster position="bottom-center" />
          </CartProvider>
        </ThemeProvider>
        {/* Global SVG Color Swap Filter for Dark Mode Logo Inversion */}
        <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0" aria-hidden="true" focusable="false">
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
      </body>
    </html>
  )
}
