import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

export async function GET() {
  try {
    const { data: products, error } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Products fetch error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
    }

    // Return exactly what is in the database — no fallbacks, no seed data.
    // Admin adds/removes products from the admin panel and that is the source of truth.
    return NextResponse.json({ success: true, products: products ?? [] });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Products API exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
