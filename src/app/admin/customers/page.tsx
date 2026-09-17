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
          payment_status,
          monthly_amount,
          amount_paid,
          net_due
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

    // Collect all billing months across all subscriptions of this customer
    const allBillingMonths = subs.flatMap((s: any) => Array.isArray(s.billing_months) ? s.billing_months : [])
    const currentMonthBilling = allBillingMonths.find((b: any) => b.billing_month === currentBillingMonthStr) || null
    const isCurrentPaid = currentMonthBilling ? currentMonthBilling.payment_status === 'paid' : false
    
    // Total pending dues across all months
    const totalPendingDues = allBillingMonths
      .filter((b: any) => b.payment_status !== 'paid')
      .reduce((sum: number, b: any) => sum + Math.max(0, Number(b.net_due ?? b.monthly_amount ?? 0)), 0)

    const currentMonthDue = currentMonthBilling 
      ? Math.max(0, Number(currentMonthBilling.net_due ?? currentMonthBilling.monthly_amount ?? 0))
      : 0

    const joinedDaysAgo = p.created_at
      ? Math.max(0, Math.floor((now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    if (activeSub) {
      const bMonths = Array.isArray(activeSub.billing_months) ? activeSub.billing_months : []
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
      is_paid: isCurrentPaid,
      pending_dues: totalPendingDues,
      current_month_due: currentMonthDue,
      joined_days_ago: joinedDaysAgo,
      has_billing_record: allBillingMonths.length > 0,
      quantity_litres: activeSub ? activeSub.quantity_litres : null,
      start_date: activeSub ? activeSub.start_date : null,
      monthly_amount: activeSub ? activeSub.monthly_amount : null,
      daily_rate: activeSub ? activeSub.daily_rate : null,
      delivery_notes: activeSub ? activeSub.delivery_notes : null,
    }
  })

  return <CustomersClient data={mappedData} />
}
