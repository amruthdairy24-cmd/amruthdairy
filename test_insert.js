const fs=require('fs');const {createClient}=require('@supabase/supabase-js');const env=fs.readFileSync('.env.local','utf8');const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();const sb=createClient(url,key);
sb.from('quantity_change_requests').insert({
  subscription_id: '6ef0cfae-cade-4f8d-b6f0-cd038d69baf2',
  customer_id: 'feccad4b-5125-4d3c-a5d5-fb87739d46bb',
  current_quantity: 1,
  requested_quantity: 2,
  new_monthly_amount: 100,
  new_daily_rate: 20,
  effective_from_month: '2026-07-01',
  status: 'pending'
}).then(r=>console.dir(r, {depth:null}));
