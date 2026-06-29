const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb = createClient(url, key);

async function run() {
  const { error: triggerError } = await sb.rpc('execute_sql', {
    sql: 'DROP TRIGGER IF EXISTS trg_compute_amounts ON public.subscriptions;'
  });
  console.log("Trigger drop:", triggerError || "Success");

  const { error: funcError } = await sb.rpc('execute_sql', {
    sql: 'DROP FUNCTION IF EXISTS compute_subscription_amounts();'
  });
  console.log("Function drop:", funcError || "Success");
}
run();
