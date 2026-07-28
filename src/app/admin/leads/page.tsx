import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import LeadsClient from './LeadsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const adminSupabase = createAdminClient()

export default async function AdminLeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch initial newsletter subscribers
  const { data: subscribers } = await adminSupabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })

  const list = subscribers || []
  const total = list.length
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonth = list.filter(s => s.created_at >= firstDayOfMonth).length

  return (
    <LeadsClient
      initialSubscribers={list}
      initialStats={{
        total_subscribers: total,
        new_this_month: thisMonth
      }}
    />
  )
}
