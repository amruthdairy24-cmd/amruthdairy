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
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_function_def`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ function_name: 'populate_daily_delivery_sheet' })
  });
  const text = await res.text();
  console.log("RESULT:", text);
}

run();
