import { createClient } from '@/utils/supabase/server'
import { CapacityClient } from './CapacityClient'

export const dynamic = 'force-dynamic'

export default async function CapacityPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.from('daily_capacity').select('*').order('date', { ascending: false })

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  return <CapacityClient data={data || []} />
}
