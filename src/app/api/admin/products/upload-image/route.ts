import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { randomUUID } from 'crypto'

const BUCKET = 'product-images'

/** Ensure the storage bucket exists with public read access. */
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = (buckets || []).some((b: { name: string }) => b.name === BUCKET)
  if (!exists) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    })
  }
}

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    // Parse file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    // Validate type & size
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only JPEG, PNG, WEBP, or GIF images are allowed' },
        { status: 400 }
      )
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File must be under 5 MB' },
        { status: 400 }
      )
    }

    await ensureBucket(admin)

    // Build unique path
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
    const path = `products/${randomUUID()}-${safeName}`

    const buffer = new Uint8Array(await file.arrayBuffer())
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadErr) {
      console.error('[upload-image]', uploadErr.message)
      return NextResponse.json({ success: false, message: uploadErr.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ success: true, url: urlData.publicUrl, path })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[upload-image] exception:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
