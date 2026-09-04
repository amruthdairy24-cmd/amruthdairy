import { createClient } from '@/utils/supabase/server'
import { CustomersClient } from './CustomersClient'
import { resolveSubscriptionState } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (
        id,
        status,
        plan_type,
        start_date,
        end_date,
        quantity_litres,
        monthly_amount,
        daily_rate,
        delivery_notes,
        billing_months (
          id,
          billing_month,
          payment_status
        )
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

  const now = new Date()
  const currentBillingMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const currentDateStr = now.toISOString().split('T')[0]

  const mappedData = (data || []).map((p: any) => {
    const subs = Array.isArray(p.subscriptions) ? p.subscriptions : (p.subscriptions ? [p.subscriptions] : [])
    const activeSub = subs.find((s: any) => ['active', 'pending_payment', 'paused'].includes(s.status)) || subs[0] || null
    
    let subscriptionState = 'NOT_SUBSCRIBED'
    let isCovered = false

    if (activeSub) {
      const bMonths = Array.isArray(activeSub.billing_months) ? activeSub.billing_months : []
      const currentMonthBilling = bMonths.find((b: any) => b.billing_month === currentBillingMonthStr) || null
      const paidMonths = bMonths
        .filter((b: any) => b.payment_status === 'paid')
        .map((b: any) => b.billing_month)
        .sort()
      const latestPaidMonth = paidMonths.length > 0 ? paidMonths[paidMonths.length - 1] : null

      const stateDetails = resolveSubscriptionState({
        subscription: {
          id: activeSub.id,
          status: activeSub.status,
          plan_type: activeSub.plan_type,
          end_date: activeSub.end_date,
          start_date: activeSub.start_date,
        },
        currentMonthBilling,
        latestPaidMonth,
        currentBillingMonthStr,
        currentDateStr,
      })

      subscriptionState = stateDetails.state
      isCovered = stateDetails.isCovered
    }

    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      area: p.area,
      address: p.address ?? null,
      landmark: p.landmark ?? null,
      floor_notes: p.floor_notes ?? null,
      created_at: p.created_at,
      subscription_status: subscriptionState,
      is_covered: isCovered,
      quantity_litres: activeSub ? activeSub.quantity_litres : null,
      start_date: activeSub ? activeSub.start_date : null,
      monthly_amount: activeSub ? activeSub.monthly_amount : null,
      daily_rate: activeSub ? activeSub.daily_rate : null,
      delivery_notes: activeSub ? activeSub.delivery_notes : null,
    }
  })

  return <CustomersClient data={mappedData} />
}
