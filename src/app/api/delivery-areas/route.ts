import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('delivery_areas')
      .select('name')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching delivery areas:', error)
      return NextResponse.json({ success: false, message: 'Failed to fetch delivery areas' }, { status: 500 })
    }

    const areas = data.map((d: any) => d.name)
    return NextResponse.json({ success: true, areas })
  } catch (error) {
    console.error('Delivery areas GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
