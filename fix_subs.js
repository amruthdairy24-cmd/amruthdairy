const supabaseUrl = 'https://wzynhknwzcmoftzrzflt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eW5oa253emNtb2Z0enJ6Zmx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU4MDk5OCwiZXhwIjoyMDk3MTU2OTk4fQ.zWYeN3pExaRrTownQhlVeKyrWWNW---ESFHyLzhatZA';

async function run() {
  console.log('Fetching subscriptions with pending_payment...');
  const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?status=eq.pending_payment&select=id,customer_id`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const subs = await res.json();
  
  for (const sub of subs) {
    const resBill = await fetch(`${supabaseUrl}/rest/v1/billing_months?subscription_id=eq.${sub.id}&payment_status=eq.paid&select=id`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const bills = await resBill.json();
    
    if (bills && bills.length > 0) {
      console.log(`Updating subscription ${sub.id} for customer ${sub.customer_id} to active...`);
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });
    }
  }
  console.log('Done fixing subscriptions.');
}

run();
