import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

const adminSupabase = createAdminClient();

interface CartItem {
  product_id: string;
  quantity: number;
}

interface CustomerInfo {
  full_name: string;
  phone: string;
  delivery_address: string;
  area: string;
  landmark?: string;
  delivery_notes?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const {
      items,
      customer_info,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    if (!customer_info || !customer_info.full_name || !customer_info.phone || !customer_info.area || !customer_info.delivery_address) {
      return NextResponse.json({ success: false, message: 'Missing required customer address or contact information' }, { status: 400 });
    }

    // Verify Razorpay signature if payment details provided
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        console.error('[products/order] RAZORPAY_KEY_SECRET is missing');
        return NextResponse.json({ success: false, message: 'Server payment configuration error' }, { status: 500 });
      }

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Validate products and pricing
    const productIds = items.map((item: CartItem) => item.product_id);
    const { data: products, error: productsError } = await adminSupabase
      .from('products')
      .select('id, name, price, stock, is_active')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json({ success: false, message: 'Failed to validate products' }, { status: 500 });
    }

    const orderItems: { product_id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }[] = [];
    let totalAmount = 0;

    for (const cartItem of items as CartItem[]) {
      const product = products.find(p => p.id === cartItem.product_id);
      if (!product) {
        return NextResponse.json({ success: false, message: `Product not found` }, { status: 400 });
      }
      if (!product.is_active) {
        return NextResponse.json({ success: false, message: `${product.name} is currently unavailable` }, { status: 400 });
      }
      if (product.stock < cartItem.quantity) {
        return NextResponse.json({ success: false, message: `Only ${product.stock} units of ${product.name} available` }, { status: 400 });
      }

      const subtotal = Math.round(product.price * cartItem.quantity * 100) / 100;
      totalAmount += subtotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: cartItem.quantity,
        subtotal
      });
    }

    // Tomorrow as delivery date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDate = tomorrow.toISOString().split('T')[0];

    const fullNotes = `Name: ${customer_info.full_name} | Phone: ${customer_info.phone} | Area: ${customer_info.area} | Address: ${customer_info.delivery_address}${customer_info.landmark ? ` (Landmark: ${customer_info.landmark})` : ''}${customer_info.delivery_notes ? ` | Notes: ${customer_info.delivery_notes}` : ''}${razorpay_payment_id ? ` | Payment ID: ${razorpay_payment_id}` : ''}`;

    // Handle Customer ID (Supports Logged-in & Guest Checkout)
    let customerId = user ? user.id : null;

    if (!customerId) {
      const cleanPhone = customer_info.phone.trim();
      
      // 1. Try finding existing profile by phone
      const { data: existingProfile } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingProfile) {
        customerId = existingProfile.id;
      } else {
        // 2. Fallback to any existing system profile for foreign key compliance
        const { data: firstProfile } = await adminSupabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();

        if (firstProfile) customerId = firstProfile.id;
      }
    }

    // Build insert payload using only guaranteed columns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderPayload: Record<string, any> = {
      total_amount: totalAmount,
      item_count: orderItems.length,
      status: 'confirmed',
      delivery_date: deliveryDate,
      delivery_notes: fullNotes,
      payment_status: 'paid'
    };

    if (customerId) {
      orderPayload.customer_id = customerId;
    }

    // Insert order record
    const { data: order, error: orderError } = await adminSupabase
      .from('product_orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError.message);
      return NextResponse.json({ success: false, message: `Failed to create product order: ${orderError.message}` }, { status: 500 });
    }

    // Insert order items
    const itemsWithOrderId = orderItems.map(item => ({
      order_id: order.id,
      ...item
    }));

    const { error: itemsError } = await adminSupabase
      .from('product_order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Order items insertion error:', itemsError.message);
    }

    // Decrement stock
    for (const item of orderItems) {
      const currentProduct = products.find(p => p.id === item.product_id);
      if (currentProduct) {
        const newStock = Math.max(0, currentProduct.stock - item.quantity);
        await adminSupabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);
      }
    }

    // Insert payment record
    if (customerId) {
      await adminSupabase.from('payments').insert({
        customer_id: customerId,
        amount: totalAmount,
        payment_type: 'product',
        method: 'upi',
        status: 'success',
        is_manual: false,
        paid_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      total_amount: totalAmount,
      item_count: orderItems.length,
      delivery_date: deliveryDate,
      message: `Order confirmed! Total ₹${totalAmount}. Delivery scheduled for tomorrow morning.`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Product order exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
