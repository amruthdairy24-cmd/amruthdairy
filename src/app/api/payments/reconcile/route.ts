import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkIsAdmin } from '@/lib/utils'
import {
  getRazorpayClient,
  reconcilePendingBills,
  reconcileRecentOrders,
  type ReconcileSummary,
} from '@/lib/payment-reconcile'

/**
 * Payment reconciliation — marks bills paid when Razorpay confirms payment but the
 * browser callback / webhook never reached us.
 *
 * Access:
 *  - Cron (GET or POST) with header `Authorization: Bearer <CRON_SECRET>` → full scan
 *  - Admin (POST) { customer_id? , scan_days? } → one customer, or full scan
 *  - Customer (POST) → only their own pending bills
 */
function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function fullScan(days: number): Promise<ReconcileSummary> {
  const admin = createAdminClient()
  const rzp = getRazorpayClient()!
  const bills = await reconcilePendingBills(admin, rzp)
  const orders = await reconcileRecentOrders(admin, rzp, days)
  return {
    checked: bills.checked + orders.checked,
    fixed: bills.fixed + orders.fixed,
    items: [...bills.items, ...orders.items],
  }
}

export async function GET(request: Request) {
  // Cron only
  if (!isCronRequest(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  if (!getRazorpayClient()) {
    return NextResponse.json({ success: false, message: 'Razorpay not configured' }, { status: 500 })
  }
  try {
    const summary = await fullScan(3)
    if (summary.fixed > 0) console.log(`[reconcile:cron] Fixed ${summary.fixed} stuck payment(s)`, summary.items)
    return NextResponse.json({ success: true, ...summary })
  } catch (err: any) {
    console.error('[reconcile:cron] exception:', err?.message || err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!getRazorpayClient()) {
      return NextResponse.json({ success: false, message: 'Razorpay not configured' }, { status: 500 })
    }

    // Cron path
    if (isCronRequest(request)) {
      const summary = await fullScan(3)
      return NextResponse.json({ success: true, ...summary })
    }

    // 1. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    let body: any = {}
    try { body = await request.json() } catch { body = {} }

    // 2. Role check
    const isAdmin = await checkIsAdmin(user)
    const admin = createAdminClient()
    const rzp = getRazorpayClient()!

    // 3. Business logic
    if (isAdmin) {
      if (body?.customer_id) {
        const summary = await reconcilePendingBills(admin, rzp, { customerId: String(body.customer_id) })
        return NextResponse.json({ success: true, ...summary })
      }
      const days = Number(body?.scan_days) || 3
      const summary = await fullScan(days)
      return NextResponse.json({ success: true, ...summary })
    }

    // Customer: only their own bills; don't leak details of other outcomes
    const summary = await reconcilePendingBills(admin, rzp, { customerId: user.id })
    return NextResponse.json({ success: true, checked: summary.checked, fixed: summary.fixed })
  } catch (err: any) {
    console.error('[reconcile] exception:', err?.message || err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

