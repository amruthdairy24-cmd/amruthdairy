// One-time script: delete the old seed products from Supabase
// Run with: node scripts/cleanup-seed-products.mjs

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=')
      return [key.trim(), rest.join('=').trim().replace(/^["']|["']$/g, '')]
    })
)

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const seedIds = [
  "33a18fcf-b7a6-47d8-b85e-ba5dfea4e5e3",
  "8bd38d8a-613b-4865-8a53-0e293aeab22d",
  "17f5008b-0ef5-43f9-a27f-30483f12a611",
  "83ab3aaf-771d-4371-86ac-9b3654c6eb5e",
  "54d6487d-b903-45d4-b9a9-da11ec2d916c",
  "efb0f6e1-0382-4bba-a6bc-4ae46a0d4855"
]

console.log(`Deleting ${seedIds.length} seed products...`)

const { error, count } = await admin
  .from('products')
  .delete({ count: 'exact' })
  .in('id', seedIds)

if (error) {
  console.error('Error deleting products:', error.message)
  process.exit(1)
}

console.log(`✅ Successfully deleted ${count} seed products from Supabase.`)
console.log('The landing page will now show only products added from the admin panel.')
