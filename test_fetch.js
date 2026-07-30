const supabaseUrl = 'https://wzynhknwzcmoftzrzflt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eW5oa253emNtb2Z0enJ6Zmx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU4MDk5OCwiZXhwIjoyMDk3MTU2OTk4fQ.zWYeN3pExaRrTownQhlVeKyrWWNW---ESFHyLzhatZA';

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));

  const res2 = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,full_name`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data2 = await res2.json();
  console.log(JSON.stringify(data2, null, 2));
}

run();
