import { createClient } from '@/utils/supabase/server'
import { SubscriptionsClient } from './SubscriptionsClient'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const month = searchParams?.month as string | undefined;

  const supabase = await createClient()

  const d = new Date()
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const selectedMonth = month || currentMonthStr

  const { data: dbData, error } = await supabase
    .from('billing_months')
    .select(`
      subscription_id,
      payment_status,
      quantity_litres,
      subscriptions (
        start_date,
        profiles (full_name)
      )
    `)
    .eq('billing_month', selectedMonth)
    .order('created_at', { ascending: false })

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  const mappedData = (dbData || []).map((row: any) => ({
    id: row.subscription_id,
    start_date: row.subscriptions?.start_date || 'N/A',
    status: 'active',
    payment_status: row.payment_status || 'pending',
    quantity_litres: row.quantity_litres || 0,
    profiles: row.subscriptions?.profiles || { full_name: 'Unknown' }
  }))

  return <SubscriptionsClient data={mappedData} currentMonth={selectedMonth} />
}
