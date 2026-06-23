const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('system_settings')
    .upsert({ key: 'price_per_litre', value: '{"amount":82.67}', updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
