import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const adminSupabase = createAdminClient();

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { items, delivery_notes } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    // Validate all products exist and get current prices
    const productIds = items.map((item: CartItem) => item.product_id);
    const { data: products, error: productsError } = await adminSupabase
      .from('products')
      .select('id, name, price, stock, is_active')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json({ success: false, message: 'Failed to validate products' }, { status: 500 });
    }

    // Verify stock and build order items
    const orderItems: { product_id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }[] = [];
    let totalAmount = 0;

    for (const cartItem of items as CartItem[]) {
      const product = products.find(p => p.id === cartItem.product_id);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: `Product not found: ${cartItem.product_name}`
        }, { status: 400 });
      }
      if (!product.is_active) {
        return NextResponse.json({
          success: false,
          message: `${product.name} is currently unavailable`
        }, { status: 400 });
      }
      if (product.stock < cartItem.quantity) {
        return NextResponse.json({
          success: false,
          message: `Only ${product.stock} units of ${product.name} available`
        }, { status: 400 });
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

    // Create the order
    const { data: order, error: orderError } = await adminSupabase
      .from('product_orders')
      .insert({
        customer_id: user.id,
        total_amount: totalAmount,
        item_count: orderItems.length,
        status: 'confirmed',
        delivery_date: deliveryDate,
        delivery_notes: delivery_notes || null,
        payment_status: 'paid' // For MVP, mark as paid directly
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError.message);
      return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
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
      console.error('Order items error:', itemsError.message);
    }

    // Update stock
    for (const item of orderItems) {
      const { error: rpcError } = await adminSupabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity
      });

      if (rpcError) {
        // If RPC doesn't exist or fails, do manual update
        const currentProduct = products.find(p => p.id === item.product_id);
        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock - item.quantity);
          await adminSupabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }
    }

    // Insert payment record
    await adminSupabase.from('payments').insert({
      customer_id: user.id,
      amount: totalAmount,
      payment_type: 'product',
      method: 'upi',
      status: 'success',
      is_manual: false,
      paid_at: new Date().toISOString()
    });

    // Notification system deferred — not in current plan

    return NextResponse.json({
      success: true,
      order_id: order.id,
      total_amount: totalAmount,
      item_count: orderItems.length,
      delivery_date: deliveryDate,
      message: `Order placed! ${orderItems.length} items — ₹${totalAmount}. Delivery tomorrow.`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Product order exception:', message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
