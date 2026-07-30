import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { checkIsAdmin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || '';

    const adminSupabase = createAdminClient();
    
    let queryBuilder = adminSupabase
      .from('profiles')
      .select('id, full_name, phone, area, is_active')
      .eq('role', 'customer');

    if (query) {
      queryBuilder = queryBuilder.ilike('full_name', `%${query}%`);
    }

    const { data, error } = await queryBuilder.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let finalData = data;

    const { data: subs } = await adminSupabase
      .from('subscriptions')
      .select('customer_id')
      .in('customer_id', finalData.map(c => c.id));
    const subIds = new Set(subs?.map(s => s.customer_id) || []);
    
    finalData = finalData.map(c => ({
      ...c,
      has_subscription: subIds.has(c.id)
    }));

    // Filter unpaid manual customers
    if (filter === 'unpaid') {
      const { data: unpaidSubs } = await adminSupabase
        .from('subscriptions')
        .select('customer_id')
        .eq('status', 'active')
        .eq('razorpay_subscription_id', 'MANUAL_UNPAID');

      const unpaidCustomerIds = new Set(unpaidSubs?.map(s => s.customer_id) || []);
      finalData = finalData.filter(customer => unpaidCustomerIds.has(customer.id));
    }

    return NextResponse.json({ data: finalData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
