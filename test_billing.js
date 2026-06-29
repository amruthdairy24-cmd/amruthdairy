const fs=require('fs');
const {createClient}=require('@supabase/supabase-js');
const env=fs.readFileSync('.env.local','utf8');
const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb=createClient(url,key);
sb.from('billing_months').select('*').order('created_at', {ascending: false}).limit(3).then(r=>console.log(r));
