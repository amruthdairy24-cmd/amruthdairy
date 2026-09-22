import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkIsAdmin } from '@/lib/utils';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(user))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }

    // Step 1: Clean up child records in dependency order to prevent FK violations
    // A. Payments (foreign keys: billing_month_id, subscription_id, customer_id)
    await adminClient.from('payments').delete().eq('customer_id', id);

    // B. Daily deliveries
    await adminClient.from('daily_delivery_sheet').delete().eq('customer_id', id);

    // C. Billing adjustments
    await adminClient.from('billing_adjustments').delete().eq('customer_id', id);

    // D. Billing months
    await adminClient.from('billing_months').delete().eq('customer_id', id);

    // E. Skip requests
    await adminClient.from('skip_requests').delete().eq('customer_id', id);

    // F. Extra milk orders
    await adminClient.from('extra_milk_orders').delete().eq('customer_id', id);

    // G. Product orders
    await adminClient.from('product_orders').delete().eq('customer_id', id);

    // H. Subscriptions
    await adminClient.from('subscriptions').delete().eq('customer_id', id);

    // I. Referrals
    await adminClient.from('referrals').delete().or(`referrer_id.eq.${id},referee_id.eq.${id}`);

    // J. Farm visits
    await adminClient.from('farm_visits').delete().eq('customer_id', id);

    // Step 2: Delete from profiles table
    const { error: profileDeleteError } = await adminClient.from('profiles').delete().eq('id', id);
    if (profileDeleteError) {
      console.error('[admin/customers DELETE] Profile delete error:', profileDeleteError.message);
      return NextResponse.json({ success: false, message: `Failed to delete customer: ${profileDeleteError.message}` }, { status: 500 });
    }

    // Step 3: Delete user from authentication
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);
    if (deleteAuthError) {
      console.warn('[admin/customers DELETE] Auth user delete error (user may only exist in profiles):', deleteAuthError.message);
    }

    return NextResponse.json({ success: true, message: 'Customer and all associated records deleted successfully' });
  } catch (err: unknown) {
    console.error('[admin/customers DELETE] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
