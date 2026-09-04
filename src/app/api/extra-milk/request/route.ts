import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { fetchMilkPrices, calculateExtraMilkCharge, isCreditAdjustmentType, resolveSubscriptionStateForDate } from '@/lib/billing';
import { getDeadlineForDate } from '@/lib/utils';

const adminSupabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, order_date, extra_litres } = await request.json();

    if (!order_date || extra_litres === undefined) {
      return NextResponse.json({ success: false, message: 'order_date and extra_litres are required' }, { status: 400 });
    }

    if (extra_litres !== 0 && ![0.5, 1.0, 1.5, 2.0].includes(extra_litres)) {
      return NextResponse.json({ success: false, message: 'Invalid extra_litres amount' }, { status: 400 });
    }

    // DEADLINE CHECK for target date
    const { data: isWithinDeadline } = await adminSupabase.rpc('is_within_skip_deadline', {
      p_skip_date: order_date
    });

    if (!isWithinDeadline) {
      return NextResponse.json({
        success: false,
        message: `Deadline passed! Extra milk order not allowed for ${order_date} after 9 PM.`
      }, { status: 400 });
    }

    // Get active subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ success: false, message: 'Active subscription not found' }, { status: 400 });
    }

    // CHECK PAID MONTH COVERAGE USING CANONICAL RESOLVER FOR TARGET DATE
    const orderDateObj = new Date(order_date);
    const chargeMonthStr = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-01`;

    const { data: targetMonthBilling } = await adminSupabase
      .from('billing_months')
      .select('id, payment_status')
      .eq('subscription_id', subscription.id)
      .eq('billing_month', chargeMonthStr)
      .maybeSingle();

    const coverage = resolveSubscriptionStateForDate({
      subscription,
      targetMonthBilling,
      targetBillingMonthStr: chargeMonthStr,
      targetDateStr: order_date
    });

    if (!coverage.isCovered) {
      const msg = (coverage.state === 'UNRENEWED_ELIGIBLE' || coverage.state === 'PAYMENT_PENDING')
        ? 'Your subscription is pending renewal for this month. Please renew your subscription to order extra milk.'
        : 'You cannot order extra milk for an un-covered or inactive subscription period.';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    let existingOrderToEdit = null;
    let oldExtraLitres = 0;
    let oldOrderDate = order_date;

    if (order_id) {
      // EDIT MODE
      const { data: orderData } = await adminSupabase
        .from('extra_milk_orders')
        .select('*')
        .eq('id', order_id)
        .eq('subscription_id', subscription.id)
        .single();
        
      if (!orderData) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      
      existingOrderToEdit = orderData;
      oldExtraLitres = orderData.extra_litres;
      oldOrderDate = orderData.order_date;

      // Check if old date is past deadline (if they are changing the date or just editing)
      const { data: isOldWithinDeadline } = await adminSupabase.rpc('is_within_skip_deadline', {
        p_skip_date: oldOrderDate
      });

      if (!isOldWithinDeadline) {
        return NextResponse.json({
          success: false,
          message: 'Deadline passed for the original order date! Cannot modify it.'
        }, { status: 400 });
      }
    } else {
      // NEW MODE - check if already requested for this date
      const { data: existingOrder } = await adminSupabase
        .from('extra_milk_orders')
        .select('id')
        .eq('subscription_id', subscription.id)
        .eq('order_date', order_date)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({ success: false, message: 'You have already requested extra milk for this date. Please edit the existing order.' }, { status: 400 });
      }
    }

    // CAPACITY BOOKING
    // First, release old capacity if editing
    if (existingOrderToEdit) {
      const { error: releaseError } = await adminSupabase.rpc('book_capacity_single_day', {
        p_date: oldOrderDate,
        p_litres: -oldExtraLitres // release
      });
      if (releaseError) {
        return NextResponse.json({ success: false, message: 'Failed to release old capacity' }, { status: 500 });
      }
    }

    // Then book new capacity (if not deleting)
    if (extra_litres > 0) {
      const { data: bookingSuccess, error: capacityError } = await adminSupabase.rpc('book_capacity_single_day', {
        p_date: order_date,
        p_litres: extra_litres
      });

      if (capacityError) {
        // rollback
        if (existingOrderToEdit) await adminSupabase.rpc('book_capacity_single_day', { p_date: oldOrderDate, p_litres: oldExtraLitres });
        return NextResponse.json({ success: false, message: 'Failed to process capacity' }, { status: 500 });
      }

      if (!bookingSuccess) {
        // rollback
        if (existingOrderToEdit) await adminSupabase.rpc('book_capacity_single_day', { p_date: oldOrderDate, p_litres: oldExtraLitres });
        return NextResponse.json({
          success: false,
          capacity_full: true,
          message: `Sorry! Insufficient capacity available. Cannot add ${extra_litres}L extra.`
        }, { status: 400 });
      }
    }

    // Calculate gross charge
    const prices = await fetchMilkPrices(adminSupabase, order_date);
    const charge_amount = extra_litres > 0 ? calculateExtraMilkCharge(extra_litres, prices) : 0;

    // Determine billing month
    const chargeDateObj = new Date(order_date);
    chargeDateObj.setMonth(chargeDateObj.getMonth() + 1);
    chargeDateObj.setDate(1);
    const charge_month = chargeDateObj.toISOString().split('T')[0];

    // Calculate Available Credit to offset the charge — include ALL credit types
    // (skip_credit, vacation_credit, carry_forward, credit)
    const { data: allAdjustments } = await adminSupabase
      .from('billing_adjustments')
      .select('adjustment_type, amount')
      .eq('subscription_id', subscription.id)
      .eq('target_month', charge_month)
      .eq('is_applied', false);
      
    const totalCreditsForMonth = (allAdjustments || []).reduce((sum, row) => {
      if (isCreditAdjustmentType(row.adjustment_type)) {
        return sum + Number(row.amount || 0);
      }
      return sum;
    }, 0);
    
    // Get total credit already applied to OTHER extra milk orders in the same month
    let query = adminSupabase
      .from('extra_milk_orders')
      .select('skip_credit_applied')
      .eq('subscription_id', subscription.id)
      .eq('charge_month', charge_month)
      .eq('status', 'confirmed');
      
    if (order_id) {
      query = query.neq('id', order_id);
    }
    const { data: usedCredits } = await query;
    const totalUsedCredits = (usedCredits || []).reduce((sum, row) => sum + Number(row.skip_credit_applied), 0);
    
    const availableSkipCredit = Math.max(0, totalCreditsForMonth - totalUsedCredits);
    const skip_credit_applied = Math.min(charge_amount, availableSkipCredit);
    const net_charge_amount = charge_amount - skip_credit_applied;

    const deadlineObj = getDeadlineForDate(order_date);
    
    let extraOrderId = order_id;

    if (extra_litres === 0) {
      // Cancellation logic
      if (order_id) {
        // Fetch order details before deleting to check if it needs refund
        const { data: orderToCancel } = await adminSupabase
          .from('extra_milk_orders')
          .select('payment_status, charge_amount, skip_credit_applied, charge_month')
          .eq('id', order_id)
          .single();

        // Revert daily_delivery_sheet first to release foreign key reference
        await adminSupabase
          .from('daily_delivery_sheet')
          .update({
            extra_litres: 0,
            is_extra: false,
            extra_order_id: null,
            total_litres: subscription.quantity_litres
          })
          .eq('extra_order_id', order_id);

        // Delete the extra milk order now that it is no longer referenced
        await adminSupabase.from('extra_milk_orders').delete().eq('id', order_id);

        // Issue refund if it was paid instantly
        if (orderToCancel && orderToCancel.payment_status === 'paid_instantly') {
          const net_charge = orderToCancel.charge_amount - orderToCancel.skip_credit_applied;
          if (net_charge > 0) {
            await adminSupabase.from('billing_adjustments').insert({
              subscription_id: subscription.id,
              customer_id: user.id,
              amount: net_charge,
              adjustment_type: 'credit',
              description: `Refund for cancelled extra milk order on ${order_date}`,
              target_month: orderToCancel.charge_month,
              is_applied: false
            });
          }
        }
      }
      return NextResponse.json({
        success: true,
        message: 'Extra milk order cancelled successfully.'
      });
    }

    let query2 = adminSupabase
      .from('extra_milk_orders')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('charge_month', charge_month)
      .eq('payment_status', 'pay_later')
      .neq('status', 'cancelled');

    if (order_id) {
      query2 = query2.neq('id', order_id);
    }
    const { data: previousPayLaterOrders } = await query2;
    const payLaterCount = previousPayLaterOrders?.length || 0;
    
    const requiresInstantPayment = payLaterCount >= 2 && net_charge_amount > 0;

    if (requiresInstantPayment) {
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
          return NextResponse.json({ success: false, message: 'Payment gateway is not configured.' }, { status: 500 });
        }
        
        let pendingOrderId = order_id;
        if (order_id) {
           const { error: updateError } = await adminSupabase
            .from('extra_milk_orders')
            .update({
              order_date,
              extra_litres,
              total_litres_that_day: subscription.quantity_litres + extra_litres,
              charge_amount,
              charge_month,
              skip_credit_applied,
              deadline: deadlineObj.toISOString(),
              status: 'pending_payment',
              payment_status: 'pending_payment'
            })
            .eq('id', order_id);
          if (updateError) throw updateError;
        } else {
           const { data: newOrder, error: insertError } = await adminSupabase
            .from('extra_milk_orders')
            .insert({
              subscription_id: subscription.id,
              customer_id: user.id,
              order_date,
              extra_litres,
              total_litres_that_day: subscription.quantity_litres + extra_litres,
              charge_amount,
              charge_month,
              skip_credit_applied,
              deadline: deadlineObj.toISOString(),
              status: 'pending_payment',
              payment_status: 'pending_payment'
            })
            .select()
            .single();
           if (insertError) {
             await adminSupabase.rpc('book_capacity_single_day', { p_date: order_date, p_litres: -extra_litres });
             throw insertError;
           }
           pendingOrderId = newOrder.id;
        }
        
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const amountInPaise = Math.round(net_charge_amount * 100);
        const options = {
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_em_${pendingOrderId}`,
          notes: {
            extra_order_id: pendingOrderId,
            customer_id: user.id
          }
        };
        const rzpOrder = await razorpay.orders.create(options);
        
        return NextResponse.json({
          success: true,
          requires_payment: true,
          razorpay_order_id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          extra_order_id: pendingOrderId,
          message: `Pay ₹${net_charge_amount} to confirm your extra milk order.`
        });
    }

    if (order_id) {
      // UPDATE
      const { error: updateError } = await adminSupabase
        .from('extra_milk_orders')
        .update({
          order_date,
          extra_litres,
          total_litres_that_day: subscription.quantity_litres + extra_litres,
          charge_amount,
          charge_month,
          skip_credit_applied,
          // net_charge_amount is GENERATED ALWAYS AS
          deadline: deadlineObj.toISOString(),
          status: 'confirmed',
          payment_status: 'pay_later'
        })
        .eq('id', order_id);
        
      if (updateError) throw updateError;
    } else {
      // INSERT
      const { data: newOrder, error: insertError } = await adminSupabase
        .from('extra_milk_orders')
        .insert({
          subscription_id: subscription.id,
          customer_id: user.id,
          order_date,
          extra_litres,
          total_litres_that_day: subscription.quantity_litres + extra_litres,
          charge_amount,
          charge_month,
          skip_credit_applied,
          deadline: deadlineObj.toISOString(),
          status: 'confirmed',
          payment_status: 'pay_later'
        })
        .select()
        .single();
        
      if (insertError) {
        // rollback capacity
        await adminSupabase.rpc('book_capacity_single_day', { p_date: order_date, p_litres: -extra_litres });
        throw insertError;
      }
      extraOrderId = newOrder.id;
    }

    // UPSERT daily_delivery_sheet
    if (order_id && oldOrderDate !== order_date) {
      // Revert the old day's sheet if it exists
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          extra_litres: 0,
          is_extra: false,
          extra_order_id: null,
          total_litres: subscription.quantity_litres
        })
        .eq('extra_order_id', order_id);
    }
    
    // Update or insert for the new day
    const { data: existingDelivery } = await adminSupabase
      .from('daily_delivery_sheet')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('delivery_date', order_date)
      .maybeSingle();

    if (existingDelivery) {
      await adminSupabase
        .from('daily_delivery_sheet')
        .update({
          extra_litres,
          is_extra: true,
          extra_order_id: extraOrderId,
          total_litres: subscription.quantity_litres + extra_litres
        })
        .eq('id', existingDelivery.id);
    } else {
      await adminSupabase
        .from('daily_delivery_sheet')
        .insert({
          delivery_date: order_date,
          customer_id: user.id,
          subscription_id: subscription.id,
          regular_litres: subscription.quantity_litres,
          extra_litres,
          total_litres: subscription.quantity_litres + extra_litres,
          is_skip: false,
          is_vacation: false,
          is_extra: true,
          extra_order_id: extraOrderId,
          delivery_status: 'pending'
        });
    }

    return NextResponse.json({
      success: true,
      order_date,
      extra_litres,
      total_tomorrow: subscription.quantity_litres + extra_litres,
      charge_amount,
      skip_credit_applied,
      net_charge_amount,
      charged_in: new Date(charge_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      message: `Extra ${extra_litres}L confirmed! Tomorrow you get ${subscription.quantity_litres + extra_litres}L total. Net charge ₹${net_charge_amount} added to next bill.`
    });

  } catch (err: any) {
    console.error('Extra milk request exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
