import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'
import { createAdminClient } from '@/utils/supabase/admin'
import { fetchRawMilkPricing } from '@/lib/billing'

// Force dynamic rendering to always query latest database records
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get current date in IST (YYYY-MM-DD)
  const d = new Date()
  const todayStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  
  // Current billing month (1st of the current month)
  const formattedBillingMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

  const adminClient = createAdminClient()

  // Parallel fetches for summary counts
  const [
    { count: totalCustomersCount },
    { count: activeSubsCount },
    { count: totalSubsCount },
    { count: waitlistCount },
    { data: activeSubsData },
    { data: allCurrentMonthBilling },
    { data: deliveriesToday },
    { data: skippedToday },
    { count: newCustomersCount },
    rawMilkPricing
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('billing_months').select('id', { count: 'exact', head: true }).eq('billing_month', formattedBillingMonth).eq('payment_status', 'paid'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
    supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
    supabase.from('billing_months').select('quantity_litres, monthly_amount, id:subscription_id, profiles(full_name, area)').eq('billing_month', formattedBillingMonth).eq('payment_status', 'paid'),
    supabase.from('billing_months').select('payment_status').eq('billing_month', formattedBillingMonth),
    supabase.from('daily_delivery_sheet').select('id, total_litres').eq('delivery_date', todayStr),
    supabase.from('daily_delivery_sheet').select('id', { count: 'exact' }).eq('delivery_date', todayStr).eq('delivery_status', 'skipped'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', (() => { const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); return sevenDaysAgo.toISOString(); })()),
    fetchRawMilkPricing(adminClient)
  ])

  // 1. Total delivering litres today
  // Only count actual rows in today's delivery sheet.
  let totalLitresToday = 0
  if (deliveriesToday && deliveriesToday.length > 0) {
    totalLitresToday = deliveriesToday.reduce((acc, item) => acc + Number(item.total_litres || 0), 0)
  }

  // 2. Monthly Revenue (sum of monthly_amount of active subs for this month)
  const activeSubs = activeSubsData || []
  const totalRevenue = activeSubs.reduce((acc, item) => acc + Number(item.monthly_amount || 0), 0)

  // 3. Deliveries count
  const deliveriesCount = deliveriesToday?.length || 0
  const skippedCount = skippedToday?.length || 0

  // 4. Fetch Deliveries list (top 6 today)
  const { data: dbDeliveries } = await supabase
    .from('daily_delivery_sheet')
    .select('id, delivery_status, total_litres, profiles:customer_id(full_name, area), subscriptions:subscription_id(plan_type)')
    .eq('delivery_date', todayStr)
    .limit(6)

  const deliveriesList = (dbDeliveries || []).map((item: any) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    const subscription = Array.isArray(item.subscriptions) ? item.subscriptions[0] : item.subscriptions

    return {
      id: item.id,
      customerName: profile?.full_name || 'Customer',
      area: profile?.area || 'General',
      qty: `${item.total_litres}L`,
      status: item.delivery_status,
      isTrial: subscription?.plan_type === 'trial'
    }
  })

  // 5. Fetch Recent Activities or notifications log
  const { data: dbNotifications } = await supabase
    .from('notifications_log')
    .select('id, notification_type, created_at, message_body, profiles:user_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Map to clean activities
  const recentActivities = (dbNotifications || []).map((n: any) => {
    const profile = Array.isArray(n.profiles) ? n.profiles[0] : n.profiles
    let type = 'blue'
    if (n.notification_type.includes('skip')) type = 'amber'
    else if (n.notification_type.includes('payment')) type = 'green'
    else if (n.notification_type.includes('cancel')) type = 'red'

    return {
      id: n.id,
      text: n.message_body || (profile?.full_name ? profile.full_name + ' triggered ' + n.notification_type : 'User triggered ' + n.notification_type),
      time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type
    }
  })

  // 6. Subscriptions overview segments
  const subOverview = {
    active: 0,
    pending: 0
  }

  if (allCurrentMonthBilling) {
    allCurrentMonthBilling.forEach(item => {
      if (item.payment_status === 'paid') subOverview.active++
      else if (item.payment_status === 'pending') subOverview.pending++
    })
  } else {
    subOverview.active = activeSubsCount || 0
    subOverview.pending = (totalSubsCount || 0) - (activeSubsCount || 0)
  }

  return (
    <DashboardClient 
      stats={{
        totalCustomers: totalCustomersCount || 0,
        activeSubscriptions: activeSubsCount || 0,
        totalSubscriptions: totalSubsCount || 0,
        waitlist: waitlistCount || 0,
        totalLitresToday,
        totalRevenue,
        deliveriesCount,
        skippedCount,
        newCustomersThisWeek: newCustomersCount || 0
      }}
      deliveriesList={deliveriesList}
      recentActivities={recentActivities}
      subOverview={subOverview}
      rawMilkPricing={rawMilkPricing}
    />
  )
}





