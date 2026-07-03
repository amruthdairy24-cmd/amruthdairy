'use client'

import Script from 'next/script'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Calendar, ShieldCheck, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SubscriptionCalendar from '@/components/SubscriptionCalendar'
import { calculateDailyRate, fetchMilkPricesClient } from '@/lib/billing'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface RenewData {
  success: boolean;
  message?: string;
  previousMonth: {
    quantity_litres: number;
    daily_rate: number;
    excluded_dates: string[];
  };
  upcoming_adjustments: any[];
}

function RenewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetMonth = searchParams.get('month')
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RenewData | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [excludedDates, setExcludedDates] = useState<string[]>([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [milkPrices, setMilkPrices] = useState<Record<string, number>>({})

  // Parse the target month for display
  const targetDate = useMemo(() => {
    if (targetMonth) return new Date(targetMonth);
    const d = new Date();
    if (d.getDate() >= 25) {
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
    return d;
  }, [targetMonth]);
  const monthName = targetDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  useEffect(() => {
    async function loadPrice() {
      const prices = await fetchMilkPricesClient()
      setMilkPrices(prices)
    }
    loadPrice()
  }, [])
  
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch the previous settings (we can just use the dashboard data for this)
        const res = await fetch('/api/customer/dashboard')
        const json = await res.json()
        if (json.success && json.subscription) {
          setData({
            success: true,
            previousMonth: {
              quantity_litres: json.subscription.quantity_litres,
              daily_rate: json.subscription.daily_rate,
              excluded_dates: json.excluded_dates || []
            },
            upcoming_adjustments: json.upcoming_adjustments || []
          })
          setQuantity(json.subscription.quantity_litres)
          
          // `json.excluded_dates` is now an array of string dates (e.g. '2026-06-07')
          // We want to map the days of the week of these dates to the targetMonth
          const pastExcluded: string[] = json.excluded_dates || [];
          const initialDates: string[] = [];
          
          if (pastExcluded.length > 0) {
            // Find unique days of the week from past excluded dates
            const excludedDaysOfWeek = new Set(
              pastExcluded.map(dStr => new Date(dStr).getDay())
            );
            
            // Map those days of the week to the target month
            const start = new Date(targetMonth || new Date());
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            let current = new Date(start);
            while (current <= end) {
              if (excludedDaysOfWeek.has(current.getDay())) {
                initialDates.push(current.toISOString().split('T')[0]);
              }
              current.setDate(current.getDate() + 1);
            }
          }
          
          setExcludedDates(initialDates)
          
          // Toast reminder
          toast('We have pre-filled your plan from last month. You can adjust it below if needed.', {
            icon: 'ℹ️',
            duration: 5000
          })
        } else {
          router.push('/dashboard')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, targetMonth])

  const calculateRemainingDays = () => {
    if (!targetMonth) return 30; // fallback
    const start = new Date(targetMonth);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // last day of month
    
    // If target month is current month, and today is past the 1st, pro-rate it
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let days = end.getDate();
    
    if (today >= start && today <= end) {
      // Pro-rate: remaining days including today
      const diffTime = Math.abs(end.getTime() - today.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Now subtract the excluded dates that fall within the remaining period
    let finalDays = days;
    if (excludedDates.length > 0) {
      let current = new Date(Math.max(today.getTime(), start.getTime()));
      while (current <= end) {
        const dStr = current.toISOString().split('T')[0];
        if (excludedDates.includes(dStr)) {
          finalDays--;
        }
        current.setDate(current.getDate() + 1);
      }
    }
    
    return Math.max(0, finalDays);
  }

  const daysToCharge = calculateRemainingDays();
  const dailyRate = Object.keys(milkPrices).length > 0 ? calculateDailyRate(quantity, milkPrices) : (data?.previousMonth?.daily_rate || 20); 
  const totalAmount = dailyRate * daysToCharge;
  const carryInBalance = data?.upcoming_adjustments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;
  const netDue = Math.max(0, totalAmount - carryInBalance);

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/subscription/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target_month: targetMonth,
          quantity: quantity,
          excluded_dates: excludedDates
        })
      })
      const json = await res.json()
      
      if (!json.success) {
        toast.error(json.message || 'Failed to initialize renewal')
        setIsProcessing(false)
        return
      }

      if (json.razorpay_order_id) {
        const options = {
          key: json.key_id,
          amount: Math.round(netDue * 100),
          currency: "INR",
          name: "Amruth Dairy Farm",
          description: `Renewal for ${monthName}`,
          order_id: json.razorpay_order_id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  billing_month_id: json.billing_month_id
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                toast.success('Payment successful! Subscription renewed.')
                router.push('/dashboard')
              } else {
                toast.error(verifyData.message || 'Payment verification failed.')
                setIsProcessing(false)
              }
            } catch (err) {
              toast.error('Payment verification error.')
              setIsProcessing(false)
            }
          },
          prefill: {
            name: "Customer",
          },
          theme: {
            color: "#059669" // Emerald 600
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false)
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
      } else {
        // Development mode bypass
        toast.success('Subscription renewed (Development Bypass).')
        router.push('/dashboard')
      }
      
    } catch (err) {
      toast.error('Network error. Please try again.')
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
          <Calendar size={28} />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Renew for {monthName}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
          Review your plan details for the upcoming month. You can adjust your daily quantity below.
        </p>

        {/* Quantity Selector */}
        <div className="space-y-4 mb-8">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Daily Milk Quantity
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0.5, 1, 1.5, 2].map((vol) => (
              <button
                key={vol}
                onClick={() => setQuantity(vol)}
                className={cn(
                  "h-14 rounded-xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2",
                  quantity === vol
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-600"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-200 dark:hover:border-amber-800"
                )}
              >
                {quantity === vol && <CheckCircle size={16} />}
                {vol} L
              </button>
            ))}
          </div>
        </div>

        {/* Day Picker Calendar Toggle */}
        <div className="space-y-4 mb-8">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Delivery Days
          </label>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full h-14 px-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 rounded-2xl flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Calendar size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Customize Delivery Days</span>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {excludedDates.length === 0 ? "Everyday Delivery" : `${excludedDates.length} Days Excluded`}
                  </span>
                </div>
              </div>
              <ChevronDown className={cn("text-slate-400 dark:text-slate-500 transition-transform", showCalendar && "rotate-180")} size={16} />
            </button>

            <AnimatePresence>
              {showCalendar && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-2">
                    <SubscriptionCalendar
                      startDate={targetDate.toISOString().split('T')[0]}
                      onExcludedDatesChange={setExcludedDates}
                      initialExcludedDates={excludedDates}
                      maxMonthsAhead={1}
                      quantity={quantity}
                      onMonthAvailabilityChange={() => {}}
                      onDeliveryDaysChange={() => {}}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Calculation Box */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 space-y-4 mb-8">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
            <span>Daily Rate ({quantity}L)</span>
            <span>₹{(quantity * dailyRate).toFixed(2)} / day</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
            <span>Billing Days</span>
            <span>{daysToCharge} days</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="font-medium">Total Excluded Days</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{excludedDates.length} days</span>
          </div>
          
          {carryInBalance > 0 && (
            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
              <span className="font-medium">Carry Forward Balance</span>
              <span className="font-bold">-₹{carryInBalance.toFixed(2)}</span>
            </div>
          )}
          
          {carryInBalance < 0 && (
            <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
              <span className="font-medium">Pending Dues</span>
              <span className="font-bold">+₹{Math.abs(carryInBalance).toFixed(2)}</span>
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="font-extrabold text-slate-900 dark:text-white">Net Due Amount</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-display">₹{netDue.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-14 bg-[#014DA4] hover:bg-[#014DA4]/90 text-white rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck size={18} />
              Proceed to Payment
            </>
          )}
        </button>
        <p className="text-[11px] text-center font-semibold text-slate-400 mt-4 flex items-center justify-center gap-1">
          <ShieldCheck size={12} /> Secure Razorpay Checkout
        </p>
      </div>
    </div>
  )
}

export default function RenewPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"/></div>}>
      <RenewContent />
    </Suspense>
  )
}
