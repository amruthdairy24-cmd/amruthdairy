import { createClient } from '@/utils/supabase/server'
import { ProductsClient } from './ProductsClient'
import { createAdminClient } from '@/utils/supabase/admin'
import { fetchMilkPrices, calculateDailyRate, fetchRawMilkPricing } from '@/lib/billing'
import { QUANTITY_OPTIONS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [productsRes, milkPrices, rawMilkPricing] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    fetchMilkPrices(adminClient),
    fetchRawMilkPricing(adminClient)
  ])

  if (productsRes.error) return <div className="text-red-500">Error: {productsRes.error.message}</div>

  const dynamicPlans = QUANTITY_OPTIONS.map(opt => {
    const dailyRate = calculateDailyRate(opt.litres, milkPrices);
    return {
      id: `plan-${opt.litres}`,
      name: `${opt.label} Daily Delivery`,
      quantity_litres: opt.litres,
      daily_rate: dailyRate,
      monthly_price: dailyRate * 30, // Approx 30 days
      is_popular: opt.litres === 1.0
    }
  })

  return <ProductsClient data={productsRes.data || []} plans={dynamicPlans} milkPrices={milkPrices} rawMilkPricing={rawMilkPricing} />
}
