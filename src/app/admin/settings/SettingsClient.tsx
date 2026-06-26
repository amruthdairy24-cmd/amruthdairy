'use client'

import { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Save, 
  Building, 
  Truck, 
  SlidersHorizontal, 
  ShieldAlert, 
  Check, 
  AlertTriangle, 
  Info, 
  Loader2, 
  Phone, 
  Shield,
  Clock,
  HelpCircle
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Configs {
  businessName: string;
  supportPhone: string;
  ownerPhone: string;
  dailyCapacity: number;
  deliveryStartTime: string;
  waitlistOfferHours: number;
  basePricePerLitre: number;
  skipDeadlineHourIst: number;
  maintenanceMode: boolean;
  razorpayEnabled: boolean;
  whatsappEnabled: boolean;
}

export function SettingsClient({ initialConfigs }: { initialConfigs: Configs }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'general' | 'operations' | 'billing' | 'toggles'>('general')
  const [formState, setFormState] = useState<Configs>(initialConfigs)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleInputChange = (key: keyof Configs, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }))
  }

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Prepare batch updates format for our system-settings API
      const payload = [
        { key: 'business_name', value: formState.businessName },
        { key: 'business_phone', value: formState.supportPhone },
        { key: 'owner_phone', value: formState.ownerPhone },
        { key: 'daily_capacity_litres', value: formState.dailyCapacity },
        { key: 'delivery_start_time', value: formState.deliveryStartTime },
        { key: 'waitlist_offer_hours', value: formState.waitlistOfferHours },
        { key: 'base_price_per_litre', value: formState.basePricePerLitre },
        { key: 'skip_deadline_hour_ist', value: formState.skipDeadlineHourIst },
        { key: 'maintenance_mode', value: formState.maintenanceMode },
        { key: 'razorpay_enabled', value: formState.razorpayEnabled },
        { key: 'whatsapp_enabled', value: formState.whatsappEnabled }
      ]

      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save configuration settings')

      showToast('Settings saved successfully!', 'success')
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 relative">
      
      {/* PAGE HEADER */}
      <AdminHeader 
        title="System Settings" 
        description="Configure application preferences, operations, billing schedules, and system variables." 
        icon={SettingsIcon} 
      />

      {/* TOAST ALERT NOTIFICATION */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-slide-up",
          toast.type === 'success' 
            ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-805 dark:text-emerald-355 border-emerald-200 dark:border-emerald-800" 
            : "bg-rose-50 dark:bg-rose-950/90 text-rose-805 dark:text-rose-355 border-rose-200 dark:border-rose-800"
        )}>
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check size={12} className="stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-rose-505 text-white flex items-center justify-center">
              <AlertTriangle size={12} />
            </div>
          )}
          <span className="text-sm font-black tracking-tight">{toast.text}</span>
        </div>
      )}

      {/* TWO-COLUMN SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
        
        {/* LEFT COLUMN: TAB NAVIGATION CARD */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-3xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Settings Categories</p>
          <div className="space-y-1">
            {[
              { id: 'general', label: 'General Configuration', desc: 'Profile name, contact channels', icon: Building },
              { id: 'operations', label: 'Operations & Delivery', desc: 'Daily capacity, schedules, offers', icon: Truck },
              { id: 'billing', label: 'Billing & Deadlines', desc: 'Rates, skip lock hours', icon: SlidersHorizontal },
              { id: 'toggles', label: 'System Toggles', desc: 'Payments, channels, modes', icon: ShieldAlert }
            ].map(tab => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all border border-transparent text-left cursor-pointer outline-none",
                    isActive 
                      ? "bg-blue-50/50 dark:bg-blue-950/15 text-[#014DA4] dark:text-blue-400 font-bold border-blue-100/50 dark:border-blue-900/20" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-3xs",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500"
                  )}>
                    <TabIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black leading-tight">{tab.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 truncate">{tab.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS FORM PANEL */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-3xs space-y-8 flex flex-col justify-between min-h-[440px]">
          
          {/* TAB CONTENTS CONTAINER */}
          <div className="space-y-6">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-855 dark:text-white">General Profile Configuration</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Manage public business profiles and key contact points for notifications.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Brand Name</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text" 
                        value={formState.businessName} 
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-800 dark:text-white text-sm font-semibold transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Helpdesk Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text" 
                        value={formState.supportPhone} 
                        onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-800 dark:text-white text-sm font-semibold transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Super Admin SMS Alerts Channel</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text" 
                        value={formState.ownerPhone} 
                        onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-800 dark:text-white text-sm font-semibold transition-all" 
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500">The destination phone number for critical system alert logs and SMS triggers.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Operations Tab */}
            {activeTab === 'operations' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-855 dark:text-white">Operations & Capacity Management</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Manage warehouse daily capacities and waitlist configurations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Capacity Limit (Litres)</label>
                    <input 
                      required
                      type="number" 
                      value={formState.dailyCapacity} 
                      onChange={(e) => handleInputChange('dailyCapacity', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-805 dark:text-white text-sm font-black font-mono transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Time Slot Label</label>
                    <input 
                      required
                      type="text" 
                      value={formState.deliveryStartTime} 
                      onChange={(e) => handleInputChange('deliveryStartTime', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-805 dark:text-white text-sm font-semibold transition-all" 
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Waitlist Offer Validity Period (Hours)</label>
                    <input 
                      required
                      type="number" 
                      value={formState.waitlistOfferHours} 
                      onChange={(e) => handleInputChange('waitlistOfferHours', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-855 dark:text-white text-sm font-black font-mono transition-all" 
                    />
                  </div>
                </div>

                {/* Operations Info Card */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex gap-3 text-slate-700 dark:text-slate-300">
                  <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs font-medium leading-relaxed">
                    <p className="font-bold text-blue-800 dark:text-blue-400">Warehouse Capacity Controls:</p>
                    <p className="mt-1">When daily milk subscription bookings cross the limit set above, new subscriptions are automatically locked and sent to the waitlist queue. Offered waitlist slots automatically expire after the validity hours set above.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing & Deadlines Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-855 dark:text-white">Billing & Schedule Rules</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Configure base subscription rates and skip deadlines.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Rate (₹/Litre monthly)</label>
                    <input 
                      required
                      type="number" 
                      value={formState.basePricePerLitre} 
                      onChange={(e) => handleInputChange('basePricePerLitre', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-805 dark:text-white text-sm font-black font-mono transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Skip/Pause Deadline Hour (IST)</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="number" 
                        min="0"
                        max="23"
                        value={formState.skipDeadlineHourIst} 
                        onChange={(e) => handleInputChange('skipDeadlineHourIst', Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/10 focus:border-[#014DA4]/45 text-slate-805 dark:text-white text-sm font-black font-mono transition-all" 
                      />
                    </div>
                  </div>
                </div>

                {/* Deadline Info Card */}
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/15 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl flex gap-3 text-slate-700 dark:text-slate-300">
                  <AlertTriangle size={16} className="text-amber-550 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs font-medium leading-relaxed">
                    <p className="font-bold text-amber-700 dark:text-amber-450">Important Schedule Curfew Rule:</p>
                    <p className="mt-1">By default, the skip/pause deadline hour is set to **21** (9 PM IST) as per platform regulations. The server strictly locks down milk order route changes after this hour for the next day's early morning deliveries.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Toggles Tab */}
            {activeTab === 'toggles' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-855 dark:text-white">System Feature Switches</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Configure active modules, gateways, and platform states.</p>
                </div>

                <div className="space-y-5">
                  {/* Toggle 1: Maintenance Mode */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/35 border border-slate-150 dark:border-slate-805 rounded-2xl">
                    <div className="text-left space-y-1 pr-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white leading-none">System Maintenance Mode</span>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-normal">
                        Enables a splash screen blocks for all customer dashboard edits, keeping the platform read-only.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={formState.maintenanceMode} 
                        onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Toggle 2: Razorpay */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/35 border border-slate-150 dark:border-slate-805 rounded-2xl">
                    <div className="text-left space-y-1 pr-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white leading-none">Razorpay Payments Gateway</span>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-normal">
                        Toggle to allow active digital order checkout, automated subscription payments, and online billing deposits.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={formState.razorpayEnabled} 
                        onChange={(e) => handleInputChange('razorpayEnabled', e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Toggle 3: WhatsApp */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/35 border border-slate-150 dark:border-slate-805 rounded-2xl">
                    <div className="text-left space-y-1 pr-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white leading-none">WhatsApp Notifications Channel</span>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-normal">
                        Enables dispatch of daily delivery receipts and bill reminders to users' registered WhatsApp numbers.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={formState.whatsappEnabled} 
                        onChange={(e) => handleInputChange('whatsappEnabled', e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* SUBMIT BUTTON FOOTER */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3.5">
            <button 
              type="button" 
              onClick={() => setFormState(initialConfigs)}
              className="px-5 py-2.5 text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all border-none cursor-pointer"
            >
              Reset Changes
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 hover:shadow-lg transition-all border-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98 min-w-[130px]"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} className="stroke-[2.5]" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  )
}
