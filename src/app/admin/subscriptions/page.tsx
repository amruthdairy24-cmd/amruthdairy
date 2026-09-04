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
    .from('subscriptions')
    .select(`
      id,
      start_date,
      status,
      quantity_litres,
      created_at,
      profiles (full_name),
      billing_months (
        payment_status,
        billing_month
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return <div className="text-red-500">Error: {error.message}</div>

  const mappedData = (dbData || []).map((row: any) => {
    // Find the billing month for the selected month
    const currentBill = (row.billing_months || []).find(
      (bm: any) => bm.billing_month === selectedMonth
    );
    
    // If no bill exists for this month, indicate 'unrenewed' if subscription is active, else 'N/A'
    let payment_status = currentBill ? currentBill.payment_status : (row.status === 'active' ? 'unrenewed' : 'N/A');
    
    // If they start next month, we might want to say "Starts Next Month" instead of N/A, but we'll use N/A
    
    return {
      id: row.id,
      start_date: row.start_date || 'N/A',
      status: row.status || 'pending',
      payment_status: payment_status,
      quantity_litres: row.quantity_litres || 0,
      profiles: row.profiles || { full_name: 'Unknown' }
    };
  })

  return <SubscriptionsClient data={mappedData} currentMonth={selectedMonth} />
}
