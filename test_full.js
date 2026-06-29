const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb = createClient(url, key);

function calculateDailyRate(quantity, prices) {
  const qtyStr1 = quantity.toString();
  const qtyStr2 = quantity.toFixed(1);
  if (prices[qtyStr1] !== undefined) {
    return prices[qtyStr1];
  }
  if (prices[qtyStr2] !== undefined) {
    return prices[qtyStr2];
  }
  const baseRate = prices["1.0"] || prices["1"] || 82.67;
  return Math.round(baseRate * quantity * 100) / 100;
}

async function test() {
  const { data } = await sb
    .from('app_settings')
    .select('value')
    .eq('key', 'milk_tier_prices')
    .single();

  const parsed = data.value;
  const prices = parsed.prices || { "1": 82.67 };
  console.log("calculated:", calculateDailyRate(1, prices));
}
test();
