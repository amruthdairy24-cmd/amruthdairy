import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const adminClient = createAdminClient();
    
    // Fetch products ordered by display_order
    const { data, error } = await adminClient
      .from('products')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data
    });
  } catch (err: unknown) {
    console.error('[admin/products GET] Exception:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, price, unit, stock_available, is_active } = body;

    if (!name || !price || !unit) {
      return NextResponse.json({ success: false, message: 'Name, price and unit are required' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('products')
      .insert({
        name,
        description,
        category: category || 'other',
        price,
        unit,
        stock_available: stock_available || 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/products POST] Create error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data, message: 'Product created successfully' });
  } catch (err: unknown) {
    console.error('[admin/products POST] Exception:', err);
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

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, category, price, unit, stock_available, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('products')
      .update({
        name,
        description,
        category,
        price,
        unit,
        stock_available,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin/products PUT] Update error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data, message: 'Product updated successfully' });
  } catch (err: unknown) {
    console.error('[admin/products PUT] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/products DELETE] Delete error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: unknown) {
    console.error('[admin/products DELETE] Exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
