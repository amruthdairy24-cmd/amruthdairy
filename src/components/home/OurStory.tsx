'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Play, Sparkles } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'

interface Reel {
  id: number
  src: string
}

export function OurStory() {
  const reels: Reel[] = [
    { id: 1, src: '/videos/whatsapp_story_1.mp4' },
    { id: 2, src: '/videos/whatsapp_story_2.mp4' }
  ]

  return (
    <section
      id="our-story"
      className="bg-[#F8FAFC] dark:bg-slate-950 py-20 relative overflow-hidden"
    >
      <div className="container-page relative z-10">
        {/* Header Section */}
        <ScrollReveal direction="down" duration={1000}>
          <div className="text-center mb-11 flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-warm-white border border-sky-500/15 text-sky-600 dark:text-sky-400 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest mb-4 shadow-[0_2px_6px_rgba(2,132,199,0.04)]">
              <Sparkles size={12} /> Farm Life
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-medium text-slate-950 dark:text-white leading-tight mb-3.5">
              Our Story
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-brown-600 leading-relaxed max-w-[500px] mx-auto font-normal">
              Hover to watch our daily routine live from the farm pastures.
            </p>
          </div>
        </ScrollReveal>

        {/* Reels flex-row container (centered side-by-side) */}
        <div className="flex flex-wrap justify-center items-center gap-8 max-w-[800px] mx-auto">
          {reels.map((reel, idx) => (
            <ScrollReveal key={reel.id} direction="up" delay={idx * 150} duration={1000}>
              <ReelPlayerCard reel={reel} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   MINIMAL REEL PLAYER CARD COMPONENT
   Using group-hover classes to remove JS hover-style tracking
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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={togglePlay}
      className="group relative w-[240px] h-[426px] rounded-brand-lg overflow-hidden bg-[#0a0a0c] border-3 border-white dark:border-slate-850 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_48px_rgba(15,23,42,0.2)] hover:scale-[1.03] hover:-translate-y-1"
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={reel.src}
        loop
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover absolute inset-0 z-1"
      />

      {/* Play/Pause Overlay Indicator */}
      <div
        className={cn(
          'absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 pointer-events-none',
          isPlaying ? 'bg-transparent opacity-0' : 'bg-black/25 opacity-100'
        )}
      >
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-200">
          <Play size={16} fill="#0F172A" className="text-slate-900 ml-0.5" />
        </div>
      </div>

      {/* Floating Mute/Unmute Action Control */}
      <div className="absolute right-3.5 bottom-3.5 z-20">
        <button
          onClick={toggleMute}
          className="w-8 h-8 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 cursor-pointer transition-all duration-200"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  )
}

