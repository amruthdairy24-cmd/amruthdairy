import { OrdersClient } from './OrdersClient'

export const metadata = {
  title: 'Product Orders | Amruth Dairy Admin',
  description: 'Manage standalone product orders, customer delivery locations, and Razorpay payments',
}

export default function AdminOrdersPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-cabinet">
          Product Orders
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track customer product purchases, delivery addresses in Mangaluru, and Razorpay payment status
        </p>
      </div>

      <OrdersClient />

    </div>
  )
}
