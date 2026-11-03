'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileSpreadsheet, FileText, Download, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  exportCustomersToExcel,
  exportCustomersToPdf,
  ExportCustomer
} from '@/lib/customers/export-customers'

interface ExportCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  allCustomers: ExportCustomer[]
  filteredCustomers: ExportCustomer[]
  activeFilterId: string
  activeFilterLabel: string
  searchQuery?: string
}

export function ExportCustomerModal({
  isOpen,
  onClose,
  allCustomers,
  filteredCustomers,
  activeFilterId,
  activeFilterLabel,
  searchQuery = ''
}: ExportCustomerModalProps) {
  // Pre-calculate counts
  const subscribedCustomers = allCustomers.filter(c =>
    ['SUBSCRIBED_ACTIVE', 'ACTIVE_COVERED', 'TRIAL_ACTIVE'].includes(c.subscription_status)
  )
  const notSubscribedCustomers = allCustomers.filter(c =>
    ['NOT_SUBSCRIBED', 'CANCELLED', 'PAUSED'].includes(c.subscription_status)
  )
  const pendingDuesCustomers = allCustomers.filter(c =>
    c.subscription_status === 'PAYMENT_PENDING' || (c.pending_dues ?? 0) > 0
  )
  const renewalDueCustomers = allCustomers.filter(c =>
    ['UNRENEWED_ELIGIBLE', 'UNRENEWED_LAPSED', 'PENDING_RENEWAL'].includes(c.subscription_status)
  )

  const [selectedScope, setSelectedScope] = useState<'current' | 'all' | 'subscribed' | 'not_subscribed' | 'pending' | 'unrenewed'>(
    activeFilterId === 'all' && !searchQuery ? 'all' : 'current'
  )
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const getTargetData = () => {
    switch (selectedScope) {
      case 'all':
        return { data: allCustomers, title: 'All Customers' }
      case 'subscribed':
        return { data: subscribedCustomers, title: 'Subscribed Active Customers' }
      case 'not_subscribed':
        return { data: notSubscribedCustomers, title: 'Not Subscribed Customers' }
      case 'pending':
        return { data: pendingDuesCustomers, title: 'Pending Dues Customers' }
      case 'unrenewed':
        return { data: renewalDueCustomers, title: 'Renewal Due Customers' }
      case 'current':
      default: {
        const title = searchQuery
          ? `Current View (${activeFilterLabel} - Search '${searchQuery}')`
          : `Current View (${activeFilterLabel})`
        return { data: filteredCustomers, title }
      }
    }
  }

  const handleExport = (format: 'excel' | 'pdf') => {
    const { data, title } = getTargetData()

    if (!data || data.length === 0) {
      toast.error('No customer records match this filter to export')
      return
    }

    setIsExporting(true)
    try {
      if (format === 'excel') {
        exportCustomersToExcel(data, title)
        toast.success(`Exported ${data.length} records to Excel (.xlsx)!`)
      } else {
        exportCustomersToPdf(data, title)
        toast.success(`Exported ${data.length} records to PDF (.pdf)!`)
      }
      onClose()
    } catch (err: any) {
      console.error('Export Error:', err)
      toast.error('Failed to generate export file. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const scopeOptions = [
    {
      id: 'current',
      title: `Current Filtered View (${activeFilterLabel})`,
      count: filteredCustomers.length,
      subtitle: searchQuery ? `Includes current search filter: "${searchQuery}"` : 'Matches the table currently displayed',
      badge: 'Current View',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    },
    {
      id: 'all',
      title: 'All Registered Customers',
      count: allCustomers.length,
      subtitle: 'Complete master customer directory',
      badge: 'Full Master',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    },
    {
      id: 'subscribed',
      title: 'Subscribed (Active Plan)',
      count: subscribedCustomers.length,
      subtitle: 'Customers with an active daily delivery subscription',
      badge: 'Active Only',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    },
    {
      id: 'not_subscribed',
      title: 'Not Subscribed (Unsubscribed / Paused / Inactive)',
      count: notSubscribedCustomers.length,
      subtitle: 'Registered users without an active milk delivery plan',
      badge: 'Inactive / Leads',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    },
    {
      id: 'pending',
      title: 'Pending Dues Customers',
      count: pendingDuesCustomers.length,
      subtitle: 'Customers with outstanding balance or pending payment',
      badge: 'Needs Follow-up',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    }
  ]

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isExporting && onClose()}
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#014DA4] dark:text-blue-400 flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Export Customer Data
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Download filtered customer directory in Excel or PDF format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Section 1: Choose Dataset */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              1. Select Customer Group
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {scopeOptions.map((opt) => {
                const isSelected = selectedScope === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedScope(opt.id as any)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#014DA4] bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-[#014DA4] bg-[#014DA4]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                            {opt.title}
                          </p>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {opt.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                        {opt.count} users
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Choose Format & Export */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              2. Download Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Excel Button */}
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-emerald-500/20 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black">Download Excel</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Spreadsheet (.xlsx)</p>
                </div>
              </button>

              {/* PDF Button */}
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-rose-500/20 hover:border-rose-500 bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-800 dark:text-rose-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FileText size={20} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black">Download PDF</p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Printable Doc (.pdf)</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Includes Phone, Area, Address, Qty & Ledger
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )
}
