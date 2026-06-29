const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { fetchMilkPrices, calculateDailyRate } = require('./src/lib/billing');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb = createClient(url, key);

async function test() {
  const prices = await fetchMilkPrices(sb);
  console.log("fetched prices:", prices);
  const rate = calculateDailyRate(1, prices);
  console.log("calculated rate for 1.0L:", rate);
}
test();
