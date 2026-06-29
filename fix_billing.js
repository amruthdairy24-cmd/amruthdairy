const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb = createClient(url, key);

async function fix() {
  const { data: subs } = await sb.from('subscriptions').select('id, status');
  const activeSubs = subs.filter(s => s.status === 'active').map(s => s.id);
  
  if (activeSubs.length > 0) {
    const { data, error } = await sb.from('billing_months')
      .update({ payment_status: 'paid' })
      .in('subscription_id', activeSubs)
      .eq('payment_status', 'pending');
    console.log("Updated active subs billing to paid:", error || "Success");
  } else {
    console.log("No active subs to update");
  }
}
fix();
