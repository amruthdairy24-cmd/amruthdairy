'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'

const SESSION_KEY = 'amruth_intro_seen'

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(true)
  const [shouldAnimate, setShouldAnimate] = useState(true)

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SESSION_KEY)
    if (alreadySeen) {
      setShouldAnimate(false)
      setIsLoading(false)
      return
    }

    // First visit
    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1')
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldAnimate ? 0.6 : 0, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <Logo href={null} className="w-40 h-auto object-contain" />
            <div className="flex gap-2">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-3 h-3 rounded-full bg-[#02429C]"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-3 h-3 rounded-full bg-[#02429C]"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-3 h-3 rounded-full bg-[#02429C]"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
