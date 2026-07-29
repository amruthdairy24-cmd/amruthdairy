import { createClient } from '@/utils/supabase/server'
import { CustomersClient } from './CustomersClient'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (
        status
      )
    `)
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
        Error loading customers: {error.message}
      </div>
    )
  }

  const mappedData = (data || []).map((p: any) => {
    const subs = Array.isArray(p.subscriptions) ? p.subscriptions : (p.subscriptions ? [p.subscriptions] : [])
    const activeSub = subs.find((s: any) => s.status === 'active' || s.status === 'pending_payment')
    
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      area: p.area,
      created_at: p.created_at,
      subscription_status: activeSub ? activeSub.status : 'inactive'
    }
  })

  return <CustomersClient data={mappedData} />
}
