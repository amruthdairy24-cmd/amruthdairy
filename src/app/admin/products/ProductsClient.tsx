'use client'

import { useState } from 'react'
import { Package, Plus, X, Milk } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { useRouter } from 'next/navigation'

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock_available: number;
  is_active: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  quantity_litres: number;
  monthly_price: number;
  daily_rate: number;
  is_popular: boolean;
}

export function ProductsClient({ data, plans, milkPrices = {}, rawMilkPricing }: { data: Product[], plans: SubscriptionPlan[], milkPrices?: Record<string, number>, rawMilkPricing?: any }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editProductId, setEditProductId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    stock_available: '0',
    is_active: true
  })

  // Milk Pricing Modal State
  const [showMilkPriceModal, setShowMilkPriceModal] = useState(false)
  const [milkPricesForm, setMilkPricesForm] = useState({ '0.5': '41', '1.0': '82', '1.5': '124', '2.0': '165' })
  const [priceApplyMode, setPriceApplyMode] = useState<'next_month' | 'immediate'>('next_month')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [priceMessage, setPriceMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  const openMilkPriceModal = () => {
    const activePricesToEdit = rawMilkPricing?.next_prices || rawMilkPricing?.prices || milkPrices;
    setMilkPricesForm({
      '0.5': activePricesToEdit['0.5']?.toString() || '41.34',
      '1.0': activePricesToEdit['1.0']?.toString() || activePricesToEdit['1']?.toString() || '82.67',
      '1.5': activePricesToEdit['1.5']?.toString() || '124',
      '2.0': activePricesToEdit['2.0']?.toString() || activePricesToEdit['2']?.toString() || '165.34'
    })
    setShowMilkPriceModal(true)
  }

  const handleMilkPriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsUpdatingPrice(true)
      setPriceMessage(null)

      const numPrices = {
        '0.5': Number(milkPricesForm['0.5']),
        '1.0': Number(milkPricesForm['1.0']),
        '1.5': Number(milkPricesForm['1.5']),
        '2.0': Number(milkPricesForm['2.0'])
      }
      
      if (Object.values(numPrices).some(val => isNaN(val) || val <= 0)) {
        throw new Error("Please enter valid positive prices for all tiers.")
      }

      const body: any = { key: 'milk_tier_prices' };
      
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const effectiveDateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
      
      body.value = {
        prices: milkPrices,
        next_prices: numPrices,
        effective_date: effectiveDateStr
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to update price')

      setPriceMessage({ text: 'Milk prices updated successfully!', type: 'success' })
      setTimeout(() => {
        setShowMilkPriceModal(false)
        setPriceMessage(null)
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setPriceMessage({ text: err.message, type: 'error' })
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const method = editProductId ? 'PUT' : 'POST'
      const body = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        unit: formData.unit,
        stock_available: Number(formData.stock_available),
        is_active: formData.is_active,
        ...(editProductId && { id: editProductId })
      }

      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || `Failed to ${editProductId ? 'update' : 'add'} product`)

      setShowModal(false)
      setFormData({ name: '', category: '', price: '', unit: '', stock_available: '0', is_active: true })
      setEditProductId(null)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      unit: product.unit,
      stock_available: product.stock_available.toString(),
      is_active: product.is_active
    })
    setEditProductId(product.id)
    setShowModal(true)
  }

  const openAddModal = () => {
    setFormData({ name: '', category: '', price: '', unit: '', stock_available: '0', is_active: true })
    setEditProductId(null)
    setShowModal(true)
  }

  const productColumns: ColumnDef<Product>[] = [
    { header: 'Product Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Unit', accessorKey: 'unit' },
    { header: 'Price', align: 'right', cell: (row) => `₹${row.price}` },
    { header: 'Stock', accessorKey: 'stock_available', align: 'right' },
    { header: 'Status', align: 'center', cell: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} /> },
    { header: 'Actions', align: 'center', cell: (row) => (
      <button onClick={() => openEditModal(row)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
        Edit
      </button>
    ) },
  ]

  const planColumns: ColumnDef<SubscriptionPlan>[] = [
    { header: 'Plan Name', cell: (row) => <div className="font-bold text-[#0f172a] flex items-center gap-2"><Milk size={16} className="text-blue-600" /> {row.name}</div> },
    { header: 'Quantity/Day', cell: (row) => `${row.quantity_litres} L` },
    { header: 'Monthly Price', align: 'right', cell: (row) => `₹${row.monthly_price}` },
    { header: 'Daily Rate', align: 'right', cell: (row) => `₹${row.daily_rate}` },
    { header: 'Badge', align: 'center', cell: (row) => row.is_popular ? <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-700">POPULAR</span> : null },
    { header: 'Actions', align: 'center', cell: () => (
      <button onClick={openMilkPriceModal} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
        Edit Prices
      </button>
    ) },
  ]

  return (
    <div className="space-y-8">
      <AdminHeader 
        title="Products & Inventory" 
        description="Manage product catalog, pricing, and stock levels." 
        icon={Package} 
        actionLabel="Add Product" 
        onAction={openAddModal}
      />

      {/* MILK SUBSCRIPTION PLANS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-black text-[#0f172a] flex items-center gap-2">
            Milk Subscription Plans
          </h2>
          {rawMilkPricing?.next_prices && rawMilkPricing?.effective_date && (
            <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-bold flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              New prices pending for {new Date(rawMilkPricing.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
        <DataTable data={plans} columns={planColumns} />
      </div>

      {/* RETAIL PRODUCTS */}
      <div>
        <h2 className="text-[16px] font-black text-[#0f172a] mb-4">
          Retail Products
        </h2>
        <DataTable data={data} columns={productColumns} />
      </div>

      {/* ADD PRODUCT MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
                <Plus size={24} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{editProductId ? 'Edit Product' : 'Add New Product'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Product Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm" placeholder="e.g. Farm Paneer" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Category</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm" placeholder="e.g. dairy" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Unit</label>
                  <input required type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm" placeholder="e.g. 500g" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Price (₹)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Initial Stock</label>
                  <input required type="number" value={formData.stock_available} onChange={e => setFormData({...formData, stock_available: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm" placeholder="0" />
                </div>
              </div>

              {editProductId && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mt-2">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                    Product is Active
                  </label>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', padding: '16px', background: '#2563eb', color: '#fff', border: 'none',
                  borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1, marginTop: '24px',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                }}
              >
                {isSubmitting ? 'Saving Product...' : (editProductId ? 'Update Product' : 'Save Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MILK PRICE MODAL */}
      {showMilkPriceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a' }}>
                <Milk size={24} className="text-blue-600" />
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Update Milk Prices</h3>
              </div>
              <button onClick={() => setShowMilkPriceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            
            <form onSubmit={handleMilkPriceUpdate} className="space-y-4">
              <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                Set the new daily price for each tier explicitly. This allows custom prices for different quantities.
              </p>

              <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>0.5 L (₹)</label>
                  <input required type="number" step="0.01" value={milkPricesForm['0.5']} onChange={(e) => setMilkPricesForm({...milkPricesForm, '0.5': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>1.0 L (₹)</label>
                  <input required type="number" step="0.01" value={milkPricesForm['1.0']} onChange={(e) => setMilkPricesForm({...milkPricesForm, '1.0': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>1.5 L (₹)</label>
                  <input required type="number" step="0.01" value={milkPricesForm['1.5']} onChange={(e) => setMilkPricesForm({...milkPricesForm, '1.5': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>2.0 L (₹)</label>
                  <input required type="number" step="0.01" value={milkPricesForm['2.0']} onChange={(e) => setMilkPricesForm({...milkPricesForm, '2.0': e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 800 }} />
                </div>
              </div>



              {priceMessage && (
                <div style={{
                  padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                  background: priceMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: priceMessage.type === 'success' ? '#166534' : '#991b1b',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  {priceMessage.text}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isUpdatingPrice}
                style={{
                  width: '100%', padding: '16px', background: '#2563eb', color: '#fff', border: 'none',
                  borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: isUpdatingPrice ? 'not-allowed' : 'pointer',
                  opacity: isUpdatingPrice ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                }}
              >
                {isUpdatingPrice ? 'Updating...' : 'Confirm Update'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
