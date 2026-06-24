import { createClient } from '@/utils/supabase/server'
import { BillingClient } from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = await createClient()

  // 1. Fetch Invoices (billing_months)
  const { data: invoicesData } = await supabase
    .from('billing_months')
    .select(`id, billing_month, net_due, amount_paid, profiles!billing_months_customer_id_fkey(full_name)`)
    .order('billing_month', { ascending: false })

  // 2. Fetch Adjustments
  const { data: adjustmentsData } = await supabase
    .from('billing_adjustments')
    .select(`id, adjustment_type, amount, description, target_month, is_applied, refund_status, created_at, profiles(full_name)`)
    .order('created_at', { ascending: false })

  // 3. Fetch Payments
  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select(`id, amount, payment_type, status, created_at, profiles(full_name)`)
    .order('created_at', { ascending: false })

  if (paymentsError) return <div className="text-red-500">Error: {paymentsError.message}</div>

  return <BillingClient 
    invoices={(invoicesData as any) || []} 
    adjustments={(adjustmentsData as any) || []} 
    payments={(paymentsData as any) || []} 
  />
}
