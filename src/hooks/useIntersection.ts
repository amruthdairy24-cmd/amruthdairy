'use client'

import { useState, useEffect, useRef, type RefObject } from 'react'

interface Options {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

/**
 * useIntersection — Lightweight IntersectionObserver hook for scroll animations.
 * Uses IntersectionObserver (not Framer Motion scroll) for better mobile performance.
 *
 * @param ref - Ref to the element to observe
 * @param options - IntersectionObserver options
 * @returns boolean — true when element is visible
 */
export function useIntersection(
  ref: RefObject<Element | null>,
  options: Options = {}
): boolean {
  const { threshold = 0.1, rootMargin = '0px', once = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // If once: true, stop observing after first intersection
          if (once) {
            observerRef.current?.disconnect()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observerRef.current.observe(element)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [ref, threshold, rootMargin, once])

  return isVisible
}
