'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DELIVERY_TIME_PROMISE } from '@/lib/constants'
import {
  ShoppingBag, Plus, Minus, CheckCircle2, ArrowRight,
  Truck, ShieldCheck, MapPin, Phone, User, Clock, AlertCircle, Sparkles, Loader2, Image as ImageIcon
} from 'lucide-react'
import { useDeliveryAreas } from '@/hooks/useDeliveryAreas'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface Product {
  id: string
  name: string
  price: number
  unit: string
  category: string
  image_url: string | null
  stock: number
  is_active: boolean
  tagline?: string
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('product_id')

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  // Customer Details Form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const { areas: DELIVERY_AREAS, loading: areasLoading } = useDeliveryAreas()
  const [area, setArea] = useState<string>('')

  // Set default area when areas load
  useEffect(() => {
    if (DELIVERY_AREAS.length > 0 && !area) {
      setArea(DELIVERY_AREAS[0])
    }
  }, [DELIVERY_AREAS, area])
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    order_id: string
    total_amount: number
    delivery_date: string
  } | null>(null)

  // Pre-fill profile if logged in
  useEffect(() => {
    fetch('/api/customer/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.profile) {
          if (data.profile.full_name) setFullName(data.profile.full_name)
          if (data.profile.phone) setPhone(data.profile.phone)
          if (data.profile.address) setAddress(data.profile.address)
          if (data.profile.area) {
            setArea(data.profile.area)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Fetch product details
  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (data.success && data.products) {
          const found = data.products.find((p: Product) => p.id === productId)
          if (found) {
            setProduct(found)
          } else if (data.products.length > 0) {
            setProduct(data.products[0])
          }
        }
      } catch (err) {
        console.error('Failed to fetch product for checkout', err)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [productId])

  // Load official Razorpay checkout script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const subtotal = product ? Math.round(product.price * quantity * 100) / 100 : 0
  const deliveryFee = 0 // Free delivery promise
  const totalAmount = subtotal + deliveryFee

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return

    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number'); return
    }
    if (!address.trim()) { setError('Please enter your delivery street address'); return }
    if (!area) { setError('Please select your delivery area in Mangaluru'); return }

    setError('')
    setSubmitting(true)

    try {
      // Step 1: Create Real Razorpay Order
      const rzpRes = await fetch('/api/products/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: product.id, quantity }]
        })
      })

      const rzpData = await rzpRes.json()
      if (!rzpData.success) {
        setError(rzpData.message || 'Failed to initialize Razorpay payment gateway')
        setSubmitting(false)
        return
      }

      // Step 2: Open Real Razorpay UI Modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Amruth Dairy',
        description: `Order: ${quantity}x ${product.name}`,
        order_id: rzpData.order_id,
        prefill: {
          name: fullName,
          contact: phone,
        },
        theme: {
          color: '#02429C'
        },
        handler: async function (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) {
          // Step 3: Complete Order Creation on Payment Success
          try {
            const orderRes = await fetch('/api/products/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: [{ product_id: product.id, quantity }],
                customer_info: {
                  full_name: fullName,
                  phone,
                  delivery_address: address,
                  area,
                  landmark,
                  delivery_notes: deliveryNotes
                },
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            const orderData = await orderRes.json()
            if (orderData.success) {
              setOrderResult({
                order_id: orderData.order_id,
                total_amount: orderData.total_amount,
                delivery_date: orderData.delivery_date
              })
              setOrderSuccess(true)
            } else {
              setError(orderData.message || 'Payment received, but failed to record order. Please contact support.')
            }
          } catch (err) {
            console.error('Order verification error', err)
            setError('Payment succeeded but verification failed. Please contact support.')
          } finally {
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false)
          }
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        setError('Razorpay SDK failed to load. Please refresh and try again.')
        setSubmitting(false)
      }

    } catch (err) {
      console.error('Checkout error:', err)
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#02429C] animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  // SUCCESS CONFIRMATION VIEW
  if (orderSuccess && orderResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="pt-28 md:pt-32 pb-16 px-4 max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                Payment Successful
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Order Confirmed!
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Thank you, <strong className="text-slate-800">{fullName}</strong>! Your order has been placed.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Order Reference</span>
                <span className="font-mono font-bold text-slate-800">{orderResult.order_id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Item</span>
                <span className="font-bold text-slate-800">{quantity}x {product?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Total Paid</span>
                <span className="font-extrabold text-emerald-600">₹{orderResult.total_amount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Delivery Area</span>
                <span className="font-bold text-slate-800">{area}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-medium">Delivery Estimate</span>
                <span className="font-extrabold text-[#02429C]">Tomorrow (5:00 - 7:00 AM)</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/#" className="flex-1 py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors text-center">
                Back to Home
              </Link>
              <Link href="/subscribe" className="flex-1 py-3.5 px-5 rounded-xl bg-[#02429C] hover:bg-[#013378] text-white font-bold text-sm transition-colors text-center shadow-md">
                Explore Milk Subscription →
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="pt-28 md:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex-1">
        
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#02429C] text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag size={14} /> Express Direct Checkout
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-cabinet">
            Complete Your Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Doorstep sunrise delivery across Mangaluru • Safe Razorpay Online Payment
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Customer Address & Details Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Contact Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#02429C]/10 text-[#02429C] flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Customer Contact</h2>
                  <p className="text-xs text-slate-500">No login required for express product delivery</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Shetty"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#02429C] focus:border-transparent text-sm text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit phone number"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#02429C] focus:border-transparent text-sm text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Location & Area Selection */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#02429C]/10 text-[#02429C] flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mangaluru Delivery Address</h2>
                  <p className="text-xs text-slate-500">We deliver every morning 5:00 AM – 7:00 AM</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Delivery Area in Mangaluru *
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#02429C]" />
                  <select
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#02429C] focus:border-transparent text-sm text-slate-900 font-bold bg-white"
                  >
                    {areasLoading ? (
                    <option value="" disabled>Loading areas...</option>
                  ) : (
                    DELIVERY_AREAS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))
                  )}
                  </select>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Doorstep delivery available in {area}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Street Address / House No / Building *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Flat 302, Green Valley Apartments, Main Road"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#02429C] focus:border-transparent text-sm text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite SBI Bank"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#02429C] focus:border-transparent text-sm text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leave bag at door gate"
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#02429C] focus:border-transparent text-sm text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Order Summary Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-200/80 sticky top-28 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-lg font-cabinet">Order Summary</h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <Truck size={12} /> Sunrise Delivery
                </span>
              </div>

              {/* Selected Product Card */}
              {product && (
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <ImageIcon size={20} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">₹{product.price} / {product.unit}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">In Stock ({product.stock} left)</p>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Quantity</span>
                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors font-bold"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-extrabold text-slate-900 text-sm w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(product?.stock || 10, q + 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal ({quantity}x)</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge ({area})</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-base pt-3 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="text-[#02429C] text-xl">₹{totalAmount}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="submit"
                disabled={submitting || !product}
                className="w-full py-4 px-6 rounded-2xl bg-[#02429C] hover:bg-[#013378] text-white font-extrabold text-base transition-all duration-200 shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Opening Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{totalAmount} with Razorpay</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="pt-2 flex items-center justify-center gap-4 text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> 100% Safe Payment</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock size={14} className="text-[#02429C]" /> 5 AM Sunrise Promise</span>
              </div>

            </div>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#02429C] animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
