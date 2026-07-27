import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Forward the real Postgres error so failures are diagnosable. */
function pgError(err: { message: string; code?: string; details?: string; hint?: string }) {
  return {
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && {
      pg_code: err.code,
      pg_details: err.details,
      pg_hint: err.hint,
    }),
  };
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, message: 'Unauthorized' };

  if (!isAdminEmail(user.email)) return { ok: false as const, status: 403, message: 'Forbidden' };
  return { ok: true as const };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('products')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[products GET]', error.message);
      return NextResponse.json(pgError(error), { status: 500 });
    }

    // Normalise: map DB `stock` → `stock_available` for rows that predate the migration.
    const products = (data || []).map((p: any) => ({
      ...p,
      stock_available: p.stock_available ?? p.stock ?? 0,
      features: p.features ?? [],
      features_icons: p.features_icons ?? [],
      is_subscription: p.is_subscription ?? false,
    }));

    return NextResponse.json({ success: true, products });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[products GET] exception:', msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const {
      name, category, price, unit,
      stock_available,
      is_active,
      image_url,
      badge, badge_icon, tagline,
      features, features_icons,
      is_subscription,
      display_order,
    } = body;

    if (!name || price === undefined || price === '' || !unit) {
      return NextResponse.json(
        { success: false, message: 'name, price and unit are required' },
        { status: 400 }
      );
    }

    const stockVal = Number(stock_available ?? 0);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('products')
      .insert({
        name,
        category: category || 'other',
        price: Number(price),
        unit,
        // Write to both columns so existing callers (decrement_stock RPC) keep working
        stock: stockVal,
        stock_available: stockVal,
        is_active: is_active !== false,
        image_url: image_url || null,
        badge: badge || null,
        badge_icon: badge_icon || null,
        tagline: tagline || null,
        features: features || [],
        features_icons: features_icons || [],
        is_subscription: Boolean(is_subscription),
        display_order: display_order != null ? Number(display_order) : null,
      })
      .select()
      .single();

    if (error) {
      console.error('[products POST]', error.message, error.code);
      return NextResponse.json(pgError(error), { status: 500 });
    }

    return NextResponse.json({ success: true, product: data, message: 'Product created' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[products POST] exception:', msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const {
      id, name, category, price, unit,
      stock_available,
      is_active,
      image_url,
      badge, badge_icon, tagline,
      features, features_icons,
      is_subscription,
      display_order,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    // Build update payload — only include keys that were explicitly sent
    const patch: Record<string, unknown> = {};
    if (name !== undefined)            patch.name            = name;
    if (category !== undefined)        patch.category        = category;
    if (price !== undefined)           patch.price           = Number(price);
    if (unit !== undefined)            patch.unit            = unit;
    if (stock_available !== undefined) {
      const s = Number(stock_available);
      patch.stock           = s;
      patch.stock_available = s;
    }
    if (is_active !== undefined)       patch.is_active       = Boolean(is_active);
    if (image_url !== undefined)       patch.image_url       = image_url || null;
    if (badge !== undefined)           patch.badge           = badge || null;
    if (badge_icon !== undefined)      patch.badge_icon      = badge_icon || null;
    if (tagline !== undefined)         patch.tagline         = tagline || null;
    if (features !== undefined)        patch.features        = features || [];
    if (features_icons !== undefined)  patch.features_icons  = features_icons || [];
    if (is_subscription !== undefined) patch.is_subscription = Boolean(is_subscription);
    if (display_order !== undefined)   patch.display_order   = display_order != null ? Number(display_order) : null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[products PUT]', error.message, error.code);
      return NextResponse.json(pgError(error), { status: 500 });
    }

    return NextResponse.json({ success: true, product: data, message: 'Product updated' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[products PUT] exception:', msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('products').delete().eq('id', id);

    if (error) {
      console.error('[products DELETE]', error.message);
      return NextResponse.json(pgError(error), { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[products DELETE] exception:', msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
