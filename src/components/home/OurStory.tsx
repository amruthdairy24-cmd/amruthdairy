'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Play, Sparkles, Sun, Beef, Sprout, Milk, Salad, Sunset, ArrowRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'

interface Reel {
  id: number
  src: string
  poster: string
  title: string
  date: string
  duration: string
  icon: React.ElementType
  isNew?: boolean
}

export function OurStory() {
  // Add up to 6 reels here. Extra reels beyond 6 won't show on this section —
  // link them from the "View All Stories" page instead.
  const reels: Reel[] = [
    {
      id: 1,
      src: '/videos/whatsapp_story_1.mp4',
      poster: '/images/stories/morning-routine.jpg',
      title: 'Morning Routine',
      date: 'May 20, 2025',
      duration: '02:45',
      icon: Sun,
      isNew: true,
    },
    {
      id: 2,
      src: '/videos/whatsapp_story_2.mp4',
      poster: '/images/stories/feeding-calves.jpg',
      title: 'Feeding Our Calves',
      date: 'May 19, 2025',
      duration: '03:12',
      icon: Beef,
      isNew: true,
    },
    {
      id: 3,
      src: '/videos/whatsapp_story_3.mp4',
      poster: '/images/stories/farm-walk.jpg',
      title: 'Farm Walk & Care',
      date: 'May 18, 2025',
      duration: '02:30',
      icon: Sprout,
    },
    {
      id: 4,
      src: '/videos/whatsapp_story_4.mp4',
      poster: '/images/stories/milking-process.jpg',
      title: 'Milking Process',
      date: 'May 17, 2025',
      duration: '03:05',
      icon: Milk,
    },
    {
      id: 5,
      src: '/videos/whatsapp_story_5.mp4',
      poster: '/images/stories/preparing-feed.jpg',
      title: 'Preparing Feed',
      date: 'May 16, 2025',
      duration: '02:50',
      icon: Salad,
    },
  ]

  return (
    <section id="our-story" className="relative overflow-hidden bg-[#F8FAFC] py-10">
      {/* Blue gradient backdrop with milk-splash artwork */}
      {/* bg-position controls which part of the image shows: */}
      {/* "center 80%" pushes the visible window DOWN, revealing more of the TOP of the image (sky/background) */}
      {/* "center 20%" would push the visible window UP, revealing more of the BOTTOM (the milk splash) */}
      {/* Since the milk splash sits at the bottom of the source image, lower the % to reveal more of it */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/images/our-story-bg.png')", backgroundPosition: 'center -90px' }}
        aria-hidden="true"
      />

      <div className="container-page relative z-10">
        {/* Header Section */}
        <ScrollReveal direction="down" duration={1000}>
          <div className="mb-11 flex flex-col items-center text-center">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 text-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest backdrop-blur-sm">
              <Sparkles size={12} /> Farm Life
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium text-white leading-tight mb-3.5">
              Our Story
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-[500px] mx-auto font-normal">
              Hover to watch our daily routine live from the farm pastures.
            </p>
          </div>
        </ScrollReveal>

        {/* Reels coverflow — DESKTOP / LAPTOP. Hidden on mobile, shown from sm: up. */}
        {/* max-w-[1280px] controls overall section width — raise this if cards feel cramped */}
        <div className="hidden sm:block max-w-[1280px] mx-auto">
          <DesktopReelCoverflow reels={reels.slice(0, 6)} />
        </div>

        {/* Reels carousel — MOBILE ONLY. Hidden from sm: up. */}
        <div className="sm:hidden">
          <MobileReelCarousel reels={reels.slice(0, 6)} />
        </div>

        {/* View All Stories CTA */}
        <ScrollReveal direction="up" delay={400} duration={1000}>
          <div className="mt-12 flex justify-center">
            <a
              href="/our-story"
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#1230AE] font-semibold px-6 py-3 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
            >
              View All Stories
              <ArrowRight size={16} />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   DESKTOP REEL COVERFLOW — LAPTOP / DESKTOP ONLY
   "video one" / active card stays large and sharp in the center.
   Up to 3 cards stack behind it on each side, shrinking and
   fading the further they sit from center — matching the
   reference depth-stack image. Clicking a side card brings it
   forward to become the new active card.
   Only renders from `sm:` and up — see the `hidden sm:block`
   wrapper in OurStory(). Mobile keeps its own separate carousel.
   ───────────────────────────────────────────────────────── */
function DesktopReelCoverflow({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const goTo = (index: number) => {
    const wrapped = (index + reels.length) % reels.length
    setActiveIndex(wrapped)
  }

  // How many cards to show on EACH side, capped at 3 like the reference image.
  // If there aren't enough reels to fill 3 on a side, this naturally shows fewer —
  // so 6 reels show 3 on one side / 2 on the other without looking broken, and
  // adding a 7th reel (1 active + 3 + 3) fills the look exactly like the image.
  const maxSideSlots = 3

  // Per-step size/spacing/fade values, center (index 0) → outermost (index 3).
  // spacingSteps is the ONE array that controls horizontal spread — raise these
  // numbers to push side cards further toward the left/right edges of the section.
  const scaleSteps = [1, 0.86, 0.74, 0.64]
  const opacitySteps = [1, 0.7, 0.45, 0.25]
  const spacingSteps = [0, 225, 420, 570] // px offset from center per depth step

  return (
    <div className="relative flex items-center justify-center h-[460px]">
      {reels.map((reel, idx) => {
        let offset = idx - activeIndex
        if (offset > reels.length / 2) offset -= reels.length
        if (offset < -reels.length / 2) offset += reels.length

        if (Math.abs(offset) > maxSideSlots) return null

        const depth = Math.abs(offset)
        const isActive = offset === 0
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
            {/* w-[290px] sets the active/base card size for desktop — independent from mobile's size */}
            <div className={cn('w-[290px]', !isActive && 'pointer-events-none')}>
              <ReelPlayerCard reel={reel} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MOBILE REEL CAROUSEL — MOBILE ONLY
   Center card is large/forward ("active"). The card immediately
   before and after it peek out from behind on the left/right.
   Tapping a side card makes it the new active (center) card.
   This component only renders below the `sm` breakpoint — see
   the `sm:hidden` wrapper where it's used in OurStory().
   Untouched by the desktop coverflow changes above.
   ───────────────────────────────────────────────────────── */
function MobileReelCarousel({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const goTo = (index: number) => {
    // wrap around so swiping/tapping past either end loops
    const wrapped = (index + reels.length) % reels.length
    setActiveIndex(wrapped)
  }

  return (
    <div className="relative flex items-center justify-center h-[380px]">
      {reels.map((reel, idx) => {
        // offset: 0 = active/center, -1 = one to the left, 1 = one to the right, etc.
        let offset = idx - activeIndex
        if (offset > reels.length / 2) offset -= reels.length
        if (offset < -reels.length / 2) offset += reels.length

        // Only render the active card plus its immediate left/right neighbors.
        // Everything else stays out of view (and out of the DOM flow) so it
        // doesn't block taps or show up oddly far in the back.
        if (Math.abs(offset) > 1) return null

        const isActive = offset === 0

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
              transform: `translateX(${offset * 105}px) scale(${isActive ? 1 : 0.78})`,
              zIndex: isActive ? 20 : 10,
              opacity: isActive ? 1 : 0.55,
              filter: isActive ? 'none' : 'blur(0.5px)',
              cursor: isActive ? 'default' : 'pointer',
            }}
          >
            {/* w-[200px] sets the size of mobile cards — independent from the laptop/desktop size */}
            <div className={cn('w-[200px]', !isActive && 'pointer-events-none')}>
              <ReelPlayerCard reel={reel} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   REEL PLAYER CARD COMPONENT
   Click to play/pause, hover to auto-preview, hover/tap mute toggle.
   ───────────────────────────────────────────────────────── */
function ReelPlayerCard({ reel }: { reel: Reel }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [hovered, setHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      // Pause all other videos on the page if they exist
      const allVideos = document.querySelectorAll('video')
      allVideos.forEach((vid) => {
        if (vid !== videoRef.current) vid.pause()
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

  // Handle play/pause on hover
  useEffect(() => {
    if (!videoRef.current) return

    if (hovered) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked by browser policy
          })
      }
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [hovered])

  return (
    // 👇 THIS IS THE LINE THAT CONTROLS THE CARD'S OWN MAX SIZE: max-w-[290px]
    // The actual rendered size on each screen is set by the wrapper that calls this
    // component (w-[290px] in DesktopReelCoverflow, w-[200px] in MobileReelCarousel) —
    // this max-w just needs to be >= the largest of those so neither gets clipped.
    <div className="flex flex-col w-full max-w-[250px] mx-auto">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={togglePlay}
        className="group relative w-full aspect-[3/5.3] rounded-2xl overflow-hidden bg-[#0a0a0c] cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.3)] hover:scale-[1.03]"
      >
        {/* NEW badge */}
        {reel.isNew && (
          <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-[#1230AE] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            New
          </span>
        )}

        {/* HTML5 Video element */}
        {/* No poster image yet — preload="metadata" makes the browser paint the video's own first frame instead of a black box. Add poster={reel.poster} back once real thumbnail images exist at those paths. */}
        <video
          ref={videoRef}
          src={reel.src}
          preload="metadata"
          loop
          playsInline
          muted={isMuted}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
        />

        {/* Play/Pause Overlay Indicator */}
        <div
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 pointer-events-none',
            isPlaying ? 'bg-transparent opacity-0' : 'bg-black/25 opacity-100'
          )}
        >
          <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-200">
            <Play size={15} fill="#0F172A" className="text-slate-900 ml-0.5" />
          </div>
        </div>

        {/* Floating Mute/Unmute Action Control */}
        <div className="absolute right-2.5 bottom-2.5 z-20">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            className="w-7 h-7 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 cursor-pointer transition-all duration-200"
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  )
}