import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdminEmail } from '@/lib/utils';

const MODERN_PRODUCT_CATEGORIES = new Set([
  'milk',
  'curd',
  'ghee',
  'buttermilk',
  'paneer',
  'butter',
  'honey',
  'dairy',
  'other',
]);

const LEGACY_PRODUCT_CATEGORIES = new Set([
  'ghee',
  'honey',
  'butter',
  'dairy',
  'other',
]);

function normalizeCategory(category: unknown, legacy = false) {
  const raw = typeof category === 'string' ? category.trim().toLowerCase() : '';
  if (!raw) return 'other';

  if (legacy) {
    if (LEGACY_PRODUCT_CATEGORIES.has(raw)) return raw;
    if (raw === 'milk' || raw === 'curd' || raw === 'paneer' || raw === 'buttermilk') {
      return 'dairy';
    }
    return 'other';
  }

  return MODERN_PRODUCT_CATEGORIES.has(raw) ? raw : 'other';
}

function isLegacySchemaError(err: { message: string; code?: string }) {
  const msg = err.message.toLowerCase();
  return (
    err.code === '42703' ||
    err.code === '23514' ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    msg.includes('products_category_check') ||
    msg.includes('check constraint')
  );
}

function isForeignKeyViolation(err: { code?: string; message: string }) {
  return err.code === '23503' || /foreign key/i.test(err.message);
}

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

function buildProductPayload(body: Record<string, unknown>, legacy = false) {
  const stockVal = Number(body.stock_available ?? 0);

  const payload: Record<string, unknown> = {
    name: body.name,
    category: normalizeCategory(body.category, legacy),
    price: Number(body.price),
    unit: body.unit,
    is_active: body.is_active !== false,
    image_url: body.image_url || null,
    stock: stockVal,
  };

  if (!legacy) {
    payload.stock_available = stockVal;
    payload.badge = body.badge || null;
    payload.badge_icon = body.badge_icon || null;
    payload.tagline = body.tagline || null;
    payload.features = body.features || [];
    payload.features_icons = body.features_icons || [];
    payload.is_subscription = Boolean(body.is_subscription);
    payload.display_order = body.display_order != null ? Number(body.display_order) : null;
  }

  return payload;
}

function buildProductPatch(body: Record<string, unknown>, legacy = false) {
  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) patch.category = normalizeCategory(body.category, legacy);
  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.unit !== undefined) patch.unit = body.unit;
  if (body.stock_available !== undefined) {
    const stockVal = Number(body.stock_available);
    patch.stock = stockVal;
    if (!legacy) patch.stock_available = stockVal;
  }
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
  if (body.image_url !== undefined) patch.image_url = body.image_url || null;

  if (!legacy) {
    if (body.badge !== undefined) patch.badge = body.badge || null;
    if (body.badge_icon !== undefined) patch.badge_icon = body.badge_icon || null;
    if (body.tagline !== undefined) patch.tagline = body.tagline || null;
    if (body.features !== undefined) patch.features = body.features || [];
    if (body.features_icons !== undefined) patch.features_icons = body.features_icons || [];
    if (body.is_subscription !== undefined) patch.is_subscription = Boolean(body.is_subscription);
    if (body.display_order !== undefined) {
      patch.display_order = body.display_order != null ? Number(body.display_order) : null;
    }
  }

  return patch;
}

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

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const { name, price, unit } = body;

    if (!name || price === undefined || price === '' || !unit) {
      return NextResponse.json(
        { success: false, message: 'name, price and unit are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let result = await admin
      .from('products')
      .insert(buildProductPayload(body, false))
      .select()
      .single();

    if (result.error && isLegacySchemaError(result.error)) {
      console.warn('[products POST] retrying with legacy-compatible payload:', result.error.message);
      result = await admin
        .from('products')
        .insert(buildProductPayload(body, true))
        .select()
        .single();
    }

    if (result.error) {
      console.error('[products POST]', result.error.message, result.error.code);
      return NextResponse.json(pgError(result.error), { status: 500 });
    }

    return NextResponse.json({ success: true, product: result.data, message: 'Product created' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[products POST] exception:', msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const fullPatch = buildProductPatch(body, false);
    let result = await admin
      .from('products')
      .update(fullPatch)
      .eq('id', id)
      .select()
      .single();

    if (result.error && isLegacySchemaError(result.error)) {
      const legacyPatch = buildProductPatch(body, true);
      if (Object.keys(legacyPatch).length > 0) {
        console.warn('[products PUT] retrying with legacy-compatible payload:', result.error.message);
        result = await admin
          .from('products')
          .update(legacyPatch)
          .eq('id', id)
          .select()
          .single();
      }
    }

    if (result.error) {
      console.error('[products PUT]', result.error.message, result.error.code);
      return NextResponse.json(pgError(result.error), { status: 500 });
    }

    return NextResponse.json({ success: true, product: result.data, message: 'Product updated' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[products PUT] exception:', msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

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
      if (isForeignKeyViolation(error)) {
        const { error: archiveError } = await admin
          .from('products')
          .update({ is_active: false })
          .eq('id', id);

        if (archiveError) {
          console.error('[products DELETE archive fallback]', archiveError.message, archiveError.code);
          return NextResponse.json(pgError(archiveError), { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Product is linked to existing orders, so it was archived instead of deleted.',
        });
      }

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
