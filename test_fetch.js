const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb = createClient(url, key);

async function test() {
  const { data, error } = await sb
    .from('app_settings')
    .select('value')
    .eq('key', 'milk_tier_prices')
    .single();

  console.log("data:", JSON.stringify(data, null, 2));
  console.log("error:", error);
  
  if (data) {
    const parsed = data.value;
    console.log("parsed:", JSON.stringify(parsed, null, 2));
    console.log("parsed.prices:", parsed.prices);
  }
}
test();
