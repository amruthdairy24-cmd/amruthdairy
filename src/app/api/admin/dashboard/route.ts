import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getTodayIST } from '@/lib/utils';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const todayStr = getTodayIST();
    
    // 1. Today's Delivery Summary using RPC
    const { data: dailySummary } = await supabase.rpc('get_daily_summary', { p_date: todayStr });
    
    // Capacity for today
    const { data: todayCapacity } = await supabase
      .from('daily_capacity')
      .select('total_litres, booked_litres')
      .eq('date', todayStr)
      .maybeSingle();

    const capacity_used_percent = todayCapacity 
      ? Math.round((todayCapacity.booked_litres / todayCapacity.total_litres) * 100) 
      : 0;

    const today = {
      date: todayStr,
      total_deliveries: dailySummary?.total_customers || 0,
      delivering_count: dailySummary?.delivering || 0,
      skipped_count: dailySummary?.skipped || 0,
      vacation_count: dailySummary?.on_vacation || 0,
      extra_orders_count: dailySummary?.extra_orders || 0,
      total_litres_needed: dailySummary?.total_litres_needed || 0,
      capacity_used_percent: capacity_used_percent
    };

    const { count: activeCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: pausedCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'paused');
    const { count: pendingCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending_payment');
    const { count: waitlistCount } = await supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'waiting');
    const { count: cancelledCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');

    const { data: waitlistData } = await supabase.from('waitlist').select('quantity_litres').eq('status', 'waiting');
    const waitlistLitres = waitlistData?.reduce((acc: number, row: any) => acc + Number(row.quantity_litres), 0) || 0;

    const customers = {
      total_active: activeCount || 0,
      total_paused: pausedCount || 0,
      total_pending_payment: pendingCount || 0,
      in_waitlist: waitlistCount || 0,
      waitlist_litres: waitlistLitres
    };

    // 3. This Month stats
    const currentDate = new Date();
    // Using current UTC date to approximate month, but better to use IST for the billing month start
    const istTimeStr = formatInTimeZone(currentDate, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss");
    const istDate = new Date(istTimeStr);
    const billingMonthDate = new Date(istDate.getFullYear(), istDate.getMonth(), 1);
    const formattedBillingMonth = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-01`;

    const { data: thisMonthBilling } = await supabase
      .from('billing_months')
      .select('monthly_amount, amount_paid, skip_credit, pause_credit, net_due')
      .eq('billing_month', formattedBillingMonth);

    let total_revenue = 0;
    let total_credits_given = 0;
    let pending_dues = 0;

    if (thisMonthBilling) {
      thisMonthBilling.forEach(b => {
        total_revenue += Number(b.amount_paid);
        total_credits_given += (Number(b.skip_credit) + Number(b.pause_credit));
        pending_dues += Number(b.net_due);
      });
    }

    const this_month = {
      total_revenue,
      total_credits_given,
      pending_dues
    };

    // 4. Alerts
    const alerts: string[] = [];
    
    // Tomorrow stats for alerts
    const tomorrowStr = formatInTimeZone(new Date(Date.now() + 86400000), 'Asia/Kolkata', 'yyyy-MM-dd');

    const { data: tmrwSummary } = await supabase.rpc('get_daily_summary', { p_date: tomorrowStr });
    if (tmrwSummary?.skipped > 0) alerts.push(`${tmrwSummary.skipped} customers skipping tomorrow`);
    if (tmrwSummary?.extra_orders > 0) alerts.push(`${tmrwSummary.extra_orders} extra milk orders tomorrow`);

    const { data: tmrwCapacity } = await supabase.from('daily_capacity').select('total_litres, booked_litres').eq('date', tomorrowStr).maybeSingle();
    if (tmrwCapacity) {
      const pct = Math.round((tmrwCapacity.booked_litres / tmrwCapacity.total_litres) * 100);
      if (pct >= 90) alerts.push(`Capacity at ${pct}% tomorrow`);
    }

    // 5. Reports & Analytics Calculations
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('quantity_litres, daily_rate, profiles(area)')
      .eq('status', 'active');

    let totalVolume = 0;
    const zoneMap: { [area: string]: { deliveries: number; volume: number; revenue: number } } = {};

    if (activeSubs) {
      activeSubs.forEach((sub: any) => {
        const area = sub.profiles?.area || 'Unassigned';
        const vol = Number(sub.quantity_litres);
        const rate = Number(sub.daily_rate);
        
        totalVolume += vol;

        if (!zoneMap[area]) {
          zoneMap[area] = { deliveries: 0, volume: 0, revenue: 0 };
        }
        zoneMap[area].deliveries += 1;
        zoneMap[area].volume += vol;
        zoneMap[area].revenue += rate;
      });
    }

    const areaDeliveries = Object.entries(zoneMap).map(([zone, data]) => ({
      zone,
      deliveries: data.deliveries,
      volume: `${data.volume.toFixed(1)}L`,
      revenue: `₹${(data.revenue * 30).toFixed(0)}`
    }));

    const totalSubsAllTime = (activeCount || 0) + (pausedCount || 0) + (cancelledCount || 0);
    const retentionPct = totalSubsAllTime > 0 
      ? (((activeCount || 0) + (pausedCount || 0)) / totalSubsAllTime * 100).toFixed(1) + '%'
      : '100%';

    const reports = {
      average_daily_demand: `${totalVolume.toFixed(1)} Litres`,
      active_routes: `${Object.keys(zoneMap).length} Routes`,
      customer_retention: retentionPct,
      area_deliveries: areaDeliveries
    };

    return NextResponse.json({
      success: true,
      today,
      customers,
      this_month,
      alerts,
      reports
    });

  } catch (err: any) {
    console.error('Admin dashboard exception:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
