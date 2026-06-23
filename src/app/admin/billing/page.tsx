import { createClient } from '@/utils/supabase/server'
import { BillingClient } from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`id, amount, payment_type, status, created_at, profiles(full_name)`)
    .order('created_at', { ascending: false })

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  return <BillingClient data={(data as any) || []} />
}
