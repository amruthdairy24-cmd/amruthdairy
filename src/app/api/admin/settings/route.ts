import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * GET /api/admin/settings?key=price_per_litre
 * Public read — anyone can fetch pricing info.
 *
 * PUT /api/admin/settings
 * Admin-only write — update a setting value.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const adminClient = createAdminClient();
    
    if (key) {
      const { data, error } = await adminClient
        .from('app_settings')
        .select('key, value, updated_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, message: `Setting '${key}' not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        key: data.key,
        value: data.value,
        updated_at: data.updated_at,
      });
    } else {
      const { data, error } = await adminClient
        .from('app_settings')
        .select('key, value, description, updated_at');

      if (error) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch settings' },
          { status: 500 }
        );
      }
      
      const settings = data.map((item) => {
        let parsedValue = item.value;
        try {
          parsedValue = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        } catch(e) {}
        return { ...item, value: parsedValue };
      });

      return NextResponse.json({
        success: true,
        settings
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/settings GET] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Role check
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden — admin access required' },
        { status: 403 }
      );
    }

    // Business logic
    const body = await request.json();

    // Batch update support
    if (Array.isArray(body)) {
      const updates = body.map((item: any) => ({
        key: item.key,
        value: item.value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await adminClient
        .from('app_settings')
        .upsert(updates, { onConflict: 'key' })
        .select();

      if (error) {
        console.error('[admin/settings PUT] Batch update error:', error.message);
        return NextResponse.json(
          { success: false, message: 'Failed to batch update settings' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        settings: data,
        message: 'Settings batch updated successfully',
      });
    }

    // Single update support
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, message: 'key and value are required' },
        { status: 400 }
      );
    }

    // Validate milk_tier_prices specifically
    if (key === 'milk_tier_prices') {
      const prices = value?.prices;
      if (!prices || typeof prices !== 'object') {
        return NextResponse.json(
          { success: false, message: 'milk_tier_prices must contain a valid prices object' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await adminClient
      .from('app_settings')
      .upsert(
        {
          key,
          value,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      console.error('[admin/settings PUT] Update error:', error.message);
      return NextResponse.json(
        { success: false, message: 'Failed to update setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      key: data.key,
      value: data.value,
      message: `Setting '${key}' updated successfully`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/settings PUT] Exception:', message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
