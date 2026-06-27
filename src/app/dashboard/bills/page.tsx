'use client'

import { useState, useEffect } from 'react'
import { FileText, CreditCard, CheckCircle2, ShieldCheck, AlertCircle, TrendingUp, Info, Milk, SkipForward, Palmtree, PlusCircle, Wallet, ArrowRight, HelpCircle, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { RowDetailsModal } from '@/components/admin/RowDetailsModal'

interface BillingData {
  id?: string;
  billing_month: string;
  days_delivered: number;
  days_skipped: number;
  days_paused: number;
  extra_litres_ordered: number;
  skip_credit: number;
  pause_credit: number;
  extra_charges: number;
  carry_in_balance: number;
  net_due: number;
  amount_paid: number;
}

// Animation configurations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24
    }
  },
} as const

export default function BillsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bill, setBill] = useState<BillingData | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [upcomingAdjustments, setUpcomingAdjustments] = useState<any[]>([])
  
  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details')
  const [mockPaid, setMockPaid] = useState(false)
  const [isRequestingRefund, setIsRequestingRefund] = useState(false)
  const [viewingBill, setViewingBill] = useState<BillingData | null>(null)

  async function handleRefundRequest() {
    if (!confirm('Are you sure you want to request a cash refund? This will convert your carry-forward credits to cash, and they will no longer reduce your next bill.')) return;
    setIsRequestingRefund(true);
    try {
      const res = await fetch('/api/customer/refund', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Refund requested successfully! Our admin will process your request shortly.');
        loadData();
      } else {
        alert(data.message || 'Failed to request refund');
      }
    } catch (err) {
      alert('Network error while requesting refund');
    } finally {
      setIsRequestingRefund(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        if (json.profile) setProfile(json.profile)
        if (json.upcoming_adjustments) setUpcomingAdjustments(json.upcoming_adjustments)
        if (json.current_month) {
          setBill(json.current_month)
        } else {
          const monthly = json.subscription ? json.subscription.monthly_amount : 0
          setBill({
            billing_month: new Date().toISOString().split('T')[0],
            days_delivered: 0, days_skipped: 0, days_paused: 0, extra_litres_ordered: 0,
            skip_credit: 0, pause_credit: 0, extra_charges: 0, carry_in_balance: 0,
            net_due: monthly, amount_paid: 0
          })
        }
      } else {
        setError(json.message || 'Failed to retrieve billing statements')
      }
    } catch (err) {
      setError('Network error loading statements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function startPayment() {
    if (!bill) return;
    try {
      setPaymentStep('processing');
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setPaymentStep('details');
        return;
      }

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bill.net_due, billingMonthId: bill.id })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        alert(orderData.message || 'Failed to initialize payment order.');
        setPaymentStep('details');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Amruth Milk',
        description: `Milk Subscription Payment - ${monthName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setPaymentStep('processing');
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                billing_month_id: bill.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentStep('success');
              setMockPaid(true);
              loadData();
            } else {
              alert(verifyData.message || 'Payment verification failed.');
              setPaymentStep('details');
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Error verifying payment.');
            setPaymentStep('details');
          }
        },
        prefill: {
          name: profile?.full_name || '',
          contact: profile?.phone || ''
        },
        theme: { color: '#014DA4' },
        modal: { ondismiss: function () { setPaymentStep('details'); } }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Payment start error:', err);
      alert('Failed to initiate payment.');
      setPaymentStep('details');
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="md:col-span-2 h-[350px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={40} />
        <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Statement Unavailable</h3>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 mb-6">{error || 'No active statements found.'}</p>
        <button onClick={loadData} className="inline-flex items-center justify-center px-6 h-11 bg-brand-secondary hover:bg-[#014DA4] text-white font-extrabold rounded-xl text-[13px] shadow-sm border-none cursor-pointer transition-colors">
          Retry Loading
        </button>
      </div>
    )
  }

  const monthName = new Date(bill.billing_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const hasPendingBill = bill.net_due > 0 && !mockPaid
  const basePlanAmount = bill.net_due + bill.skip_credit + bill.pause_credit - bill.extra_charges

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-5xl space-y-8 relative"
    >
      
      {/* Header section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#014DA4]/10 text-[#014DA4] flex items-center justify-center">
              <FileText size={22} />
            </div>
            <span>My Bills & Statements</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 pl-1 flex items-center gap-1.5">
            <Info size={14} className="text-slate-450" />
            <span>Track monthly invoices, credit adjustments, and make secure subscription payments</span>
          </p>
        </div>
        
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer self-start sm:self-center"
        >
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left column: Main Invoice Statement */}
        <motion.div variants={itemVariants} className="lg:col-span-3 flex flex-col space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between flex-1">
            
            {/* Header */}
            <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-between items-center select-none">
              <div className="text-left">
                <h3 className="text-[14px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-wider font-display">{monthName} Statement</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-widest">Amruth Dairy Farm Invoice</p>
              </div>
              <div>
                {mockPaid ? (
                  <span className="text-[9.5px] font-extrabold uppercase text-green-700 bg-green-500/10 border border-green-200/25 px-3 py-1 rounded-full">Paid</span>
                ) : hasPendingBill ? (
                  <span className="text-[9.5px] font-extrabold uppercase text-amber-700 bg-amber-500/10 border border-amber-200/25 px-3 py-1 rounded-full animate-pulse">Pending</span>
                ) : (
                  <span className="text-[9.5px] font-extrabold uppercase text-green-700 bg-green-500/10 border border-green-200/25 px-3 py-1 rounded-full">Cleared</span>
                )}
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="p-6 space-y-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 flex-grow">
              
              {/* Base Plan */}
              <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Milk size={14} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Base Plan Charges</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">₹{basePlanAmount.toFixed(2)}</span>
              </div>

              {/* Skips Credits */}
              <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-505 flex items-center justify-center flex-shrink-0">
                    <SkipForward size={13} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Skip Day Credits</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-555 dark:text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-slate-700/60 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">{bill.days_skipped} days</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500 font-mono text-sm">-₹{bill.skip_credit.toFixed(2)}</span>
              </div>

              {/* Vacation Credits */}
              <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-550 flex items-center justify-center flex-shrink-0">
                    <Palmtree size={13} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Vacation Pause Credits</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-555 dark:text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-slate-700/60 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">{bill.days_paused} days</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500 font-mono text-sm">-₹{bill.pause_credit.toFixed(2)}</span>
              </div>

              {/* Extra Milk Charges */}
              <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-650 flex items-center justify-center flex-shrink-0">
                    <PlusCircle size={13} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Extra Milk Charges</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-555 dark:text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-slate-700/60 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">+{bill.extra_litres_ordered}L</span>
                </span>
                <span className="font-bold text-rose-500 dark:text-rose-400 font-mono text-sm">+₹{bill.extra_charges.toFixed(2)}</span>
              </div>

              {/* Carry in balance */}
              <div className="flex justify-between items-center py-3.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 dark:text-slate-500 flex items-center justify-center flex-shrink-0">
                    <Wallet size={13} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Previous Carry-over</span>
                </span>
                <span className={cn("font-bold font-mono text-sm", bill.carry_in_balance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-500 dark:text-rose-400")}>
                  {bill.carry_in_balance >= 0 ? '-' : '+'}₹{Math.abs(bill.carry_in_balance).toFixed(2)}
                </span>
              </div>

              {/* Total Row */}
              <div className="flex justify-between items-center pt-5 pb-1 text-base font-black text-slate-900 dark:text-white select-none">
                <span>Total Net Due</span>
                <span className="text-[#014DA4] dark:text-blue-400 font-mono text-2xl tracking-tight">₹{mockPaid ? '0.00' : bill.net_due.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50/60 dark:bg-slate-950/40 border-t border-border/50 dark:border-slate-800 flex flex-col gap-3">
              {hasPendingBill && (
                <button
                  onClick={() => { setShowPayModal(true); setPaymentStep('details'); }}
                  className="w-full h-12 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard size={15} />
                  <span>Pay Balance Due (₹{bill.net_due.toFixed(2)})</span>
                </button>
              )}
              <button
                onClick={() => setViewingBill(bill)}
                className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={15} />
                <span>View Full Details</span>
              </button>
            </div>
          </div>

          {/* Upcoming Adjustments Card */}
          {upcomingAdjustments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-left select-none">
                <h3 className="text-[14px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-wider font-display">Upcoming Adjustments</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-widest">Calculations pending for next renewal cycle</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2.5">
                  {upcomingAdjustments.map((adj, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[12.5px] bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-3xs">
                      <span className="flex flex-col text-left">
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          {adj.adjustment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          {adj.refund_status === 'requested' && <span className="ml-2 text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide border border-amber-200/10 dark:border-amber-900/30">Refund Pending</span>}
                          {adj.refund_status === 'processed' && <span className="ml-2 text-[9px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-455 px-1.5 py-0.5 rounded font-black uppercase tracking-wide border border-green-200/10 dark:border-green-900/30">Refunded</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mt-0.5">{adj.description || 'Adjustment'}</span>
                      </span>
                      <span className={cn("font-mono font-black ml-2.5 text-right text-sm", adj.adjustment_type.includes('credit') || adj.amount < 0 ? "text-emerald-600" : "text-rose-500")}>
                        {adj.adjustment_type.includes('credit') || adj.amount < 0 ? '-' : '+'}₹{Math.abs(adj.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {(() => {
                  const refundableAmt = upcomingAdjustments
                    .filter(a => a.amount < 0 && (!a.refund_status || a.refund_status === 'none'))
                    .reduce((sum, a) => sum + Math.abs(a.amount), 0);
                  
                  if (refundableAmt > 0) {
                    return (
                      <div className="pt-2 mt-2">
                         <button 
                          onClick={handleRefundRequest}
                          disabled={isRequestingRefund}
                          className="w-full h-10 rounded-xl bg-white dark:bg-slate-900 border border-[#014DA4] text-[#014DA4] dark:text-blue-400 hover:bg-[#014DA4]/5 active:scale-[0.98] font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isRequestingRefund ? 'Requesting...' : `Request Cash Refund to Bank (₹${refundableAmt.toFixed(2)})`}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
               {/* Right column: Pricing Details Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 h-fit">
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-5 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
            
            <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[2.5px] flex items-center gap-2 pl-0.5 select-none">
              <TrendingUp size={15} className="text-[#014DA4] dark:text-blue-400" />
              <span>Billing Guide</span>
            </h3>
            
            <div className="space-y-4 text-left leading-relaxed">
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">1</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Monthly Cycle Rates</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Calculations are based on the actual number of days in the month. Your customized subscription daily rate applies directly to each successfully delivered day.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">2</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Credits Carry-forward</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Skipped days and vacation pauses accumulate credits at your daily plan rate. These are carried forward to automatically reduce your subsequent monthly renewal bill.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">3</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cash Refund Policy</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Accumulated carry-forward credits can be directly refunded to your bank account upon request rather than rolled over, converting your digital balance to cash.</p>
                </div>
              </div>

            </div>
            
            <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />
            
            <div className="flex gap-2.5 p-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl">
              <Info size={16} className="text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-1 ml-1.5" />
              <p className="text-[10.5px] text-slate-455 dark:text-slate-400 dark:text-slate-500 leading-relaxed font-bold text-left p-1">
                Online card and UPI payments update your balance immediately. For physical cash or cheque payments, please coordinate directly with the delivery managers.
              </p>
            </div>

          </div>
        </motion.div>     </motion.div>

      </div>

      {/* SECURE CHECKOUT MODAL */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => paymentStep !== 'processing' && setShowPayModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-10 overflow-hidden text-slate-900 dark:text-slate-100"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#014DA4]" />

              {paymentStep === 'details' && (
                <div className="space-y-5">
                  <div className="text-left">
                    <h3 className="text-[16px] sm:text-lg font-black font-display text-slate-800 dark:text-white">Secure Checkout</h3>
                    <p className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Complete your subscription renewal payment securely via Razorpay.</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4.5 rounded-xl text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 space-y-2.5">
                    <div className="flex justify-between">
                      <span>Statement Amount</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{bill.net_due.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 dark:text-white border-t border-slate-150 dark:border-slate-800 pt-2.5 mt-2.5 text-sm">
                      <span>Paying Total</span>
                      <span className="text-[#014DA4] dark:text-blue-400 font-mono">₹{bill.net_due.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1 select-none">
                    <button
                      onClick={() => setShowPayModal(false)}
                      className="w-1/3 h-10 rounded-xl border border-border dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startPayment}
                      className="w-2/3 h-10 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm border-none cursor-pointer transition-all"
                    >
                      Pay Securely
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 border-3 border-slate-200 dark:border-slate-800 border-t-[#014DA4] rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-[14.5px] font-black text-slate-800 dark:text-slate-200">Processing Payment...</p>
                    <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1.5 flex items-center justify-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-600" /> Secured by SSL encryption
                    </p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-green-500/10 border border-green-200/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 size={26} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Payment Successful!</h3>
                    <p className="text-[12.5px] font-bold text-slate-400 dark:text-slate-555 mt-1.5">₹{bill.net_due.toFixed(2)} has been successfully credited to your account.</p>
                  </div>
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer mt-4 transition-all"
                  >
                    Close Invoice
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RowDetailsModal 
        isOpen={!!viewingBill}
        onClose={() => setViewingBill(null)}
        title="Billing Details"
        data={viewingBill}
      />
    </motion.div>
  )
}
