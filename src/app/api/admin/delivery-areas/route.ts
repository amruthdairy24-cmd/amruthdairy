import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (!profile || profile.role !== 'admin') return { error: 'Forbidden' }
  return { supabase }
}

export async function GET() {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 403 })

    const { data, error } = await auth.supabase
      .from('delivery_areas')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, areas: data })
  } catch (error) {
    console.error('Admin delivery areas GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 403 })

    const body = await req.json()
    const { name, is_active } = body
    if (!name) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 })

    const { data, error } = await auth.supabase
      .from('delivery_areas')
      .insert([{ name, is_active: is_active ?? true }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, area: data })
  } catch (error: any) {
    console.error('Admin delivery areas POST error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 403 })

    const body = await req.json()
    const { id, name, is_active } = body
    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await auth.supabase
      .from('delivery_areas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, area: data })
  } catch (error: any) {
    console.error('Admin delivery areas PUT error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await checkAdmin()
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 })

    const { error } = await auth.supabase
      .from('delivery_areas')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin delivery areas DELETE error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 })
  }
}
