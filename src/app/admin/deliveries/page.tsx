import { createClient } from '@/utils/supabase/server'
import { DeliveriesClient } from './DeliveriesClient'

export const dynamic = 'force-dynamic'

export default async function DeliveriesPage() {
  const supabase = await createClient()

  // Get today's date in IST
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  return <DeliveriesClient initialDate={todayStr} />
}
