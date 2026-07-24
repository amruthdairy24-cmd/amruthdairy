import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const {
      full_name,
      email,
      phone,
      area,
      address,
      skip_otp
    } = await request.json();

    if (!full_name || !email) {
      return NextResponse.json({ success: false, message: 'Full name and email are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const defaultPassword = 'Amruth@1234';

    const adminClient = createAdminClient();

    // Check if auth user already exists
    const { data: listData } = await adminClient.auth.admin.listUsers();
    let authUserId: string;

    const existingAuthUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower
    );

    if (existingAuthUser) {
      // Update password and confirm email if they want to skip OTP
      await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
        password: defaultPassword,
        email_confirm: skip_otp === true,
      });
      authUserId = existingAuthUser.id;
    } else {
      // Create brand new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: emailLower,
        password: defaultPassword,
        email_confirm: skip_otp === true,
      });

      if (createError || !newUser?.user) {
        console.error('[admin/customers/add] Create user error:', createError?.message);
        return NextResponse.json(
          { success: false, message: createError?.message || 'Failed to create account.' },
          { status: 500 }
        );
      }
      authUserId = newUser.user.id;
    }

    // Upsert profile
    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: authUserId,
        email: emailLower,
        username: full_name,
        full_name: full_name,
        phone: phone || null,
        area: area || null,
        address: address || null,
        role: 'customer',
        is_active: true,
        email_verified: skip_otp === true,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.error('[admin/customers/add] Profile upsert error:', profileError.message);
      // Clean up the auth user if profile creation fails and it was a new user
      if (!existingAuthUser) {
        await adminClient.auth.admin.deleteUser(authUserId);
      }
      return NextResponse.json(
        { success: false, message: 'Failed to create customer profile.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Customer added successfully' });

  } catch (err: unknown) {
    console.error('[admin/customers/add] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
