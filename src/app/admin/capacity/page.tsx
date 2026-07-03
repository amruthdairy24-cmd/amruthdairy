import { createClient } from '@/utils/supabase/server'
import { CapacityClient } from './CapacityClient'

export const dynamic = 'force-dynamic'

export default async function CapacityPage() {
  const supabase = await createClient()

  const [
    { data: capacityData, error: capacityError },
    { data: settingsData }
  ] = await Promise.all([
    supabase.from('daily_capacity').select('*').order('date', { ascending: false }),
    supabase.from('system_settings').select('value').eq('key', 'default_capacity').single()
  ]);

  if (capacityError) return <div className="text-red-500">Error: {capacityError.message}</div>

  let defaultCapacityRules = [];
  if (settingsData?.value) {
    if (Array.isArray(settingsData.value)) {
      defaultCapacityRules = settingsData.value;
    } else {
      defaultCapacityRules = [{ date_from: '2000-01-01', capacity: Number(settingsData.value) }];
    }
  } else {
    defaultCapacityRules = [{ date_from: '2000-01-01', capacity: 100 }];
  }

  return <CapacityClient data={capacityData || []} defaultCapacityRules={defaultCapacityRules} />
}
