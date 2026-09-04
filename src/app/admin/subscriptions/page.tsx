import { createClient } from '@/utils/supabase/server'
import { SubscriptionsClient } from './SubscriptionsClient'
import { getTodayIST } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const month = searchParams?.month as string | undefined;

  const supabase = await createClient()

  const todayISTStr = getTodayIST() // YYYY-MM-DD in Asia/Kolkata
  const currentMonthStr = `${todayISTStr.slice(0, 7)}-01`
  const selectedMonth = month || currentMonthStr

  // Parse selected month range for trial validation
  const monthParts = selectedMonth.split('-')
  const selYear = parseInt(monthParts[0], 10)
  const selMonthIndex = parseInt(monthParts[1], 10) - 1

  const monthStartDate = new Date(selYear, selMonthIndex, 1)
  const monthEndDate = new Date(selYear, selMonthIndex + 1, 0, 23, 59, 59)

  // 1. Fetch normal paid subscribers for selectedMonth
  const { data: paidBills, error: billErr } = await supabase
    .from('billing_months')
    .select(`
      id,
      billing_month,
      payment_status,
      amount_paid,
      monthly_amount,
      subscription_id,
      subscriptions (
        id,
        customer_id,
        start_date,
        end_date,
        status,
        quantity_litres,
        daily_rate,
        plan_type,
        created_at,
        profiles (full_name, phone)
      )
    `)
    .eq('billing_month', selectedMonth)
    .eq('payment_status', 'paid');

  if (billErr) {
    console.error('Error fetching paid billing months:', billErr.message)
  }

  // 2. Fetch paid trial subscriptions (status = 'active')
  const { data: trialSubs, error: trialErr } = await supabase
    .from('subscriptions')
    .select(`
      id,
      customer_id,
      start_date,
      end_date,
      status,
      quantity_litres,
      daily_rate,
      monthly_amount,
      plan_type,
      created_at,
      profiles (full_name, phone)
    `)
    .eq('plan_type', 'trial')
    .eq('status', 'active');

  if (trialErr) {
    console.error('Error fetching trial subscriptions:', trialErr.message)
  }

  const normalSubscribedCustomerIds = new Set<string>()
  const mappedNormalData: any[] = []

  if (paidBills) {
    paidBills.forEach((row: any) => {
      const sub = row.subscriptions
      if (!sub) return

      if (sub.customer_id) {
        normalSubscribedCustomerIds.add(sub.customer_id)
      }

      mappedNormalData.push({
        id: sub.id,
        subscription_id: sub.id,
        customer_id: sub.customer_id,
        start_date: sub.start_date || 'N/A',
        end_date: sub.end_date || null,
        status: sub.status === 'paused' ? 'paused' : 'active',
        payment_status: 'paid',
        quantity_litres: Number(sub.quantity_litres) || 0,
        daily_rate: Number(sub.daily_rate) || 0,
        monthly_amount: Number(row.monthly_amount || sub.monthly_amount) || 0,
        amount_paid: Number(row.amount_paid) || 0,
        plan_type: sub.plan_type || 'monthly',
        is_trial: false,
        profiles: sub.profiles || { full_name: 'Unknown', phone: '' }
      })
    })
  }

  const isCurrentSelectedMonth = selectedMonth === currentMonthStr

  const mappedTrialData: any[] = []
  if (trialSubs) {
    trialSubs.forEach((sub: any) => {
      // Do not duplicate if customer has already converted to normal paid subscription for this month
      if (sub.customer_id && normalSubscribedCustomerIds.has(sub.customer_id)) {
        return
      }

      const tStartObj = sub.start_date ? new Date(sub.start_date) : new Date()
      const tEndObj = sub.end_date ? new Date(sub.end_date) : new Date(tStartObj.getTime() + 3 * 86400000)

      // Format trial bounds in IST YYYY-MM-DD
      const tStartStr = formatInTimeZone(tStartObj, 'Asia/Kolkata', 'yyyy-MM-dd')
      const tEndStr = formatInTimeZone(tEndObj, 'Asia/Kolkata', 'yyyy-MM-dd')

      // Trial visibility rules:
      // 1. Must overlap the selected month's date boundary
      const overlapsMonth = tStartObj <= monthEndDate && tEndObj >= monthStartDate

      if (!overlapsMonth) return

      // 2. For the CURRENT selected month, trial is active if and only if todayIST <= trial_end_date (inclusive)
      if (isCurrentSelectedMonth) {
        const isTrialCurrentlyActive = todayISTStr >= tStartStr && todayISTStr <= tEndStr
        if (!isTrialCurrentlyActive) {
          // Trial period has ended and customer has not converted to normal paid subscription -> EXCLUDE
          return
        }
      }

      mappedTrialData.push({
        id: sub.id,
        subscription_id: sub.id,
        customer_id: sub.customer_id,
        start_date: sub.start_date || 'N/A',
        end_date: sub.end_date || null,
        status: 'trial',
        payment_status: 'paid',
        quantity_litres: Number(sub.quantity_litres) || 0,
        daily_rate: Number(sub.daily_rate) || 0,
        monthly_amount: Number(sub.monthly_amount) || 0,
        amount_paid: Number(sub.monthly_amount) || 0,
        plan_type: 'trial',
        is_trial: true,
        profiles: sub.profiles || { full_name: 'Unknown', phone: '' }
      })
    })
  }

  const combinedData = [...mappedNormalData, ...mappedTrialData]

  return <SubscriptionsClient data={combinedData} currentMonth={selectedMonth} />
}
