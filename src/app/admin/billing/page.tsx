import { createClient } from '@/utils/supabase/server'
import { BillingClient } from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const month = searchParams?.month as string | undefined;

  const supabase = await createClient()

  // Determine selected month or default to current month
  const d = new Date()
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const selectedMonth = month || currentMonthStr

  // Calculate start and end of selected month for payments filtering
  const targetDate = new Date(selectedMonth)
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString()
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  // 1. Fetch Invoices (billing_months) for selected month
  const { data: invoicesData } = await supabase
    .from('billing_months')
    .select(`id, billing_month, net_due, amount_paid, profiles!billing_months_customer_id_fkey(full_name)`)
    .eq('billing_month', selectedMonth)
    .order('billing_month', { ascending: false })

  // 2. Fetch Adjustments for selected month
  const { data: adjustmentsData } = await supabase
    .from('billing_adjustments')
    .select(`id, adjustment_type, amount, description, target_month, is_applied, refund_status, created_at, profiles(full_name)`)
    .eq('target_month', selectedMonth)
    .order('created_at', { ascending: false })

  // 3. Fetch Payments for selected month
  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select(`id, amount, payment_type, status, created_at, profiles(full_name)`)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)
    .order('created_at', { ascending: false })

  if (paymentsError) return <div className="text-red-500">Error: {paymentsError.message}</div>

  return <BillingClient 
    invoices={(invoicesData as any) || []} 
    adjustments={(adjustmentsData as any) || []} 
    payments={(paymentsData as any) || []} 
    currentMonth={selectedMonth}
  />
}
