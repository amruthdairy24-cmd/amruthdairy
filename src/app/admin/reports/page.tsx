import { createClient } from '@/utils/supabase/server'
import { ReportsClient } from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()

  const d = new Date()
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  
  // Calculate boundaries for current month
  const targetDate = new Date(currentMonthStr)
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString()
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  // Calculate boundaries for last month
  const lastMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`
  const startOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1).toISOString()
  const endOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  // 1. Fetch Payments (Current & Last Month)
  const { data: currentPayments } = await supabase
    .from('payments')
    .select('id, amount, method, status, created_at, profiles(full_name)')
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)
    .in('status', ['success', 'completed'])
    .order('created_at', { ascending: false })

  const { data: lastPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', startOfLastMonth)
    .lte('created_at', endOfLastMonth)
    .in('status', ['success', 'completed'])

  // 2. Fetch Active Subscriptions & Plans
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, status, plan_id, subscription_plans(name)')
    .eq('status', 'active')

  // 3. Fetch Billing Months (Invoices) for Outstanding Dues
  // For true due we ideally need full adjustments, but for the dashboard KPI we can use net_due or raw calculation
  const { data: currentInvoices } = await supabase
    .from('billing_months')
    .select('net_due, amount_paid, payment_status')
    .eq('billing_month', currentMonthStr)
    
  const { data: lastInvoices } = await supabase
    .from('billing_months')
    .select('net_due, amount_paid, payment_status')
    .eq('billing_month', lastMonthStr)

  // --- KPI Calculations ---
  const currentRevenue = (currentPayments || []).reduce((sum, p) => sum + p.amount, 0)
  const lastRevenue = (lastPayments || []).reduce((sum, p) => sum + p.amount, 0)
  const revenueGrowth = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100

  // We approximate outstanding dues for simplicity here
  const currentOutstanding = (currentInvoices || [])
    .filter(inv => inv.payment_status !== 'paid')
    .reduce((sum, inv) => sum + Math.max(0, (inv.net_due || 0) - (inv.amount_paid || 0)), 0)
  const lastOutstanding = (lastInvoices || [])
    .filter(inv => inv.payment_status !== 'paid')
    .reduce((sum, inv) => sum + Math.max(0, (inv.net_due || 0) - (inv.amount_paid || 0)), 0)
  
  const activeSubsCount = subscriptions?.length || 0

  // --- Chart Data Preparation ---
  // Revenue Trend (Group by Day)
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
  const revenueTrendMap = new Map<number, number>()
  for (let i = 1; i <= daysInMonth; i++) revenueTrendMap.set(i, 0)
    
  currentPayments?.forEach(p => {
    const day = new Date(p.created_at).getDate()
    revenueTrendMap.set(day, (revenueTrendMap.get(day) || 0) + p.amount)
  })
  
  const revenueTrend = Array.from(revenueTrendMap.entries()).map(([day, amount]) => ({
    day: `Day ${day}`,
    amount
  }))

  // Subscription Mix (Donut)
  const planMixMap = new Map<string, number>()
  subscriptions?.forEach(s => {
    const planName = Array.isArray(s.subscription_plans) ? s.subscription_plans[0]?.name : (s.subscription_plans as any)?.name
    const name = planName || 'Custom Plan'
    planMixMap.set(name, (planMixMap.get(name) || 0) + 1)
  })
  
  const subscriptionMix = Array.from(planMixMap.entries()).map(([name, value]) => ({ name, value }))

  // Payment Methods (Bar)
  const methodMap = new Map<string, number>()
  currentPayments?.forEach(p => {
    const method = (p.method || 'other').replace('_', ' ').toUpperCase()
    methodMap.set(method, (methodMap.get(method) || 0) + p.amount)
  })
  const paymentMethods = Array.from(methodMap.entries()).map(([method, amount]) => ({
    name: method,
    amount
  }))

  return (
    <ReportsClient 
      kpis={{
        currentRevenue,
        revenueGrowth,
        currentOutstanding,
        lastOutstanding,
        activeSubsCount
      }}
      charts={{
        revenueTrend,
        subscriptionMix,
        paymentMethods
      }}
      recentPayments={(currentPayments as any || []).slice(0, 10)}
    />
  )
}
