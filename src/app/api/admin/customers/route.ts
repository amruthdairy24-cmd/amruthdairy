import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required' }, { status: 400 });
    }

    // Delete user from authentication, which should cascade to profiles
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.warn('[admin/customers DELETE] Auth user not found or error:', deleteAuthError.message, 'falling back to direct profile deletion');
      
      const { error: profileDeleteError } = await adminClient.from('profiles').delete().eq('id', id);
      
      if (profileDeleteError) {
        console.error('[admin/customers DELETE] Profile delete error:', profileDeleteError.message);
        return NextResponse.json({ success: false, message: 'Failed to delete customer profile directly.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err: unknown) {
    console.error('[admin/customers DELETE] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
