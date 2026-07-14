'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Play, ArrowRight, ShieldCheck, Truck, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { cn } from '@/lib/utils'

// Custom SVG Icons
function CowIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 15c0-4.5 1.5-7 5-7s5 2.5 5 7" />
      <path d="M5 11c-1.5 0-3-1-3-2.5S3.5 6 5 8.5" />
      <path d="M19 11c1.5 0 3-1 3-2.5S20.5 6 19 8.5" />
      <path d="M8.5 8.5C8 7 7.5 5 8 4" />
      <path d="M15.5 8.5C16 7 16.5 5 16 4" />
      <path d="M12 20a5 5 0 0 0 5-5H7a5 5 0 0 0 5 5z" />
      <circle cx="10" cy="17.5" r="0.8" fill="currentColor" />
      <circle cx="14" cy="17.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function MilkBottleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6v3H9z" />
      <path d="M9 5l-1 3v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-1-3" />
      <path d="M8 12h8" />
      <path d="M10 16h4" />
    </svg>
  )
}

interface Reel {
  id: number
  src: string
  poster: string
  title: string
  subtitle: string
  duration: string
  description: string
  badgeNumber: string
}

const CAROUSEL_SETTINGS = {
  loop: false, // Set to true to enable looping
}

const DEFAULT_REELS: Reel[] = [
  {
    id: 1,
    src: '/videos/whatsapp_story_1.mp4#t=0.1',
    poster: '',
    title: 'Morning Milking',
    subtitle: 'Daily Care',
    duration: '01:25',
    description: 'We start our day with healthy cows and clean, hygienic milking.',
    badgeNumber: '01',
  },
  {
    id: 2,
    src: '/videos/whatsapp_story_2.mp4#t=0.1',
    poster: '',
    title: 'Fresh Delivery',
    subtitle: 'Delivered',
    duration: '01:18',
    description: 'Delivered before sunrise to ensure freshness at your doorstep.',
    badgeNumber: '02',
  },
]

export function OurStory() {
  const [reels, setReels] = useState<Reel[]>(DEFAULT_REELS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch('/api/videos')
        const data = await res.json()
        if (data.success && data.reels && data.reels.length > 0) {
          setReels(data.reels)
        }
      } catch (err) {
        console.error('Error fetching reels:', err)
      }
    }
    fetchReels()
  }, [])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const { scrollLeft, clientWidth } = container

    const isMobile = window.innerWidth < 768
    let index = 0

    if (isMobile) {
      index = Math.round(scrollLeft / clientWidth)
    } else {
      const cardWidth = container.firstElementChild?.clientWidth || 0
      const gap = window.innerWidth >= 1024 ? 32 : 24 // lg:gap-8 vs gap-6
      if (cardWidth > 0) {
        index = Math.round(scrollLeft / (cardWidth + gap))
      }
    }

    if (index !== currentIndex) {
      setCurrentIndex(index)
    }
  }

  const handlePrev = () => {
    if (!scrollContainerRef.current || reels.length < 3) return
    const container = scrollContainerRef.current
    const cardWidth = container.firstElementChild?.clientWidth || 0
    const gap = window.innerWidth >= 1024 ? 32 : 24
    
    let targetIndex = currentIndex - 1
    
    if (targetIndex < 0) {
      if (CAROUSEL_SETTINGS.loop) {
        targetIndex = reels.length - 2 // Loop to last set of 2
      } else {
        targetIndex = 0
      }
    }
    
    const scrollAmount = targetIndex * (cardWidth + gap)
    container.scrollTo({ left: scrollAmount, behavior: 'smooth' })
    setCurrentIndex(targetIndex)
  }

  const handleNext = () => {
    if (!scrollContainerRef.current || reels.length < 3) return
    const container = scrollContainerRef.current
    const cardWidth = container.firstElementChild?.clientWidth || 0
    const gap = window.innerWidth >= 1024 ? 32 : 24
    
    let targetIndex = currentIndex + 1
    const maxIndex = reels.length - 2 // Show 2 cards at a time on desktop
    
    if (targetIndex > maxIndex) {
      if (CAROUSEL_SETTINGS.loop) {
        targetIndex = 0
      } else {
        targetIndex = maxIndex
      }
    }
    
    const scrollAmount = targetIndex * (cardWidth + gap)
    container.scrollTo({ left: scrollAmount, behavior: 'smooth' })
    setCurrentIndex(targetIndex)
  }

  const isSlider = reels.length >= 3

  return (
    <section id="our-story" className="relative overflow-hidden bg-[#ffff] py-16 md:py-24 bg-white">
      <div className="container-page relative z-10 max-w-6xl mx-auto px-4">

        {/* Header */}
        <ScrollReveal direction="up" delay={100} duration={800}>
          <div className="relative mb-12 flex flex-col items-center text-center">
            {/* Tagline / Eyebrow */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-[1px] bg-sky-200"></div>
              <span className="text-[11px] md:text-xs font-bold text-[#02429C] uppercase tracking-widest flex items-center gap-1.5">
                LIFE AT AMRUTH DAIRY
              </span>
              <div className="w-8 h-[1px] bg-sky-200"></div>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black font-cabinet leading-tight tracking-tight mb-4">
              Life At <span className="text-[#02429C]">Amruth Dairy</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Take a look behind the scenes at our farm, our healthy cows, and our daily journey from farm to your family's doorstep.
            </p>
          </div>
        </ScrollReveal>

        {/* Video Cards Slider Container */}
        <ScrollReveal direction="up" delay={200} duration={800}>
          <div className="relative max-w-5xl mx-auto px-1 md:px-0">
            {/* Carousel Track */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={cn(
                "flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar gap-6 lg:gap-8 pb-4",
                !isSlider && "md:overflow-x-visible md:flex md:flex-row md:justify-center md:max-w-4xl md:mx-auto",
                !isSlider && reels.length === 1 && "md:flex md:justify-center md:max-w-2xl"
              )}
            >
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  className={cn(
                    "w-full shrink-0 snap-center max-w-[280px] md:max-w-[300px] mx-auto md:mx-0",
                    isSlider && "md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-2rem)/2)]"
                  )}
                >
                  <VideoStoryCard reel={reel} />
                </div>
              ))}
            </div>

            {/* Desktop Navigation Chevrons */}
            {isSlider && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={!CAROUSEL_SETTINGS.loop && currentIndex === 0}
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-30",
                    "w-12 h-12 rounded-full bg-white border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
                    "hidden md:flex items-center justify-center text-[#02429C] hover:bg-sky-50 transition-all cursor-pointer",
                    "disabled:opacity-0 disabled:pointer-events-none"
                  )}
                  aria-label="Previous videos"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={handleNext}
                  disabled={!CAROUSEL_SETTINGS.loop && currentIndex >= reels.length - 2}
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-30",
                    "w-12 h-12 rounded-full bg-white border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
                    "hidden md:flex items-center justify-center text-[#02429C] hover:bg-sky-50 transition-all cursor-pointer",
                    "disabled:opacity-0 disabled:pointer-events-none"
                  )}
                  aria-label="Next videos"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Mobile Swipe Pagination Dots (only >= 3 videos) */}
            {isSlider && (
              <div className="flex justify-center gap-2 mt-6 md:hidden">
                {reels.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!scrollContainerRef.current) return
                      const container = scrollContainerRef.current
                      const { clientWidth } = container
                      container.scrollTo({ left: idx * clientWidth, behavior: 'smooth' })
                      setCurrentIndex(idx)
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      currentIndex === idx ? "bg-[#02429C] w-4" : "bg-gray-300"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

function VideoStoryCard({ reel }: { reel: Reel }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const togglePlay = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mute-btn')) return

    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== videoRef.current) {
          v.pause()
        }
      })
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => { })
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  useEffect(() => {
    const handlePause = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const video = videoRef.current
    if (video) {
      video.addEventListener('pause', handlePause)
      video.addEventListener('play', handlePlay)
    }
    return () => {
      if (video) {
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('play', handlePlay)
      }
    }
  }, [])

  return (
    <div
      onClick={togglePlay}
      className="group relative w-full aspect-[4/5] max-w-[280px] md:max-w-[300px] mx-auto rounded-[24px] overflow-hidden bg-slate-900 cursor-pointer shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:shadow-[0_20px_44px_rgba(15,23,42,0.18)] transition-all duration-300 hover:scale-[1.01]"
    >
      {/* 01 / 02 Badge */}
      <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-[#02429C] text-white flex items-center justify-center text-xs font-bold font-cabinet shadow-md">
        {reel.badgeNumber}
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        src={reel.src}
        preload="auto"
        loop
        playsInline
        muted={isMuted}
        className="absolute inset-0 z-10 w-full h-full object-cover"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

      {/* Play/Pause Button overlay in Center */}
      <div className={cn(
        "absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 pointer-events-none",
        isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
      )}>
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105 pointer-events-auto">
          {isPlaying ? (
            <svg className="w-5 h-5 text-[#02429C]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <Play size={18} fill="#02429C" className="text-[#02429C] ml-1" />
          )}
        </div>
      </div>

      {/* Bottom text info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5 md:p-6 pointer-events-none text-left">
        <div className="flex items-center gap-3">
          <h3 className="text-white text-lg md:text-xl font-bold font-cabinet">{reel.title}</h3>
          <span className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-white/90 bg-black/45 backdrop-blur-md px-2.5 py-0.5 rounded-full">
            <Clock size={11} className="text-white/80" />
            {reel.duration}
          </span>
        </div>

        <p className="text-white/85 text-xs font-semibold mt-1 font-cabinet leading-none">
          {reel.subtitle}
        </p>

        <p className="text-white/70 text-[11px] md:text-xs mt-2 max-w-sm line-clamp-2 leading-relaxed font-sans">
          {reel.description}
        </p>
      </div>

      {/* Mute button on bottom right */}
      <div className="absolute right-4 bottom-4 z-30">
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="mute-btn w-8 h-8 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 cursor-pointer transition-all duration-200"
        >
          {isMuted ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}