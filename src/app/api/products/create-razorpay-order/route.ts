import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import Razorpay from 'razorpay';

const adminSupabase = createAdminClient();

interface CartItemInput {
  product_id: string;
  quantity: number;
}

interface CustomerInfoInput {
  full_name: string;
  phone: string;
  delivery_address: string;
  area: string;
  landmark?: string;
  delivery_notes?: string;
}

export async function POST(request: Request) {
  try {
    const { items, customer_info } = await request.json() as {
      items?: CartItemInput[];
      customer_info?: CustomerInfoInput;
    };

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
    const validatedItems: { product_id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }[] = [];

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

      const subtotal = Math.round(product.price * item.quantity * 100) / 100;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal
      });
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
        items_count: items.length,
        customer_name: (customer_info?.full_name || '').slice(0, 40),
        customer_phone: (customer_info?.phone || '').slice(0, 15),
        customer_area: (customer_info?.area || '').slice(0, 40)
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // If customer details are provided, pre-create a pending order in DB
    // This guarantees the order is tracked even if the customer's mobile browser closes after payment
    let pendingOrderId: string | null = null;
    if (customer_info && customer_info.full_name && customer_info.phone) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let customerId = user ? user.id : null;
        if (!customerId) {
          const cleanPhone = customer_info.phone.trim();
          const { data: existingProfile } = await adminSupabase
            .from('profiles')
            .select('id')
            .eq('phone', cleanPhone)
            .maybeSingle();

          if (existingProfile) {
            customerId = existingProfile.id;
          } else {
            const { data: firstProfile } = await adminSupabase
              .from('profiles')
              .select('id')
              .limit(1)
              .single();
            if (firstProfile) customerId = firstProfile.id;
          }
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deliveryDate = tomorrow.toISOString().split('T')[0];

        const fullNotes = `Name: ${customer_info.full_name} | Phone: ${customer_info.phone} | Area: ${customer_info.area} | Address: ${customer_info.delivery_address}${customer_info.landmark ? ` (Landmark: ${customer_info.landmark})` : ''}${customer_info.delivery_notes ? ` | Notes: ${customer_info.delivery_notes}` : ''} | Razorpay Order ID: ${razorpayOrder.id}`;

        const { data: orderRecord, error: orderInsertErr } = await adminSupabase
          .from('product_orders')
          .insert({
            customer_id: customerId,
            total_amount: totalAmount,
            item_count: validatedItems.length,
            status: 'pending',
            delivery_date: deliveryDate,
            delivery_notes: fullNotes,
            payment_status: 'pending'
          })
          .select()
          .single();

        if (!orderInsertErr && orderRecord) {
          pendingOrderId = orderRecord.id;
          const orderItemsWithId = validatedItems.map(item => ({
            order_id: orderRecord.id,
            ...item
          }));

          await adminSupabase.from('product_order_items').insert(orderItemsWithId);
        }
      } catch (dbErr) {
        console.warn('[create-razorpay-order] Could not pre-create pending order:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
      db_order_id: pendingOrderId
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
