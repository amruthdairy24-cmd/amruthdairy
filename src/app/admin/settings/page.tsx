import { createClient } from '@/utils/supabase/server'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: settingsData } = await supabase.from('system_settings').select('*')

  const getSetting = (key: string, fallback: string) => {
    const s = settingsData?.find(s => s.key === key)
    return s ? s.value : fallback
  }

  return (
    <SettingsClient 
      businessName={getSetting('business_name', 'Amruth Dairy')} 
      supportPhone={getSetting('business_phone', '+91 0000000000')} 
      maintenanceMode={getSetting('maintenance_mode', 'false') === 'true'} 
    />
  )
}
