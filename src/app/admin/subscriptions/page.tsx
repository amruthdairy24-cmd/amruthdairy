import { createClient } from '@/utils/supabase/server'
import { SubscriptionsClient } from './SubscriptionsClient'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`id, start_date, status, quantity_litres, profiles(full_name)`)
    .order('start_date', { ascending: false })

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  return <SubscriptionsClient data={(data as any) || []} />
}
