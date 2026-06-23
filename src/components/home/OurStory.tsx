'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Play, Pause, Sparkles } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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
      style={{
        background: '#F8FAFC', // Warm creamy ivory background matching branding
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container-page" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header Section */}
        <ScrollReveal direction="down" duration={1000}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fff',
                border: '1.5px solid rgba(2, 132, 199, 0.15)',
                color: '#0284C7',
                borderRadius: 999,
                padding: '6px 16px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.04)'
              }}
            >
              <Sparkles size={12} /> Farm Life
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 'clamp(2rem, 3.8vw, 2.8rem)',
                fontWeight: 500,
                color: '#0F172A',
                lineHeight: 1.2,
                marginBottom: 14
              }}
            >
              Our Story
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: 500,
                margin: '0 auto',
                fontWeight: 400
              }}
            >
              Hover to watch our daily routine live from the farm pastures.
            </p>
          </div>
        </ScrollReveal>

        {/* Reels flex-row container (centered side-by-side) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 32,
            flexWrap: 'wrap',
            maxWidth: 800,
            margin: '0 auto'
          }}
        >
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
      style={{
        position: 'relative',
        width: 240,
        height: 426,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#0a0a0c',
        boxShadow: hovered 
          ? '0 24px 48px rgba(15, 23, 42,0.2)' 
          : '0 12px 28px rgba(15, 23, 42,0.08)',
        border: '3px solid #ffffff',
        cursor: 'pointer',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'scale(1.03) translateY(-4px)' : 'scale(1) translateY(0)'
      }}
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={reel.src}
        loop
        playsInline
        muted={isMuted}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
          zIndex: 1
        }}
      />

      {/* Play/Pause Overlay Indicator */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isPlaying ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease'
          }}
        >
          <Play size={16} fill="#0F172A" color="#0F172A" style={{ marginLeft: 2 }} />
        </div>
      </div>

      {/* Floating Mute/Unmute Action Control */}
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          zIndex: 3
        }}
      >
        <button
          onClick={toggleMute}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.2s'
          }}
          className="hover:bg-black/70 hover:scale-105"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  )
}
