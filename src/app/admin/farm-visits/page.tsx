import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FarmVisitsClient from '../../../components/admin/FarmVisitsClient'

export const dynamic = 'force-dynamic'

export default async function FarmVisitsPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <FarmVisitsClient />
}
