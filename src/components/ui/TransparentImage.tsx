'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TransparentImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
  className?: string
  priority?: boolean
}

// Simple cache to prevent reprocessing the same image
const processedCache: Record<string, string> = {}

export function TransparentImage({
  src,
  alt,
  style,
  className,
}: TransparentImageProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(processedCache[src] || null)

  useEffect(() => {
    if (processedCache[src]) {
      setProcessedSrc(processedCache[src])
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      const width = canvas.width
      const height = canvas.height

      // Flood fill queue starting from the 4 corners
      const visited = new Uint8Array(width * height)
      const queue: number[] = []

      // Push 4 corners
      const pushPixel = (x: number, y: number) => {
        const idx = y * width + x
        if (!visited[idx]) {
          visited[idx] = 1
          queue.push(idx)
        }
      }

      // Add border pixels to start queue
      for (let x = 0; x < width; x++) {
        pushPixel(x, 0)
        pushPixel(x, height - 1)
      }
      for (let y = 0; y < height; y++) {
        pushPixel(0, y)
        pushPixel(width - 1, y)
      }

      // Tolerance for white background removal
      const tolerance = 20
      const targetR = 255
      const targetG = 255
      const targetB = 255

      // BFS to find all background connected pixels
      let head = 0
      while (head < queue.length) {
        const currIdx = queue[head++]
        const cy = Math.floor(currIdx / width)
        const cx = currIdx % width

        const offset = currIdx * 4
        const r = data[offset]
        const g = data[offset + 1]
        const b = data[offset + 2]

        // Check if color is close to white
        const isWhite = 
          Math.abs(r - targetR) < tolerance &&
          Math.abs(g - targetG) < tolerance &&
          Math.abs(b - targetB) < tolerance

        if (isWhite) {
          // Set alpha to 0
          data[offset + 3] = 0

          // Check neighbors (4-way)
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ]

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx
              if (!visited[nIdx]) {
                visited[nIdx] = 1
                queue.push(nIdx)
              }
            }
          }
        }
      }

      // Update the canvas with transparent pixels
      ctx.putImageData(imgData, 0, 0)

      // Dynamic Auto-Cropping of transparent borders to maximize display size
      let minX = width
      let minY = height
      let maxX = 0
      let maxY = 0
      let hasContent = false

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4
          const alpha = data[offset + 3]
          if (alpha > 0) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
            hasContent = true
          }
        }
      }

      try {
        if (hasContent && (minX > 0 || minY > 0 || maxX < width - 1 || maxY < height - 1)) {
          const cropWidth = maxX - minX + 1
          const cropHeight = maxY - minY + 1
          const cropCanvas = document.createElement('canvas')
          cropCanvas.width = cropWidth
          cropCanvas.height = cropHeight
          const cropCtx = cropCanvas.getContext('2d')
          
          if (cropCtx) {
            // Draw the cropped portion onto the new canvas
            cropCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
            const dataUrl = cropCanvas.toDataURL('image/png')
            processedCache[src] = dataUrl
            setProcessedSrc(dataUrl)
            return
          }
        }

        // Fallback if no crop needed
        const dataUrl = canvas.toDataURL('image/png')
        processedCache[src] = dataUrl
        setProcessedSrc(dataUrl)
      } catch (err) {
        console.error('Failed to export transparent canvas', err)
        setProcessedSrc(src) // Fallback to original
      }
    }

    img.onerror = () => {
      setProcessedSrc(src) // Fallback to original
    }
  }, [src])

  return (
    <div style={style} className={cn('relative w-full h-full', className)}>
      {processedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={processedSrc}
          alt={alt}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full bg-transparent" />
      )}
    </div>
  )
}
