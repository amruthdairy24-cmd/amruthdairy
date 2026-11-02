/**
 * Payment Reconciliation — safety net for "customer paid, app still shows pending".
 *
 * Why this exists:
 *  - Normal flow: browser handler → /api/payments/verify marks the bill paid.
 *  - Backup flow: Razorpay webhook → /api/webhooks/razorpay.
 *  - On mobile, switching to GPay/PhonePe often kills the browser page (handler never runs),
 *    and if the webhook is misconfigured the payment is NEVER recorded.
 *
 * This module asks Razorpay directly "was this order paid?" and, if yes, marks the
 * EXACT bill the order was created for as paid. It is idempotent and race-safe:
 *  - Only bills that are not already 'paid' are touched (conditional update).
 *  - A payment is never inserted twice (checked by razorpay_payment_id / order_id).
 *  - Only 'captured' payments count (money actually received).
 *  - If the paid amount is LESS than the bill's net due, nothing is changed — it is
 *    reported for admin review instead.
 */
import Razorpay from 'razorpay'
import type { SupabaseClient } from '@supabase/supabase-js'
import { processPendingReferralReward } from '@/lib/referral'

export type ReconcileOutcome =
  | 'marked_paid'        // Razorpay says paid → bill marked paid now
  | 'not_paid'           // Razorpay says not paid → nothing changed
  | 'amount_short'       // Paid less than net due → needs admin review
  | 'duplicate_payment'  // Paid, but bill was already paid by another payment → possible refund
  | 'unmatched_paid'     // Paid order with no matching bill (e.g. product order) → admin review
  | 'error'

export interface ReconcileItem {
  outcome: ReconcileOutcome
  order_id: string
  payment_id?: string
  amount_paid?: number
  billing_month_id?: string
  billing_month?: string
  customer_id?: string
  net_due?: number
  receipt?: string
  message?: string
}

export interface ReconcileSummary {
  checked: number
  fixed: number
  items: ReconcileItem[]
}

type BillRow = {
  id: string
  customer_id: string
  subscription_id: string | null
  billing_month: string
  net_due: number | string
  amount_paid: number | string
  payment_status: string
}

const BILL_COLUMNS = 'id, customer_id, subscription_id, billing_month, net_due, amount_paid, payment_status'

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return null
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

/** Returns the first CAPTURED payment for an order (money actually received), if any. */
async function getCapturedPayment(rzp: Razorpay, orderId: string): Promise<any | null> {
  const res: any = await rzp.orders.fetchPayments(orderId)
  const items: any[] = res?.items || []
  return items.find((p) => p.status === 'captured') || null
}

/**
 * Find the exact bill an order was created for.
 *  1. Bill payment orders     → notes.billing_month_id
 *  2. Renewal orders          → notes.subscription_id + notes.target_month
 *  3. New subscription orders → subscription.razorpay_subscription_id = order id (single bill)
 */
async function resolveBillForOrder(admin: SupabaseClient, order: any): Promise<BillRow | null> {
  const notes = order?.notes || {}

  if (notes.billing_month_id) {
    const { data } = await admin.from('billing_months').select(BILL_COLUMNS).eq('id', notes.billing_month_id).maybeSingle()
    return (data as BillRow) || null
  }

  if (notes.subscription_id && notes.target_month) {
    const { data } = await admin
      .from('billing_months')
      .select(BILL_COLUMNS)
      .eq('subscription_id', notes.subscription_id)
      .eq('billing_month', notes.target_month)
      .maybeSingle()
    return (data as BillRow) || null
  }

  const { data: sub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', order.id)
    .maybeSingle()
  if (sub) {
    const { data } = await admin
      .from('billing_months')
      .select(BILL_COLUMNS)
      .eq('subscription_id', sub.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as BillRow) || null
  }
  return null
}

async function paymentAlreadyRecorded(admin: SupabaseClient, orderId: string, paymentId: string): Promise<boolean> {
  const { data } = await admin
    .from('payments')
    .select('id')
    .eq('status', 'success')
    .or(`razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId}`)
    .limit(1)
  return !!(data && data.length > 0)
}

/** Mark a bill paid exactly like /api/payments/verify does, but race-safe. Returns true if this call did it. */
async function markBillPaid(
  admin: SupabaseClient,
  bill: BillRow,
  payment: { orderId: string; paymentId: string; amount: number; method: string; paidAtUnix?: number }
): Promise<boolean> {
  // Conditional update — if verify/webhook already marked it paid, this updates 0 rows.
  const { data: updated, error } = await admin
    .from('billing_months')
    .update({
      amount_paid: Number(bill.amount_paid || 0) + payment.amount,
      net_due: 0,
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bill.id)
    .neq('payment_status', 'paid')
    .select('id')

  if (error) throw new Error(`Failed to update bill ${bill.id}: ${error.message}`)
  if (!updated || updated.length === 0) return false

  if (!(await paymentAlreadyRecorded(admin, payment.orderId, payment.paymentId))) {
    await admin.from('payments').insert({
      customer_id: bill.customer_id,
      subscription_id: bill.subscription_id,
      billing_month_id: bill.id,
      amount: payment.amount,
      payment_type: 'subscription',
      method: payment.method || 'upi',
      status: 'success',
      razorpay_order_id: payment.orderId,
      razorpay_payment_id: payment.paymentId,
      is_manual: false,
      manual_note: 'Auto-reconciled from Razorpay (browser callback/webhook missed)',
      paid_at: payment.paidAtUnix ? new Date(payment.paidAtUnix * 1000).toISOString() : new Date().toISOString(),
    })
  }

  // Apply carry-forward credits for this month (same rule as /api/payments/verify fallback)
  let adjQuery = admin
    .from('billing_adjustments')
    .update({ is_applied: true })
    .eq('target_month', bill.billing_month)
    .eq('is_applied', false)
  adjQuery = bill.subscription_id
    ? adjQuery.or(`customer_id.eq.${bill.customer_id},subscription_id.eq.${bill.subscription_id}`)
    : adjQuery.eq('customer_id', bill.customer_id)
  await adjQuery

  if (bill.subscription_id) {
    await admin
      .from('extra_milk_orders')
      .update({ status: 'paid' })
      .eq('subscription_id', bill.subscription_id)
      .eq('charge_month', bill.billing_month)
      .eq('status', 'confirmed')

    await admin
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', bill.subscription_id)
      .eq('status', 'pending_payment')
  }

  try {
    await processPendingReferralReward(admin, bill.customer_id)
  } catch (err) {
    console.warn('[reconcile] referral reward warning:', err)
  }
  return true
}

/**
 * Check one Razorpay order and settle its bill if it was paid.
 * @param expectedBillId - if given, only settle when the order belongs to this bill (prevents wrong-month marking)
 */
export async function reconcileOrder(
  admin: SupabaseClient,
  rzp: Razorpay,
  orderId: string,
  expectedBillId?: string
): Promise<ReconcileItem> {
  try {
    const order: any = await rzp.orders.fetch(orderId)
    const captured = await getCapturedPayment(rzp, orderId)
    if (!captured) return { outcome: 'not_paid', order_id: orderId, receipt: order?.receipt }

    const amountPaid = Number(captured.amount) / 100
    const base: ReconcileItem = {
      outcome: 'not_paid',
      order_id: orderId,
      payment_id: captured.id,
      amount_paid: amountPaid,
      receipt: order?.receipt,
    }

    const bill = await resolveBillForOrder(admin, order)
    if (!bill) {
      const recorded = await paymentAlreadyRecorded(admin, orderId, captured.id)
      return recorded
        ? { ...base, outcome: 'not_paid', message: 'Paid and already recorded (non-subscription order)' }
        : { ...base, outcome: 'unmatched_paid', message: 'Paid in Razorpay but no matching bill found' }
    }
    if (expectedBillId && bill.id !== expectedBillId) {
      return { ...base, outcome: 'not_paid', message: 'Order belongs to a different bill' }
    }

    const billInfo = {
      billing_month_id: bill.id,
      billing_month: bill.billing_month,
      customer_id: bill.customer_id,
      net_due: Number(bill.net_due),
    }

    if (bill.payment_status === 'paid') {
      const recorded = await paymentAlreadyRecorded(admin, orderId, captured.id)
      return recorded
        ? { ...base, ...billInfo, outcome: 'not_paid', message: 'Already recorded' }
        : { ...base, ...billInfo, outcome: 'duplicate_payment', message: 'Bill already paid by another payment — check for refund' }
    }

    // Allow ₹1 rounding tolerance; never mark paid if the customer paid less than due.
    if (amountPaid + 1 < Number(bill.net_due)) {
      return { ...base, ...billInfo, outcome: 'amount_short', message: `Paid ₹${amountPaid} but bill due is ₹${bill.net_due}` }
    }

    const didMark = await markBillPaid(admin, bill, {
      orderId,
      paymentId: captured.id,
      amount: amountPaid,
      method: captured.method,
      paidAtUnix: captured.created_at,
    })
    return { ...base, ...billInfo, outcome: didMark ? 'marked_paid' : 'not_paid', message: didMark ? undefined : 'Already settled concurrently' }
  } catch (err: any) {
    return { outcome: 'error', order_id: orderId, message: err?.error?.description || err?.message || 'Unknown error' }
  }
}

/**
 * Check pending bills (optionally for one customer) against the order stored on their subscription.
 * Cheap: one Razorpay lookup per pending bill that has an order.
 */
export async function reconcilePendingBills(
  admin: SupabaseClient,
  rzp: Razorpay,
  opts: { customerId?: string } = {}
): Promise<ReconcileSummary> {
  // Only recent months (previous, current, next) — older bills are handled manually.
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01`

  let q = admin
    .from('billing_months')
    .select(BILL_COLUMNS)
    .neq('payment_status', 'paid')
    .gt('net_due', 0)
    .gte('billing_month', fromStr)
  if (opts.customerId) q = q.eq('customer_id', opts.customerId)
  const { data: bills } = await q

  const summary: ReconcileSummary = { checked: 0, fixed: 0, items: [] }
  if (!bills || bills.length === 0) return summary

  const subIds = [...new Set(bills.map((b: any) => b.subscription_id).filter(Boolean))]
  const { data: subs } = subIds.length
    ? await admin.from('subscriptions').select('id, razorpay_subscription_id').in('id', subIds)
    : { data: [] as any[] }
  const orderBySub = new Map<string, string>((subs || []).map((s: any) => [s.id, s.razorpay_subscription_id]))

  for (const bill of bills as BillRow[]) {
    const orderId = bill.subscription_id ? orderBySub.get(bill.subscription_id) : undefined
    if (!orderId || !orderId.startsWith('order_')) continue
    summary.checked++
    const item = await reconcileOrder(admin, rzp, orderId, bill.id)
    if (item.outcome === 'marked_paid') summary.fixed++
    if (item.outcome !== 'not_paid') summary.items.push(item)
  }
  return summary
}

/**
 * Full scan: every PAID Razorpay order in the last N days that has no payment record in the app.
 * Catches cases the bill-based check misses (e.g. customer opened Renew twice and paid the first order).
 */
export async function reconcileRecentOrders(
  admin: SupabaseClient,
  rzp: Razorpay,
  days = 3
): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { checked: 0, fixed: 0, items: [] }
  const to = Math.floor(Date.now() / 1000)
  const fromTs = to - Math.min(Math.max(days, 1), 15) * 24 * 60 * 60

  const paidOrders: any[] = []
  for (let skip = 0; skip < 2000; skip += 100) {
    const page: any = await rzp.orders.all({ from: fromTs, to, count: 100, skip })
    const items: any[] = page?.items || []
    paidOrders.push(...items.filter((o) => o.status === 'paid'))
    if (items.length < 100) break
  }

  for (const order of paidOrders) {
    const { data: existing } = await admin
      .from('payments')
      .select('id')
      .eq('razorpay_order_id', order.id)
      .eq('status', 'success')
      .limit(1)
    if (existing && existing.length > 0) continue

    summary.checked++
    const item = await reconcileOrder(admin, rzp, order.id)
    if (item.outcome === 'marked_paid') summary.fixed++
    if (item.outcome !== 'not_paid') summary.items.push(item)
  }
  return summary
}
