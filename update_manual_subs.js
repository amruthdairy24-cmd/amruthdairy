const supabaseUrl = 'https://wzynhknwzcmoftzrzflt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eW5oa253emNtb2Z0enJ6Zmx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU4MDk5OCwiZXhwIjoyMDk3MTU2OTk4fQ.zWYeN3pExaRrTownQhlVeKyrWWNW---ESFHyLzhatZA';

async function run() {
  console.log('Fetching subscriptions with pending_payment...');
  const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?status=eq.pending_payment&select=id`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const subs = await res.json();
  
  if (subs && subs.length > 0) {
    console.log(`Found ${subs.length} pending subscriptions. Updating to active + MANUAL_UNPAID...`);
    for (const sub of subs) {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active', razorpay_subscription_id: 'MANUAL_UNPAID' })
      });
      console.log(`Updated sub ${sub.id}`);
    }
  } else {
    console.log('No pending_payment subscriptions found.');
  }

  // Also update any active subscriptions that don't have a razorpay id to MANUAL_PAID
  console.log('Updating existing active manual subscriptions to MANUAL_PAID...');
  const resActive = await fetch(`${supabaseUrl}/rest/v1/subscriptions?status=eq.active&razorpay_subscription_id=is.null&select=id`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const activeSubs = await resActive.json();
  if (activeSubs && activeSubs.length > 0) {
    console.log(`Found ${activeSubs.length} active manual subscriptions. Updating...`);
    for (const sub of activeSubs) {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ razorpay_subscription_id: 'MANUAL_PAID' })
      });
      console.log(`Updated active sub ${sub.id} to MANUAL_PAID`);
    }
  } else {
    console.log('No active null razorpay subs found.');
  }

  console.log('Done.');
}

run();
