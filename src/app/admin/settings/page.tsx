import { createClient } from '@/utils/supabase/server'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch all system settings
  const { data: settingsData } = await supabase
    .from('system_settings')
    .select('*')

  const getSetting = (key: string, fallback: any) => {
    const s = settingsData?.find(s => s.key === key)
    if (!s) return fallback
    let val = s.value
    
    // Safely parse JSON values if they are stored as JSON strings
    if (typeof val === 'string') {
      try {
        // Try parsing to handle double-quoted strings like '"Before 7:00 AM"'
        val = JSON.parse(val)
      } catch (e) {}
    }
    return val !== undefined && val !== null ? val : fallback
  }

  // Gather all configurations
  const configs = {
    // General
    businessName: getSetting('business_name', 'Amruth Dairy'),
    supportPhone: getSetting('business_phone', '+91 0000000000'),
    ownerPhone: getSetting('owner_phone', '+91 9048571147'),
    
    // Operations
    dailyCapacity: Number(getSetting('daily_capacity_litres', 100)),
    deliveryStartTime: getSetting('delivery_start_time', 'Before 7:00 AM'),
    waitlistOfferHours: Number(getSetting('waitlist_offer_hours', 24)),
    
    // Billing & Deadlines
    basePricePerLitre: Number(getSetting('base_price_per_litre', 2480)),
    skipDeadlineHourIst: Number(getSetting('skip_deadline_hour_ist', 21)),
    
    // Toggles
    maintenanceMode: getSetting('maintenance_mode', 'false') === 'true' || getSetting('maintenance_mode', false) === true,
    razorpayEnabled: getSetting('razorpay_enabled', 'true') === 'true' || getSetting('razorpay_enabled', true) === true,
    whatsappEnabled: getSetting('whatsapp_enabled', 'false') === 'true' || getSetting('whatsapp_enabled', false) === true,
  }

  return <SettingsClient initialConfigs={configs} />
}
