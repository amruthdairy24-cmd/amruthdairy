import { createClient } from '@/utils/supabase/server'
import { WaitlistClient } from './WaitlistClient'

export const dynamic = 'force-dynamic'

export default async function WaitlistPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('waitlist')
    .select(`id, quantity_litres, status, created_at, profiles(full_name, area)`)
    .order('created_at', { ascending: true })

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  return <WaitlistClient data={(data as any) || []} />
}
