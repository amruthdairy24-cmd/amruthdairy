'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, User } from 'lucide-react'

interface Customer {
  id: string
  full_name: string
  phone: string
  area: string
  is_active: boolean
  has_subscription?: boolean
}

interface SelectCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (customerId: string, customerName: string, customer: Customer) => void
  actionContext?: { title: string; subtitle: string }
  filter?: 'unpaid' | 'all'
}

export function SelectCustomerModal({ isOpen, onClose, onSelect, actionContext, filter }: SelectCustomerModalProps) {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setCustomers([])
      return
    }

    const fetchCustomers = async () => {
      setLoading(true)
      try {
        const url = `/api/admin/customers/search?q=${encodeURIComponent(query)}${filter ? `&filter=${filter}` : ''}`
        const res = await fetch(url)
        const json = await res.json()
        if (json.data) {
          setCustomers(json.data)
        }
      } catch (err) {
        console.error('Failed to search customers', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchCustomers()
    }, 300)

    return () => clearTimeout(timer)
  }, [isOpen, query])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight">{actionContext?.title || 'Select Customer'}</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{actionContext?.subtitle || 'Choose a customer'}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search customers by name..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-6 pt-2 h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <User size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-bold">No customers found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {customers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c.id, c.full_name, c)}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {c.full_name}
                          {!c.is_active && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">INACTIVE</span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          {c.phone} {c.area && `• ${c.area}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
