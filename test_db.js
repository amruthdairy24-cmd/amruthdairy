const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
  
  const supabase = createClient(url, key);
  
  console.log('Inserting into farm_visits table...');
  const { data, error } = await supabase.from('farm_visits').insert([{
    name: 'test_insert',
    mobile: '1234567890',
    address: 'test address'
  }]).select();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success, data:', data);
  }
}
run();
