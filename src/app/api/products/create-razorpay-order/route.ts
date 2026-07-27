import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import Razorpay from 'razorpay';

const adminSupabase = createAdminClient();

interface CartItemInput {
  product_id: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    const productIds = items.map((item: CartItemInput) => item.product_id);
    const { data: products, error: productsError } = await adminSupabase
      .from('products')
      .select('id, name, price, stock, is_active')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json({ success: false, message: 'Failed to validate products' }, { status: 500 });
    }

    let totalAmount = 0;

    for (const item of items as CartItemInput[]) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return NextResponse.json({ success: false, message: `Product not found` }, { status: 400 });
      }
      if (!product.is_active) {
        return NextResponse.json({ success: false, message: `${product.name} is currently unavailable` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ success: false, message: `Only ${product.stock} units of ${product.name} available` }, { status: 400 });
      }

      totalAmount += Math.round(product.price * item.quantity * 100) / 100;
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order amount' }, { status: 400 });
    }

    const rawKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    const keyId = rawKeyId.replace(/^["']|["']$/g, '').trim();
    const keySecret = rawKeySecret.replace(/^["']|["']$/g, '').trim();

    if (!keyId || !keySecret) {
      return NextResponse.json({
        success: false,
        message: 'Razorpay keys not configured in .env.local (NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET required)'
      }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const amountInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      notes: {
        order_type: 'standalone_product',
        items_count: items.length
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const errorDetails = err?.error?.description || err?.message || 'Authentication failed';
    console.error('Create Razorpay Order Exception:', err);
    return NextResponse.json({
      success: false,
      message: `Razorpay API Error: ${errorDetails}. Please verify your NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local and restart server.`
    }, { status: 400 });
  }
}
