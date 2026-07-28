import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { randomUUID } from 'crypto'
import { checkIsAdmin } from '@/lib/utils'

const BUCKET = 'hero-banners'

/** Ensure the storage bucket exists with public read access. */
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  try {
    const { data: buckets } = await admin.storage.listBuckets()
    const exists = (buckets || []).some((b: { name: string }) => b.name === BUCKET)
    if (!exists) {
      await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      })
    }
  } catch (err) {
    console.error('[hero-banners/upload] ensureBucket error:', err)
  }
}

export async function POST(request: Request) {
  try {
    // 1. Auth check (userClient / createClient)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // 2. Role check
    if (!(await checkIsAdmin(user))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    // 3. Business logic using adminClient for writes
    const admin = createAdminClient()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const targetType = (formData.get('target') as string) || 'desktop' // 'desktop' or 'mobile'

    if (!file) {
      return NextResponse.json({ success: false, message: 'No image file provided' }, { status: 400 })
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only JPEG, PNG, WEBP, GIF, or SVG images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be under 10 MB' },
        { status: 400 }
      )
    }

    await ensureBucket(admin)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
    const path = `${targetType}/${randomUUID()}-${safeName}`

    const buffer = new Uint8Array(await file.arrayBuffer())
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) {
      console.error('[hero-banners/upload] upload error:', uploadErr.message)
      return NextResponse.json({ success: false, message: uploadErr.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
      targetType
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[hero-banners/upload] exception:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
