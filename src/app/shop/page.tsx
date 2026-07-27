'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LegacyShopRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/#products')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#02429C] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Redirecting to Products...</p>
      </div>
    </div>
  )
}