import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: banners, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error || !banners) {
      if (error) console.error('[hero-banners GET] DB query error:', error.message)
      return NextResponse.json({
        success: true,
        banners: []
      })
    }

    const formattedBanners = banners.map(b => ({
      id: b.id,
      src: b.desktop_image_url,
      mobileSrc: b.mobile_image_url || b.desktop_image_url,
      alt: b.alt_text || b.title || 'Amruth Dairy Hero Banner',
      title: b.title,
      link_url: b.link_url,
      display_order: b.display_order
    }))

    return NextResponse.json({
      success: true,
      banners: formattedBanners
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[hero-banners GET] exception:', msg)
    return NextResponse.json({
      success: true,
      banners: []
    })
  }
}
