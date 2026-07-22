'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string | null
  width?: number
  height?: number
  className?: string
  priority?: boolean
  forceWhiteLogo?: boolean
  alt?: string
}

export function Logo({
  href = '/',
  width = 200,
  height = 60,
  className = 'w-48 h-auto object-contain',
  priority = true,
  forceWhiteLogo = false,
  alt = 'Amruth Dairy Logo'
}: LogoProps) {
  const logoImage = (
    <Image
      src="/images/logo/amruth-logo.png"
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn(
        'transition-all duration-300',
        forceWhiteLogo
          ? '[filter:url(#logo-invert-filter)]'
          : 'dark:[filter:url(#logo-invert-filter)]',
        className
      )}
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center justify-center shrink-0">
        {logoImage}
      </Link>
    )
  }

  return logoImage
}
