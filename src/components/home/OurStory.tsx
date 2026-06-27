'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Play, ChevronLeft, ChevronRight, ArrowRight, BookOpen } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'

interface Reel {
  id: number
  src: string
  poster: string
  title: string
  subtitle?: string
  date: string
  duration: string
  isNew?: boolean
}

export function OurStory() {
  const reels: Reel[] = [
    {
      id: 1,
      src: '/videos/whatsapp_story_1.mp4',
      poster: '/images/stories/morning-routine.jpg',
      title: 'Morning Milking',
      subtitle: 'at Amruth Farm',
      date: 'May 20, 2025',
      duration: '02:45',
      isNew: true,
    },
    {
      id: 2,
      src: '/videos/whatsapp_story_2.mp4',
      poster: '/images/stories/feeding-calves.jpg',
      title: 'Feeding Time',
      subtitle: 'Our Happy Cows',
      date: 'May 19, 2025',
      duration: '03:12',
      isNew: true,
    },
    {
      id: 3,
      src: '/videos/whatsapp_story_1.mp4',
      poster: '/images/stories/farm-walk.jpg',
      title: 'Farm Walk',
      subtitle: '& Daily Care',
      date: 'May 18, 2025',
      duration: '02:30',
    },
    {
      id: 4,
      src: '/videos/whatsapp_story_1.mp4',
      poster: '/images/stories/milking-process.jpg',
      title: 'Milking Process',
      subtitle: 'Fresh Every Day',
      date: 'May 17, 2025',
      duration: '03:05',
    },
    {
      id: 5,
      src: '/videos/whatsapp_story_1.mp4',
      poster: '/images/stories/preparing-feed.jpg',
      title: 'Preparing Feed',
      subtitle: 'Natural & Nutritious',
      date: 'May 16, 2025',
      duration: '02:50',
    },
  ]

  return (
    <section id="our-story" className="relative overflow-hidden bg-[#ffff] py-10 bg-white">
      <div className="container-page relative z-10">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 border border-[#1230AE]/30 rounded-full px-3 py-1 text-[11px] text-[#1230AE] font-semibold uppercase tracking-widest mb-4">
            <BookOpen size={11} />
            Our Story
          </span>
          <h2 className="text-2xl text-black sm:text-3xl font-bold md:text-4xl mb-2">
            From Our Farm to Your Family
          </h2>
          <p className="text-sm text-gray-400 max-w-[480px] mx-auto">
            Hover to watch our daily routine live from the farm pastures.
          </p>
        </div>

        {/* Desktop coverflow */}
        <div className="hidden sm:block max-w-[1280px] mx-auto">
          <DesktopReelCoverflow reels={reels.slice(0, 6)} />
        </div>

        {/* Mobile carousel */}
        <div className="sm:hidden">
          <MobileReelCarousel reels={reels.slice(0, 6)} />
        </div>

        {/* CTA */}
        <ScrollReveal direction="up" delay={400} duration={1000}>
          <div className="mt-12 flex justify-center">
            <a
              href="/our-story"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#02429C] text-white font-semibold px-6 py-3 text-sm shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
            >
              View All Stories
              <ArrowRight size={15} />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   DESKTOP REEL COVERFLOW
   ───────────────────────────────────────────────────────── */
function DesktopReelCoverflow({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const goTo = (index: number) => {
    setActiveIndex((index + reels.length) % reels.length)
  }

  const maxSideSlots = 3

  const scaleSteps   = [1,    0.84,  0.70,  0.60]
  const opacitySteps = [1,    0.72,  0.48,  0.28]
  const spacingSteps = [0,    230,   430,   590]   // px offset from center

  return (
    <div className="relative flex items-center justify-center h-[500px]">
      {/* Left arrow */}
      <button
        onClick={() => goTo(activeIndex - 1)}
        aria-label="Previous reel"
        className="absolute left-0 z-50 w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#1230AE] hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all duration-200"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Reel cards */}
      {reels.map((reel, idx) => {
        let offset = idx - activeIndex
        if (offset > reels.length / 2) offset -= reels.length
        if (offset < -reels.length / 2) offset += reels.length

        if (Math.abs(offset) > maxSideSlots) return null

        const depth     = Math.abs(offset)
        const isActive  = offset === 0
        const direction = offset === 0 ? 0 : offset > 0 ? 1 : -1

        return (
          <div
            key={reel.id}
            role={isActive ? undefined : 'button'}
            tabIndex={isActive ? undefined : 0}
            onClick={() => !isActive && goTo(idx)}
            onKeyDown={(e) => {
              if (!isActive && (e.key === 'Enter' || e.key === ' ')) goTo(idx)
            }}
            aria-label={isActive ? undefined : `Show ${reel.title}`}
            className="absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: `translateX(${direction * spacingSteps[depth]}px) scale(${scaleSteps[depth]})`,
              zIndex: 30 - depth,
              opacity: opacitySteps[depth],
              cursor: isActive ? 'default' : 'pointer',
            }}
          >
            <div className={cn('w-[260px]', !isActive && 'pointer-events-none')}>
              <ReelPlayerCard reel={reel} isActive={isActive} />
            </div>
          </div>
        )
      })}

      {/* Right arrow */}
      <button
        onClick={() => goTo(activeIndex + 1)}
        aria-label="Next reel"
        className="absolute right-0 z-50 w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#1230AE] hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all duration-200"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MOBILE REEL CAROUSEL
   All cards stay mounted so CSS transitions animate smoothly.
   Touch swipe supported. Cards beyond ±2 are hidden via opacity
   but never removed from DOM mid-transition.
   ───────────────────────────────────────────────────────── */
function MobileReelCarousel({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const goTo = (index: number) => {
    setActiveIndex((index + reels.length) % reels.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) {
      goTo(activeIndex + (delta > 0 ? 1 : -1))
    }
    touchStartX.current = null
  }

  // Card width + gap between cards in px
  const CARD_W   = 185
  const SIDE_GAP = 120  // horizontal distance from center to side card center

  return (
    <div
      className="relative flex items-center justify-center h-[420px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Arrows intentionally hidden — mobile uses swipe only */}

      {reels.map((reel, idx) => {
        // Shortest-path offset so wrapping feels natural
        let offset = idx - activeIndex
        if (offset > reels.length / 2)  offset -= reels.length
        if (offset < -reels.length / 2) offset += reels.length

        // Only ±2 are visible; beyond that push far off-screen and hide
        const visible  = Math.abs(offset) <= 2
        const isActive = offset === 0

        // Clamp offset for transform so distant cards don't fly wildly
        const clampedOffset = Math.max(-2, Math.min(2, offset))

        return (
          <div
            key={reel.id}
            role={isActive ? undefined : 'button'}
            tabIndex={isActive ? undefined : 0}
            onClick={() => !isActive && goTo(idx)}
            onKeyDown={(e) => {
              if (!isActive && (e.key === 'Enter' || e.key === ' ')) goTo(idx)
            }}
            aria-label={isActive ? undefined : `Show ${reel.title}`}
            className="absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: `translateX(${clampedOffset * SIDE_GAP}px) scale(${isActive ? 1 : 0.78})`,
              zIndex: isActive ? 20 : 10 - Math.abs(offset),
              opacity: isActive ? 1 : visible ? 0.55 : 0,
              pointerEvents: visible ? 'auto' : 'none',
              filter: isActive ? 'none' : 'blur(0.4px)',
              cursor: isActive ? 'default' : 'pointer',
            }}
          >
            <div className={cn('w-[185px]', !isActive && 'pointer-events-none')}>
              <ReelPlayerCard reel={reel} isActive={isActive} />
            </div>
          </div>
        )
      })}

      {/* Dot indicators */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5 pb-1 z-50">
        {reels.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to reel ${i + 1}`}
            className={cn(
              'rounded-full transition-all duration-300',
              i === activeIndex
                ? 'w-4 h-1.5 bg-[#1230AE]'
                : 'w-1.5 h-1.5 bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   REEL PLAYER CARD
   ───────────────────────────────────────────────────────── */
function ReelPlayerCard({ reel, isActive }: { reel: Reel; isActive?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted]     = useState(true)
  const [hovered, setHovered]     = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== videoRef.current) v.pause()
      })
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  useEffect(() => {
    if (!videoRef.current) return
    if (hovered) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {})
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [hovered])

  return (
    <div className="flex flex-col w-full max-w-[260px] mx-auto">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={togglePlay}
        className="group relative w-full aspect-[3/5.3] rounded-2xl overflow-hidden bg-[#0a0a0c] cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_12px_32px_rgba(15,23,42,0.22)] hover:shadow-[0_20px_44px_rgba(15,23,42,0.32)] hover:scale-[1.02]"
      >
        {/* NEW badge */}
        {reel.isNew && (
          <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-[#1230AE] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            New
          </span>
        )}

        {/* Video */}
        <video
          ref={videoRef}
          src={reel.src}
          preload="metadata"
          loop
          playsInline
          muted={isMuted}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
        />

        {/* Bottom gradient + title — shown on active card */}
        {isActive && (reel.title || reel.subtitle) && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-9 pt-10 pointer-events-none">
            <p className="text-white font-semibold text-[13px] leading-snug drop-shadow">
              {reel.title}
            </p>
            {reel.subtitle && (
              <p className="text-white/80 text-[11px] leading-snug drop-shadow">
                {reel.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Play/Pause overlay */}
        {isActive && (
          <div
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 pointer-events-none',
              isPlaying ? 'bg-transparent opacity-0' : 'bg-black/20 opacity-100'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-200">
              <Play size={15} fill="#0F172A" className="text-slate-900 ml-0.5" />
            </div>
          </div>
        )}

        {/* Mute toggle */}
        {isActive && (
          <div className="absolute right-2.5 bottom-2.5 z-20">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="w-7 h-7 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 cursor-pointer transition-all duration-200"
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}