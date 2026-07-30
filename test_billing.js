const supabaseUrl = 'https://wzynhknwzcmoftzrzflt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eW5oa253emNtb2Z0enJ6Zmx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU4MDk5OCwiZXhwIjoyMDk3MTU2OTk4fQ.zWYeN3pExaRrTownQhlVeKyrWWNW---ESFHyLzhatZA';

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/billing_months?subscription_id=eq.88d0dbeb-b3dc-40a9-b4b3-a5ca7ffd0dc0&select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log('Mrithul billing_months:', JSON.stringify(data, null, 2));
}

run();
