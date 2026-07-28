import { createClient } from '@/utils/supabase/server'
import { HeroBannersClient } from './HeroBannersClient'

export const dynamic = 'force-dynamic'

export default async function AdminHeroBannersPage() {
  const supabase = await createClient()

  let initialBanners: any[] = []
  try {
    const { data: banners, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('display_order', { ascending: true })

    if (!error && banners) {
      initialBanners = banners
    }
  } catch (e) {
    console.error('[AdminHeroBannersPage] Failed to fetch banners from DB.', e)
  }

  return <HeroBannersClient initialBanners={initialBanners} />
}
