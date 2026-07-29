'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/layout/Logo'

const SESSION_KEY = 'amruth_intro_seen'

export function PageLoader() {
  // Start as true so the loader covers the page immediately on first render
  // This prevents the flash of page content before we check sessionStorage
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SESSION_KEY)
    if (alreadySeen) {
      // Already seen — hide loader almost instantly (no flash)
      setShowLoader(false)
    } else {
      // First visit — show the full intro animation
      const timer = setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, 'true')
        setShowLoader(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center select-none"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-72 h-72 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-3xl pointer-events-none" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-7 z-10"
          >
            {/* Logo */}
            <div className="relative">
              <Logo href={null} className="w-48 sm:w-56 h-auto object-contain drop-shadow-sm" />
            </div>

            {/* Smooth Loading Indicator / Pulsing Wave */}
            <div className="flex items-center gap-2 mt-2">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                className="w-2.5 h-2.5 rounded-full bg-[#02429C] dark:bg-blue-400"
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="w-2.5 h-2.5 rounded-full bg-[#02429C] dark:bg-blue-400"
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-2.5 h-2.5 rounded-full bg-[#02429C] dark:bg-blue-400"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
