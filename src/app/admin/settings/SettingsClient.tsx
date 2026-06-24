'use client'

import { Settings as SettingsIcon, Save } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'

export function SettingsClient({ 
  businessName, 
  supportPhone, 
  maintenanceMode 
}: { 
  businessName: string, 
  supportPhone: string, 
  maintenanceMode: boolean 
}) {
  return (
    <div>
      <AdminHeader title="Settings" description="Configure application preferences and system variables." icon={SettingsIcon} />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 max-w-4xl">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">General Configuration</h2>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business Name</label>
              <input type="text" defaultValue={businessName} className="w-full px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Phone</label>
              <input type="text" defaultValue={supportPhone} className="w-full px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={maintenanceMode} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Maintenance Mode</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-855 flex justify-end gap-3">
            <button type="button" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">Cancel</button>
            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm transition-all">
              <Save size={16} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
