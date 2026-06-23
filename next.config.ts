import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'amruthmilk.com'],
    },
    // Force static page generation to run in a single thread to prevent Node.js OOM errors
    workerThreads: false,
  },
}

export default nextConfig
