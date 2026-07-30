import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
    if (match[1] === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
    if (match[1] === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('subscriptions').select('profiles(full_name), razorpay_subscription_id, status').eq('status', 'active');
  console.log(JSON.stringify(data, null, 2));
}

run();
