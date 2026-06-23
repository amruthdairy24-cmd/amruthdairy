import { createClient } from '@/utils/supabase/server'
import { CustomersClient } from './CustomersClient'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
        Error loading customers: {error.message}
      </div>
    )
  }

  return <CustomersClient data={data || []} />
}
