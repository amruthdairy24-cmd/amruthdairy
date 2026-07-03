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
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    fetchRawMilkPricing(adminClient)
  ])

  // 1. Total delivering litres today
  // Use daily_delivery_sheet if available to account for skips/extras, otherwise fallback to active subs
  let totalLitresToday = 0;
  if (deliveriesToday && deliveriesToday.length > 0) {
    totalLitresToday = deliveriesToday.reduce((acc, item) => acc + Number(item.total_litres || 0), 0);
  } else {
    const activeSubs = activeSubsData || []
    totalLitresToday = activeSubs.reduce((acc, item) => acc + Number(item.quantity_litres || 0), 0)
  }

  // 2. Monthly Revenue (sum of monthly_amount of active subs for this month)
  const activeSubs = activeSubsData || []
  const totalRevenue = activeSubs.reduce((acc, item) => acc + Number(item.monthly_amount || 0), 0)

  // 3. Deliveries count
  const deliveriesCount = deliveriesToday?.length || activeSubsCount || 0
  const skippedCount = skippedToday?.length || 0

  // 4. Fetch Deliveries list (top 6 today)
  const { data: dbDeliveries } = await supabase
    .from('daily_delivery_sheet')
    .select('id, delivery_status, total_litres, profiles(full_name, area)')
    .eq('delivery_date', todayStr)
    .limit(6)

  const deliveriesList = dbDeliveries && dbDeliveries.length > 0
    ? dbDeliveries.map(item => ({
        id: item.id,
        customerName: (item.profiles as any)?.full_name || 'Customer',
        area: (item.profiles as any)?.area || 'General',
        qty: `${item.total_litres}L`,
        status: item.delivery_status,
      }))
    : activeSubs.slice(0, 6).map(item => ({
        id: item.id,
        customerName: (item.profiles as any)?.full_name || 'Customer',
        area: (item.profiles as any)?.area || 'General',
        qty: `${item.quantity_litres}L`,
        status: 'pending',
      }))

  // 5. Fetch Recent Activities or notifications log
  const { data: dbNotifications } = await supabase
    .from('notifications_log')
    .select('id, notification_type, created_at, message_body, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Map to clean activities
  const recentActivities = dbNotifications && dbNotifications.length > 0
    ? dbNotifications.map(n => {
        let type = 'blue'
        if (n.notification_type.includes('skip')) type = 'amber'
        else if (n.notification_type.includes('payment')) type = 'green'
        else if (n.notification_type.includes('cancel')) type = 'red'

        return {
          id: n.id,
          text: n.message_body || `${(n.profiles as any)?.full_name || 'User'} triggered ${n.notification_type}`,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type
        }
      })
    : [
        { id: '1', text: 'Rajesh Kumar paused subscription for vacation', time: '10 min ago', type: 'amber' },
        { id: '2', text: 'New subscription added: Priya Sharma (A2 Cow Milk)', time: '1 hour ago', type: 'blue' },
        { id: '3', text: 'Payment received from Amit Patel · ₹1,240', time: '2 hours ago', type: 'green' },
        { id: '4', text: 'Delivery route completed by driver: Raj (Zone A)', time: '4 hours ago', type: 'green' },
        { id: '5', text: 'Waitlist notification sent to Sunita Rao', time: '5 hours ago', type: 'blue' }
      ]

  // 6. Subscriptions overview segments
  const subOverview = {
    active: 0,
    paused: 0,
    cancelled: 0,
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
