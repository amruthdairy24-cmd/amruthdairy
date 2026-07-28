import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkIsAdmin } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Helper for auth & role check
async function authorizeAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, status: 401, message: 'Unauthorized' }
  
  const isAdmin = await checkIsAdmin(user)
  if (!isAdmin) return { authorized: false, status: 403, message: 'Forbidden' }

  return { authorized: true, user }
}

// GET: List all hero banners
export async function GET() {
  try {
    // 1. Auth check -> 2. Role check
    const auth = await authorizeAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    // 3. Business logic (userClient for reads)
    const supabase = await createClient()
    const { data: banners, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[admin/hero-banners GET] DB query error:', error.message)
      const userMsg = error.message.includes('hero_banners') || error.code === 'PGRST205'
        ? "Database table 'hero_banners' does not exist in Supabase yet. Please run 'hero_banners_migration.sql' in your Supabase SQL Editor."
        : error.message
      return NextResponse.json({ success: false, message: userMsg, banners: [] }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      banners: banners ?? []
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin/hero-banners GET] Exception:', msg)
    return NextResponse.json({ success: false, message: msg, banners: [] }, { status: 500 })
  }
}

// POST: Add a new hero banner
export async function POST(request: Request) {
  try {
    // 1. Auth check -> 2. Role check
    const auth = await authorizeAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const body = await request.json()
    const { title, alt_text, desktop_image_url, mobile_image_url, link_url, display_order, is_active } = body

    if (!desktop_image_url || !mobile_image_url) {
      return NextResponse.json(
        { success: false, message: 'Both Desktop and Mobile images are required.' },
        { status: 400 }
      )
    }

    // 3. Business logic using adminClient for writes
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('hero_banners')
      .insert([
        {
          title: title || '',
          alt_text: alt_text || title || 'Amruth Dairy Hero Banner',
          desktop_image_url,
          mobile_image_url,
          link_url: link_url || '',
          display_order: parseInt(display_order, 10) || 0,
          is_active: is_active !== false,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[admin/hero-banners POST] Insert error:', error.message)
      const userMsg = error.message.includes('hero_banners') || error.code === 'PGRST205'
        ? "Database table 'hero_banners' does not exist in Supabase yet. Please run 'hero_banners_migration.sql' in your Supabase SQL Editor."
        : error.message
      return NextResponse.json({ success: false, message: userMsg }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: data?.[0] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin/hero-banners POST] Exception:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

// PUT: Update an existing hero banner
export async function PUT(request: Request) {
  try {
    // 1. Auth check -> 2. Role check
    const auth = await authorizeAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const body = await request.json()
    const { id, title, alt_text, desktop_image_url, mobile_image_url, link_url, display_order, is_active } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'Banner ID is required' }, { status: 400 })
    }

    // 3. Business logic using adminClient for writes
    const admin = createAdminClient()

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    if (title !== undefined) updatePayload.title = title
    if (alt_text !== undefined) updatePayload.alt_text = alt_text
    if (desktop_image_url !== undefined) updatePayload.desktop_image_url = desktop_image_url
    if (mobile_image_url !== undefined) updatePayload.mobile_image_url = mobile_image_url
    if (link_url !== undefined) updatePayload.link_url = link_url
    if (display_order !== undefined) updatePayload.display_order = parseInt(display_order, 10) || 0
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active)

    const { data, error } = await admin
      .from('hero_banners')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (error) {
      console.error('[admin/hero-banners PUT] Update error:', error.message)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: data?.[0] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin/hero-banners PUT] Exception:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

// DELETE: Delete a hero banner
export async function DELETE(request: Request) {
  try {
    // 1. Auth check -> 2. Role check
    const auth = await authorizeAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'Banner ID is required' }, { status: 400 })
    }

    // 3. Business logic using adminClient for writes
    const admin = createAdminClient()

    const { error } = await admin
      .from('hero_banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[admin/hero-banners DELETE] Delete error:', error.message)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Banner deleted successfully' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin/hero-banners DELETE] Exception:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
