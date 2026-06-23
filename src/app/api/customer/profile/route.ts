import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Admin client bypasses RLS — needed when session cookie isn't yet propagated
const adminSupabase = createAdminClient();

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, address, area, landmark, floor_notes, role')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, address, area, landmark, floor_notes } = body;

    if (!full_name || !address || !area) {
      return NextResponse.json({ success: false, message: 'Full name, address, and area are required' }, { status: 400 });
    }

    // Use admin client with upsert so it works even if the row was just seeded
    // with minimal data and session cookie isn't fully propagated yet
    const { data: existing } = await adminSupabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();

    const { data: profile, error: updateError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: user.id,
        phone: existing?.phone ?? (user.phone ?? ''),
        full_name,
        address,
        area,
        landmark: landmark || null,
        floor_notes: floor_notes || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError.message);
      return NextResponse.json({ success: false, message: 'Failed to update profile details' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    });

  } catch (err: any) {
    console.error('Profile update route exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
