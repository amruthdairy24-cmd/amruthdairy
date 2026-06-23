import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

export async function GET() {
  try {
    // Auth check — products require login
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: products, error } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Products fetch error:', error.message);
      return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
    }

    if (!products || products.length === 0) {
      const seedProducts = [
        {
          name: 'Fresh Curd',
          description: 'Creamy, thick set curd made from pure A2 cow milk. Rich in natural probiotics and good for gut health.',
          price: 40.00,
          unit: '500ml',
          category: 'dairy',
          image_url: '/images/amruth_product_curd.png',
          is_active: true,
          stock: 100
        },
        {
          name: 'Pure Cow Ghee',
          description: 'Traditional Bilona ghee churned from fresh A2 cow milk. Rich aroma, granular texture, and loaded with healthy fats.',
          price: 450.00,
          unit: '500ml',
          category: 'ghee',
          image_url: '/images/amruth_product_ghee.png',
          is_active: true,
          stock: 100
        },
        {
          name: 'Fresh Paneer',
          description: 'Soft, pure, and rich in protein. Made fresh daily from pure whole A2 milk with zero preservatives.',
          price: 90.00,
          unit: '200gm',
          category: 'dairy',
          image_url: '/images/amruth_product_paneer.png',
          is_active: true,
          stock: 100
        },
        {
          name: 'Buttermilk',
          description: 'Cool, light, and refreshing traditional buttermilk blended with mild spices and herbs for perfect digestion.',
          price: 30.00,
          unit: '500ml',
          category: 'dairy',
          image_url: '/images/amruth_product_buttermilk.png',
          is_active: true,
          stock: 100
        },
        {
          name: 'Raw Farm Honey',
          description: '100% pure, raw, and unfiltered honey sourced directly from local organic farms. Natural sweetness in every drop.',
          price: 180.00,
          unit: '250g',
          category: 'honey',
          image_url: null,
          is_active: true,
          stock: 50
        },
        {
          name: 'Fresh Churned Butter',
          description: 'Rich, creamy unsalted white butter hand-churned from pure cow milk cream. Traditional homestyle taste.',
          price: 120.00,
          unit: '200g',
          category: 'butter',
          image_url: null,
          is_active: true,
          stock: 60
        }
      ];

      const { data: seeded, error: seedError } = await adminSupabase
        .from('products')
        .insert(seedProducts)
        .select();

      if (!seedError && seeded) {
        return NextResponse.json({ success: true, products: seeded });
      }
    }

    return NextResponse.json({ success: true, products: products || [] });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Products API exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
