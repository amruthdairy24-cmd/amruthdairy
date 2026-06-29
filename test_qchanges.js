const fs=require('fs');const {createClient}=require('@supabase/supabase-js');const env=fs.readFileSync('.env.local','utf8');const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();const sb=createClient(url,key);
sb.from('quantity_changes').select('*').limit(1).then(r=>console.dir(r, {depth:null}));
