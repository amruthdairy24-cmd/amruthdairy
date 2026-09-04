'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Phone, MapPin, AlertTriangle, Trash2, Search, MessageCircleMore } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'
import { AddCustomerModal } from '@/components/admin/AddCustomerModal'
import { CustomerActionsMenu } from '@/components/admin/CustomerActionsMenu'
import { AdminSkipModal } from '@/components/admin/AdminSkipModal'
import { AdminExtraMilkModal } from '@/components/admin/AdminExtraMilkModal'
import { AdminSubscriptionModal } from '@/components/admin/AdminSubscriptionModal'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  area: string;
  address: string | null;
  landmark: string | null;
  floor_notes: string | null;
  subscription_status: string;
  created_at: string;
  quantity_litres: number | null;
  start_date: string | null;
  monthly_amount: number | null;
  daily_rate: number | null;
  delivery_notes: string | null;
}

export function CustomersClient({ data }: { data: Customer[] }) {
  const router = useRouter()
  const [viewingEntry, setViewingEntry] = useState<Customer | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  
  // Actions Modals State
  const [actionCustomer, setActionCustomer] = useState<Customer | null>(null)
  const [activeModal, setActiveModal] = useState<'subscription' | 'skip' | 'extra' | 'vacation' | null>(null)

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'subscribed' | 'unrenewed' | 'pending' | 'not_subscribed'>('all')

  const confirmDelete = async () => {
    if (!customerToDelete) return
    setIsDeleting(true)
    
    try {
      const res = await fetch(`/api/admin/customers?id=${customerToDelete.id}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Customer deleted successfully')
        router.refresh()
        setCustomerToDelete(null)
      } else {
        toast.error(data.message || 'Failed to delete customer')
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while deleting the customer')
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Format dates cleanly like "24 Jun 2026"
  const buildWhatsAppUrl = (customer: Customer) => {
    const digits = (customer.phone || '').replace(/\D/g, '')
    if (!digits) return ''
    const normalized = digits.length === 10 ? `91${digits}` : digits
    const message = encodeURIComponent(
      `Hi ${customer.full_name || 'there'}, this is Amruth Dairy. ` +
      `We would like to discuss your milk subscription.`
    )
    return `https://wa.me/${normalized}?text=${message}`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED_ACTIVE':
        return { label: 'Active Plan', type: 'success' as const }
      case 'TRIAL_ACTIVE':
        return { label: 'Trial Active', type: 'info' as const }
      case 'PAYMENT_PENDING':
        return { label: 'Payment Pending', type: 'warning' as const }
      case 'UNRENEWED_ELIGIBLE':
        return { label: 'Renewal Due', type: 'warning' as const }
      case 'PAUSED':
        return { label: 'Paused', type: 'info' as const }
      case 'CANCELLED':
        return { label: 'Cancelled', type: 'danger' as const }
      case 'NOT_SUBSCRIBED':
      default:
        return { label: 'Not Subscribed', type: 'danger' as const }
    }
  }

  const columns: ColumnDef<Customer>[] = [
    { 
      header: 'Name', 
      cell: (row) => {
        // Generate beautiful gradient avatars based on name initials
        const nameParts = row.full_name ? row.full_name.trim().split(/\s+/) : [];
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : (nameParts[0]?.[0] || 'C').toUpperCase();
          
        // List of bright, premium gradients for avatars
        const gradients = [
          "from-blue-500 to-indigo-600",
          "from-violet-500 to-fuchsia-600",
          "from-emerald-500 to-teal-600",
          "from-amber-500 to-orange-600",
          "from-rose-500 to-pink-600",
          "from-sky-500 to-blue-600"
        ];
        
        // Pick a gradient deterministically based on character code sum of full name
        const charSum = row.full_name ? row.full_name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) : 0;
        const avatarBg = gradients[charSum % gradients.length];

        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs flex-shrink-0",
              avatarBg
            )}>
              {initials}
            </div>
            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {row.full_name || 'Unnamed Customer'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                ID: #{row.id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Phone', 
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-600 dark:text-slate-300">
          <Phone size={13} className="text-slate-400 dark:text-slate-550 flex-shrink-0" />
          <span>{row.phone || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Area/Pin', 
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-600 dark:text-slate-300">
          <MapPin size={13} className="text-slate-400 dark:text-slate-550 flex-shrink-0" />
          <span>{row.area || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Joined', 
      cell: (row) => (
        <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
          {formatDate(row.created_at)}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      align: 'center',
      cell: (row) => {
        const badgeConfig = getStatusBadgeConfig(row.subscription_status);
        return (
          <div className="flex justify-center">
            <StatusBadge status={badgeConfig.label} type={badgeConfig.type} />
          </div>
        );
      }
    },
  ]

  const filteredData = data.filter(customer => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = customer.full_name?.toLowerCase().includes(q)
      const matchesPhone = customer.phone?.includes(q)
      const matchesArea = customer.area?.toLowerCase().includes(q)
      const matchesId = customer.id.toLowerCase().includes(q)
      if (!matchesName && !matchesPhone && !matchesArea && !matchesId) return false
    }

    if (filterStatus === 'subscribed') {
      return customer.subscription_status === 'SUBSCRIBED_ACTIVE' || customer.subscription_status === 'TRIAL_ACTIVE'
    }
    if (filterStatus === 'unrenewed') {
      return customer.subscription_status === 'UNRENEWED_ELIGIBLE'
    }
    if (filterStatus === 'pending') {
      return customer.subscription_status === 'PAYMENT_PENDING'
    }
    if (filterStatus === 'not_subscribed') {
      return ['NOT_SUBSCRIBED', 'CANCELLED', 'PAUSED'].includes(customer.subscription_status)
    }

    return true
  })

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Customers" 
        description="Manage your customer database and profiles." 
        icon={Users} 
        actionLabel="Add Customer"
        onAction={() => setShowAddCustomer(true)}
      />

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Search by name, phone, area, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition-colors"
          />
        </div>
        
        <div className="flex w-full sm:w-auto bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-1 shadow-2xs transition-colors overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'subscribed', label: 'Active Plan' },
            { id: 'unrenewed', label: 'Renewal Due' },
            { id: 'pending', label: 'Payment Pending' },
            { id: 'not_subscribed', label: 'Not Subscribed' }
          ].map(status => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id as any)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                filterStatus === status.id 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable 
        data={filteredData} 
        columns={columns} 
        onView={(row) => setViewingEntry(row)} 
        onDelete={(row) => setCustomerToDelete(row)}
        renderActions={(row) => {
          const whatsappUrl = buildWhatsAppUrl(row)
          return (
            <div className="flex items-center gap-1.5">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-colors cursor-pointer w-[30px] h-[30px]"
                  title="Message on WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircleMore size={14} />
                </a>
              )}
              <CustomerActionsMenu 
                onManageSubscription={() => { setActionCustomer(row); setActiveModal('subscription') }}
                onMarkSkip={() => { setActionCustomer(row); setActiveModal('skip') }}
                onAddExtraMilk={() => { setActionCustomer(row); setActiveModal('extra') }}
              />
            </div>
          )
        }}
      />

      <RowDetailsModal
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Customer Details"
        data={viewingEntry}
      />

      <AddCustomerModal 
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={() => router.refresh()}
      />

      {/* Action Modals */}
      {actionCustomer && (
        <>
          <AdminSkipModal
            key={`${actionCustomer.id}-${activeModal === 'skip' ? 'open' : 'closed'}`}
            isOpen={activeModal === 'skip'}
            onClose={() => { setActiveModal(null); setActionCustomer(null) }}
            onSuccess={() => router.refresh()}
            customerId={actionCustomer.id}
            customerName={actionCustomer.full_name}
          />
          <AdminExtraMilkModal
            isOpen={activeModal === 'extra'}
            onClose={() => { setActiveModal(null); setActionCustomer(null) }}
            onSuccess={() => router.refresh()}
            customerId={actionCustomer.id}
            customerName={actionCustomer.full_name}
          />

          <AdminSubscriptionModal
            isOpen={activeModal === 'subscription'}
            onClose={() => { setActiveModal(null); setActionCustomer(null) }}
            onSuccess={() => router.refresh()}
            customerId={actionCustomer.id}
            customerName={actionCustomer.full_name}
          />
        </>
      )}

      <AnimatePresence>
        {customerToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setCustomerToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Customer?</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-8">
                  Are you sure you want to permanently delete <strong className="text-slate-700 dark:text-slate-300">{customerToDelete.full_name}</strong>? This action cannot be undone and will erase all associated data.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setCustomerToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors flex justify-center items-center gap-2 shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

