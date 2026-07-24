import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

/**
 * GET /api/admin/system-settings
 * Admin-only read of all system settings
 * 
 * PUT /api/admin/system-settings
 * Admin-only write/update of system settings
 */

export async function GET() {
  try {
    // 1. Auth check
    const supabase = await createClient(); // userClient
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Role check
    if (!isAdminEmail(user.email)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden — admin access required' },
        { status: 403 }
      );
    }

    // 3. Business logic — fetching settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value, description, updated_at');

    if (error) {
      console.error('[admin/system-settings GET] Error:', error.message);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch system settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/system-settings GET] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient(); // userClient
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Role check
    if (!isAdminEmail(user.email)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden — admin access required' },
        { status: 403 }
      );
    }

    // 3. Business logic — updating settings using adminClient for writes
    const body = await request.json();
    const adminClient = createAdminClient(); // adminClient for writes

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Support both single update { key, value } and batch update [ { key, value } ]
    const itemsToUpdate = Array.isArray(body) ? body : [body];

    if (itemsToUpdate.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No settings to update' },
        { status: 400 }
      );
    }

    const updates = itemsToUpdate.map((item: any) => {
      if (!item.key || item.value === undefined) {
        throw new Error('Key and value are required for all settings');
      }

      // Format value as JSONB structure
      let jsonValue = item.value;
      
      return {
        key: item.key,
        value: jsonValue,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };
    });

    const { data, error } = await adminClient
      .from('system_settings')
      .upsert(updates, { onConflict: 'key' })
      .select();

    if (error) {
      console.error('[admin/system-settings PUT] Error:', error.message);
      return NextResponse.json(
        { success: false, message: 'Failed to update system settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings: data
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/system-settings PUT] Exception:', message);
    return NextResponse.json(
      { success: false, message: message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
