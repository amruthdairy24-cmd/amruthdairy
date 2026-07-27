import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, mobile, address } = body;

    if (!name || !mobile || !address) {
      return NextResponse.json(
        { success: false, message: 'Name, mobile, and address are required.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('farm_visits')
      .insert([
        {
          name: name.trim(),
          mobile: mobile.trim(),
          address: address.trim(),
          status: 'pending'
        }
      ]);

    if (error) {
      console.error('Error inserting farm visit:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to submit request.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Visit request submitted successfully.' });
  } catch (error) {
    console.error('Farm visit POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
