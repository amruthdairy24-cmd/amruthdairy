import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DeliveryAreasClient from './DeliveryAreasClient'

export const dynamic = 'force-dynamic'

export default async function DeliveryAreasPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/')

  // Fetch areas initially for SSR
  const { data: initialAreas } = await supabase
    .from('delivery_areas')
    .select('*')
    .order('name', { ascending: true })

  return <DeliveryAreasClient initialAreas={initialAreas || []} />
}
