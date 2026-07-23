'use client'

import { useState, useMemo, useRef } from 'react'
import { 
  Package, 
  Plus, 
  X, 
  Milk, 
  ArrowUpRight, 
  AlertTriangle, 
  Search, 
  SlidersHorizontal, 
  Coins, 
  TrendingUp, 
  Check, 
  Info, 
  Layers,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DataTable, ColumnDef } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/Modal'

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock_available: number;
  is_active: boolean;
  image_url?: string | null;
  badge?: string | null;
  badge_icon?: string | null;
  tagline?: string | null;
  features?: string[];
  features_icons?: string[];
  is_subscription?: boolean;
  display_order?: number | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  quantity_litres: number;
  monthly_price: number;
  daily_rate: number;
  is_popular: boolean;
}

export function ProductsClient({ 
  data, 
  plans, 
  milkPrices = {}, 
  rawMilkPricing 
}: { 
  data: Product[], 
  plans: SubscriptionPlan[], 
  milkPrices?: Record<string, number>, 
  rawMilkPricing?: any 
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    stock_available: '0',
    is_active: true,
    image_url: '',
    badge: '',
    badge_icon: '',
    tagline: '',
    features: '',
    features_icons: '',
    is_subscription: false,
    display_order: '',
  })

  // Milk Pricing Modal State
  const [showMilkPriceModal, setShowMilkPriceModal] = useState(false)
  const [milkPricesForm, setMilkPricesForm] = useState({ '0.5': '41', '1.0': '82', '1.5': '124', '2.0': '165' })
  const [priceApplyMode, setPriceApplyMode] = useState<'next_month' | 'immediate'>('next_month')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [priceMessage, setPriceMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

  // Extract unique categories from data
  const categories = useMemo(() => {
    const cats = data.map(p => p.category?.toLowerCase() || 'general')
    return ['all', ...Array.from(new Set(cats))]
  }, [data])

  // Filter products based on search, stock and category filters
  const filteredProducts = useMemo(() => {
    return data.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const categoryName = product.category?.toLowerCase() || 'general'
      const categoryMatch = categoryName.includes(searchQuery.toLowerCase())
      const matchesSearch = nameMatch || categoryMatch

      const isOut = product.stock_available === 0
      const isLow = product.stock_available <= 5 && product.stock_available > 0

      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'outofstock' && isOut) ||
        (stockFilter === 'lowstock' && isLow) ||
        (stockFilter === 'instock' && !isOut && !isLow)

      const matchesCategory = 
        categoryFilter === 'all' || 
        categoryName === categoryFilter.toLowerCase()

      return matchesSearch && matchesStock && matchesCategory
    })
  }, [data, searchQuery, stockFilter, categoryFilter])

  // Stats Calculations
  const stats = useMemo(() => {
    const totalCount = data.length
    const lowStock = data.filter(p => p.stock_available <= 5).length
    const activeTiers = plans.length
    const standardPrice = milkPrices['1.0'] || milkPrices['1'] || 80

    return {
      totalCount,
      lowStock,
      activeTiers,
      standardPrice
    }
  }, [data, plans, milkPrices])

  const openMilkPriceModal = () => {
    const activePricesToEdit = rawMilkPricing?.next_prices || rawMilkPricing?.prices || milkPrices;
    setMilkPricesForm({
      '0.5': activePricesToEdit['0.5']?.toString() || '40',
      '1.0': activePricesToEdit['1.0']?.toString() || activePricesToEdit['1']?.toString() || '80',
      '1.5': activePricesToEdit['1.5']?.toString() || '120',
      '2.0': activePricesToEdit['2.0']?.toString() || activePricesToEdit['2']?.toString() || '160'
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

      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.message || 'Failed to update price')

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

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const EMPTY_FORM = {
    name: '', category: '', price: '', unit: '',
    stock_available: '0', is_active: true,
    image_url: '', badge: '', badge_icon: '', tagline: '',
    features: '', features_icons: '', is_subscription: false, display_order: '',
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      // 1. Upload image first if a new file was picked
      let finalImageUrl = formData.image_url
      if (pendingFile) {
        setIsUploadingImage(true)
        const fd = new FormData()
        fd.append('file', pendingFile)
        const uploadRes = await fetch('/api/admin/products/upload-image', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok || !uploadData.success) throw new Error(uploadData.message || 'Image upload failed')
        finalImageUrl = uploadData.url
        setIsUploadingImage(false)
      }

      // 2. Parse comma-separated feature/icon arrays
      const featuresArr = formData.features.split(',').map((s: string) => s.trim()).filter(Boolean)
      const iconsArr = formData.features_icons.split(',').map((s: string) => s.trim()).filter(Boolean)

      // 3. Submit product
      const method = editProductId ? 'PUT' : 'POST'
      const body = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        unit: formData.unit,
        stock_available: Number(formData.stock_available),
        is_active: formData.is_active,
        image_url: finalImageUrl || null,
        badge: formData.badge || null,
        badge_icon: formData.badge_icon || null,
        tagline: formData.tagline || null,
        features: featuresArr,
        features_icons: iconsArr,
        is_subscription: formData.is_subscription,
        display_order: formData.display_order ? Number(formData.display_order) : null,
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
      setFormData(EMPTY_FORM)
      setEditProductId(null)
      setPendingFile(null)
      setImagePreview('')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
      setIsUploadingImage(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return
    
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/admin/products?id=${deleteProductId}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to delete product')
      
      setDeleteProductId(null)
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
      is_active: product.is_active,
      image_url: product.image_url || '',
      badge: product.badge || '',
      badge_icon: product.badge_icon || '',
      tagline: product.tagline || '',
      features: (product.features || []).join(', '),
      features_icons: (product.features_icons || []).join(', '),
      is_subscription: product.is_subscription || false,
      display_order: product.display_order?.toString() || '',
    })
    setImagePreview(product.image_url || '')
    setPendingFile(null)
    setEditProductId(product.id)
    setErrorMsg(null)
    setShowModal(true)
  }

  const openAddModal = () => {
    setFormData({ name: '', category: '', price: '', unit: '', stock_available: '0', is_active: true, image_url: '', badge: '', badge_icon: '', tagline: '', features: '', features_icons: '', is_subscription: false, display_order: '' })
    setImagePreview('')
    setPendingFile(null)
    setEditProductId(null)
    setErrorMsg(null)
    setShowModal(true)
  }

  // Common initials avatar generator for consistent layout style
  const renderItemCell = (name: string, isMilk: boolean = false) => {
    const nameParts = name.trim().split(/\s+/)
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : (nameParts[0]?.[0] || 'P').toUpperCase()
      
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-violet-500 to-fuchsia-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600",
      "from-sky-500 to-blue-600"
    ]
    const charSum = name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
    const avatarBg = gradients[charSum % gradients.length]

    return (
      <div className="flex items-center gap-3.5">
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br shadow-3xs flex-shrink-0 select-none",
          avatarBg
        )}>
          {isMilk ? <Milk size={16} className="animate-pulse" /> : initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[13.5px] font-black text-slate-855 dark:text-slate-100 leading-tight">
            {name}
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            {isMilk ? 'Daily Plan' : 'Retail Product'}
          </p>
        </div>
      </div>
    )
  }

  /* ── RETAIL PRODUCT COLUMNS ── */
  const productColumns: ColumnDef<Product>[] = [
    { 
      header: 'Product Name', 
      cell: (row) => renderItemCell(row.name) 
    },
    { 
      header: 'Category', 
      cell: (row) => {
        const categoryColors: Record<string, string> = {
          dairy: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-150/30 text-blue-700 dark:text-blue-400",
          milk: "bg-sky-50/70 dark:bg-sky-950/20 border-sky-150/30 text-sky-700 dark:text-sky-400",
          ghee: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-150/30 text-amber-700 dark:text-amber-405",
          paneer: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-150/30 text-emerald-705 dark:text-emerald-400",
          curd: "bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-150/30 text-indigo-700 dark:text-indigo-400"
        }
        const cat = (row.category || 'general').toLowerCase()
        const theme = categoryColors[cat] || "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
        return (
          <span className={cn("inline-flex text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-3xs transition-all", theme)}>
            {row.category || 'general'}
          </span>
        )
      }
    },
    { 
      header: 'Unit', 
      cell: (row) => (
        <span className="text-[12.5px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
          {row.unit}
        </span>
      )
    },
    { 
      header: 'Price', 
      align: 'right', 
      cell: (row) => (
        <span className="text-[13.5px] font-black text-slate-850 dark:text-slate-100 font-mono">
          ₹{row.price.toFixed(2)}
        </span>
      ) 
    },
    { 
      header: 'Stock Status', 
      align: 'right', 
      cell: (row) => {
        const isLow = row.stock_available <= 5 && row.stock_available > 0
        const isOut = row.stock_available === 0
        return (
          <div className="text-right">
            <span className={cn(
              "text-[13.5px] font-black font-mono px-2 py-0.5 rounded-md",
              isOut 
                ? "text-red-600 dark:text-red-455 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30" 
                : isLow 
                  ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30" 
                  : "text-slate-700 dark:text-slate-305 bg-slate-50 dark:bg-slate-800/20 border border-slate-150/30"
            )}>
              {row.stock_available}
            </span>
            {isOut ? (
              <p className="text-[8.5px] font-black text-red-500 mt-1.5 uppercase tracking-widest leading-none">Out of stock</p>
            ) : isLow ? (
              <p className="text-[8.5px] font-bold text-amber-500 mt-1.5 uppercase tracking-widest leading-none">Low stock</p>
            ) : (
              <p className="text-[8.5px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest leading-none">Available</p>
            )}
          </div>
        )
      } 
    },
    { 
      header: 'Status', 
      align: 'center', 
      cell: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} /> 
    },
    { 
      header: 'Actions', 
      align: 'center', 
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => openEditModal(row)} 
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-[#014DA4] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-black rounded-xl transition-all shadow-3xs cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>Edit</span>
          </button>
          <button 
            onClick={() => setDeleteProductId(row.id)} 
            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-3xs cursor-pointer active:scale-95 rounded-xl"
            title="Delete Product"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) 
    },
  ]

  return (
    <div className="space-y-8">
      
      {/* PAGE HEADER */}
      <AdminHeader 
        title="Products & Inventory" 
        description="Manage product catalog, pricing, and stock levels." 
        icon={Package} 
        actionLabel="Add Product" 
        onAction={openAddModal}
      />

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Retail Catalog */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all duration-250 hover:-translate-y-0.5">
          <div className="text-left space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Retail Catalog</p>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-white">{stats.totalCount}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">Dairy & value-add items</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-[#014DA4] dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-3xs">
            <Package size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Metric 2: Active Tiers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all duration-250 hover:-translate-y-0.5">
          <div className="text-left space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Subscription Tiers</p>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-white">{stats.activeTiers}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">Daily doorstep plans</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-3xs">
            <Milk size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all duration-250 hover:-translate-y-0.5">
          <div className="text-left space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Low Stock Alerts</p>
            <h3 className={cn(
              "text-2xl sm:text-3xl font-black font-display",
              stats.lowStock > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-white"
            )}>{stats.lowStock}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              {stats.lowStock > 0 ? 'Requires replenishment' : 'All items well stocked'}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-3xs",
            stats.lowStock > 0 
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" 
              : "bg-slate-500/10 dark:bg-slate-500/20 text-slate-500"
          )}>
            <AlertTriangle size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Metric 4: Standard Milk Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all duration-250 hover:-translate-y-0.5">
          <div className="text-left space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Standard Milk Rate</p>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-white font-mono">₹{stats.standardPrice}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">Per Litre base pricing</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-3xs">
            <Coins size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* MILK SUBSCRIPTION PLANS CARDS GRID */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div>
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white flex items-center gap-2">
              Milk Subscription Plans
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-bold">
              Manage base volumetric rates and scheduling options
            </p>
          </div>
          <div className="flex items-center gap-3">
            {rawMilkPricing?.next_prices && rawMilkPricing?.effective_date && (
              <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-full text-amber-700 dark:text-amber-400 text-[11px] font-extrabold flex items-center gap-2 shadow-3xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>New prices pending for {new Date(rawMilkPricing.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            <button 
              onClick={openMilkPriceModal} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-650 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
            >
              <span>Edit Base Prices</span>
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 4-Column Pricing Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => {
            const isPopular = plan.is_popular
            return (
              <div 
                key={plan.id}
                className={cn(
                  "relative rounded-3xl p-6 flex flex-col justify-between h-[230px] transition-all duration-300 border shadow-3xs hover:shadow-sm hover:-translate-y-1 group",
                  isPopular 
                    ? "bg-gradient-to-b from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/5 border-blue-300 dark:border-blue-800 shadow-blue-500/5" 
                    : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800"
                )}
              >
                {/* Popular Corner Indicator */}
                {isPopular && (
                  <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/20 shadow-3xs select-none">
                    POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  {/* Top line with Icon & Volume */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-3xs",
                      isPopular ? "from-blue-600 to-indigo-600" : "from-slate-550 to-slate-650"
                    )}>
                      <Milk size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Volume</p>
                      <h4 className="text-lg font-black text-slate-805 dark:text-white mt-1 leading-none">
                        {plan.quantity_litres} Litres
                      </h4>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 text-left pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Monthly</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                        ₹{plan.monthly_price}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">/mo</span>
                    </div>
                  </div>
                </div>

                {/* Daily Rate Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-2 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Rate</span>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                      ₹{plan.daily_rate.toFixed(2)}
                    </p>
                  </div>
                  <button 
                    onClick={openMilkPriceModal} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer border-none bg-transparent"
                  >
                    <span>Change</span>
                    <ArrowUpRight size={10} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RETAIL PRODUCTS CATALOG */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div>
            <h2 className="text-[16px] font-black text-slate-900 dark:text-white">
              Retail Products Catalog
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-bold">
              Manage catalog records, package sizes, pricing, and stock updates
            </p>
          </div>
        </div>

        {/* Search & Filter Control Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-3xs flex flex-col md:flex-row md:items-center gap-4">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or category..." 
              className="w-full pl-10 pr-12 py-2.5 text-[13px] rounded-xl outline-none focus:ring-2 focus:ring-[#014DA4]/10 dark:focus:ring-blue-500/15 transition-all font-semibold placeholder:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-200 h-11"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs border-none cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Filters Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl px-3 h-11">
              <SlidersHorizontal size={14} className="text-slate-400 dark:text-slate-500" />
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 pr-1 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Stock Level Filter Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl px-3 h-11">
              <span className="text-xs font-bold text-slate-400">Stock:</span>
              <select 
                value={stockFilter} 
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 pr-1 cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="instock">In Stock</option>
                <option value="lowstock">Low Stock (≤5)</option>
                <option value="outofstock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {(searchQuery || stockFilter !== 'all' || categoryFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setStockFilter('all')
                  setCategoryFilter('all')
                }}
                className="px-4 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all border-none cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* DataTable Wrapper */}
        <div className="pt-1">
          <DataTable data={filteredProducts} columns={productColumns} />
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 w-full max-w-[540px] shadow-2xl relative text-slate-900 dark:text-slate-100 my-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <Package size={24} className="text-[#014DA4] dark:text-blue-400" />
                <h3 className="text-xl font-black font-display m-0">
                  {editProductId ? 'Edit Product' : 'Add New Product'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowModal(false); setPendingFile(null); setImagePreview('') }} 
                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none cursor-pointer flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-slate-450 dark:text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4">

              {/* ── Core Info ── */}
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Product Name</label>
                <input 
                  required type="text" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                  placeholder="e.g. Premium Farm Paneer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Category</label>
                  <select
                    required value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                  >
                    <option value="">Select…</option>
                    <option value="milk">Milk</option>
                    <option value="curd">Curd</option>
                    <option value="ghee">Ghee</option>
                    <option value="buttermilk">Buttermilk</option>
                    <option value="paneer">Paneer</option>
                    <option value="butter">Butter</option>
                    <option value="honey">Honey</option>
                    <option value="dairy">Dairy</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Package Unit</label>
                  <input
                    required type="text" value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                    placeholder="e.g. 500g, 1L"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Price (₹)</label>
                  <input
                    required type="number" step="0.01" value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-black font-mono transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Inventory Stock</label>
                  <input
                    required type="number" value={formData.stock_available}
                    onChange={e => setFormData({...formData, stock_available: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-black font-mono transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* ── Storefront Display Metadata ── */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-[#014DA4] dark:text-blue-400" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Storefront Display</span>
                </div>

                {/* Image Upload */}
                <div className="flex gap-4 items-start text-left">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imagePreview
                      ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      : <ImageIcon size={24} className="text-slate-300 dark:text-slate-700" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFilePick} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:border-[#014DA4] hover:text-[#014DA4] transition-all flex items-center justify-center gap-2 cursor-pointer bg-transparent"
                    >
                      <Upload size={13} />
                      {pendingFile ? pendingFile.name.substring(0, 26) : 'Choose image…'}
                    </button>
                    {formData.image_url && !pendingFile && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-400 truncate flex-1">Current: {formData.image_url.split('/').pop()}</p>
                        <button type="button" onClick={() => { setFormData({...formData, image_url: ''}); setImagePreview('') }} className="text-[10px] text-red-400 hover:text-red-600 font-bold border-none bg-transparent cursor-pointer">Remove</button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400">JPEG, PNG, WEBP up to 5 MB. Uploaded on save.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Badge Text</label>
                    <input
                      type="text" value={formData.badge}
                      onChange={e => setFormData({...formData, badge: e.target.value})}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                      placeholder="e.g. Farm Fresh"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Badge Icon (emoji)</label>
                    <input
                      type="text" value={formData.badge_icon}
                      onChange={e => setFormData({...formData, badge_icon: e.target.value})}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                      placeholder="e.g. 🌱"
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Tagline</label>
                  <input
                    type="text" value={formData.tagline}
                    onChange={e => setFormData({...formData, tagline: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                    placeholder="e.g. Delivered Before Sunrise"
                  />
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Features (comma-separated)</label>
                  <input
                    type="text" value={formData.features}
                    onChange={e => setFormData({...formData, features: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                    placeholder="e.g. 100% Pure, No Additives, A2 Certified"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Each comma-separated item becomes a feature pill on the storefront</p>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Feature Icons (comma-separated, same order)</label>
                  <input
                    type="text" value={formData.features_icons}
                    onChange={e => setFormData({...formData, features_icons: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                    placeholder="e.g. 🥛, 🧪, 🛡️"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">Display Order</label>
                    <input
                      type="number" value={formData.display_order}
                      onChange={e => setFormData({...formData, display_order: e.target.value})}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014DA4]/15 focus:border-[#014DA4]/45 text-slate-900 dark:text-white text-sm font-mono font-black transition-all"
                      placeholder="1, 2, 3…"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox" checked={formData.is_subscription}
                        onChange={e => setFormData({...formData, is_subscription: e.target.checked})}
                        className="w-4 h-4 rounded accent-[#014DA4] border-slate-300 dark:border-slate-800"
                      />
                      <span>Subscription<br/><span className="text-[10px] font-semibold text-slate-400">Shows Subscribe CTA</span></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Status (edit only) ── */}
              {editProductId && (
                <div className="pt-1 text-left">
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox" checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded text-[#014DA4] focus:ring-[#014DA4]/20 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 accent-[#014DA4]"
                    />
                    <span>This product is active in store</span>
                  </label>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-955/30 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/50 flex items-start gap-2">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#014DA4] hover:bg-[#014da4]/95 text-white border-none rounded-xl text-sm font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/10 mt-2 active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? (isUploadingImage ? 'Uploading image…' : 'Saving…')
                  : (editProductId ? 'Update Product' : 'Save Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MILK PRICE UPDATE MODAL */}
      {showMilkPriceModal && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 w-full max-w-[500px] shadow-2xl relative text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <Milk size={24} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-black font-display m-0">Configure Daily Milk Rates</h3>
              </div>
              <button 
                onClick={() => setShowMilkPriceModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none cursor-pointer flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-slate-450 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white" />
              </button>
            </div>
            
            <form onSubmit={handleMilkPriceUpdate} className="space-y-6">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed text-left">
                Specify the daily pricing for each milk delivery quantity tier. Updates apply to standard subscription accounts.
              </p>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">0.5 L Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={milkPricesForm['0.5']} 
                    onChange={(e) => setMilkPricesForm({...milkPricesForm, '0.5': e.target.value})} 
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-slate-900 dark:text-white text-base font-black font-mono transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">1.0 L Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={milkPricesForm['1.0']} 
                    onChange={(e) => setMilkPricesForm({...milkPricesForm, '1.0': e.target.value})} 
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-slate-900 dark:text-white text-base font-black font-mono transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">1.5 L Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={milkPricesForm['1.5']} 
                    onChange={(e) => setMilkPricesForm({...milkPricesForm, '1.5': e.target.value})} 
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-slate-900 dark:text-white text-base font-black font-mono transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">2.0 L Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={milkPricesForm['2.0']} 
                    onChange={(e) => setMilkPricesForm({...milkPricesForm, '2.0': e.target.value})} 
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-slate-900 dark:text-white text-base font-black font-mono transition-all" 
                  />
                </div>
              </div>

              {/* Effective Time Selection Card */}
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-widest">
                  When should new pricing apply?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={cn(
                    "flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all duration-200 bg-slate-50/20 dark:bg-slate-950/10",
                    priceApplyMode === 'next_month' 
                      ? "border-blue-500 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/15 shadow-3xs" 
                      : "border-slate-200 dark:border-slate-800"
                  )}>
                    <input 
                      type="radio" 
                      name="applyModeMilk" 
                      checked={priceApplyMode === 'next_month'} 
                      onChange={() => setPriceApplyMode('next_month')} 
                      className="accent-blue-600 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      Next Billing Cycle<br/>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Recommended</span>
                    </span>
                  </label>
                  <label className={cn(
                    "flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all duration-200 bg-slate-50/20 dark:bg-slate-950/10",
                    priceApplyMode === 'immediate' 
                      ? "border-blue-500 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/15 shadow-3xs" 
                      : "border-slate-200 dark:border-slate-800"
                  )}>
                    <input 
                      type="radio" 
                      name="applyModeMilk" 
                      checked={priceApplyMode === 'immediate'} 
                      onChange={() => setPriceApplyMode('immediate')} 
                      className="accent-blue-600 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      Immediately<br/>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Applies starting today</span>
                    </span>
                  </label>
                </div>
              </div>

              {priceMessage && (
                <div className={cn(
                  "p-4 rounded-xl text-xs font-bold flex items-center gap-2",
                  priceMessage.type === 'success' 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50" 
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-350 border border-rose-100 dark:border-rose-900/50"
                )}>
                  {priceMessage.type === 'success' ? <Check size={14} className="text-emerald-500" /> : <Info size={14} className="text-rose-500" />}
                  <span>{priceMessage.text}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isUpdatingPrice}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-650 text-white border-none rounded-xl text-sm font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md shadow-blue-500/15 active:scale-98"
              >
                {isUpdatingPrice ? 'Saving Price Config...' : 'Confirm Pricing Updates'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteProductId && (
        <ConfirmModal
          open={!!deleteProductId}
          onOpenChange={(open) => {
            if (!open) setDeleteProductId(null)
          }}
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteProduct}
          loading={isSubmitting}
          danger={true}
        />
      )}
    </div>
  )
}
