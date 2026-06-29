const fs=require('fs');
const {createClient}=require('@supabase/supabase-js');
const env=fs.readFileSync('.env.local','utf8');
const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const sb=createClient(url,key);
sb.rpc('is_within_skip_deadline', {p_skip_date: '2026-06-30'}).then(r=>console.log(r));
