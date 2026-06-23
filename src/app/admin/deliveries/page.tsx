import { createClient } from '@/utils/supabase/server'
import { DeliveriesClient } from './DeliveriesClient'

export const dynamic = 'force-dynamic'

export default async function DeliveriesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('daily_delivery_sheet')
    .select(`id, delivery_date, total_litres, delivery_status, profiles(full_name, area)`)
    .order('delivery_date', { ascending: false })
    .limit(100)

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  return <DeliveriesClient data={(data as any) || []} />
}
