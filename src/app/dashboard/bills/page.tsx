'use client'

import { useState, useEffect } from 'react'
import { FileText, CreditCard, CheckCircle2, ShieldCheck, AlertCircle, TrendingUp, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
        theme: { color: '#2563eb' },
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
      <div className="max-w-xl space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-3xl p-8 shadow-md">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={40} />
        <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">Statement Unavailable</h3>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-6">{error || 'No active statements found.'}</p>
        <button onClick={loadData} className="inline-flex items-center justify-center px-5 h-10 bg-brand-secondary hover:bg-brand-secondary/90 text-white font-extrabold rounded-xl text-[13px] shadow-sm border-none cursor-pointer transition-colors">
          Retry Loading
        </button>
      </div>
    )
  }

  const monthName = new Date(bill.billing_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const hasPendingBill = bill.net_due > 0 && !mockPaid

  return (
    <div className="max-w-3xl space-y-6 relative">
      
      <div>
        <h1 className="text-[22px] font-black text-slate-900 dark:text-white font-display tracking-tight mb-1 flex items-center gap-2">
          <FileText size={24} className="text-slate-450 dark:text-slate-550" /> My Bills & Statements
        </h1>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Review monthly invoices, credit breakdowns, and billing logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        <div className="md:col-span-3 space-y-5">
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
            
            <div className="p-5 border-b border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/35 flex justify-between items-center">
              <div>
                <h3 className="text-[14px] font-black text-slate-900 dark:text-white font-display">{monthName} Statement</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-widest">Amruth Dairy Farm Invoice</p>
              </div>
              <div>
                {mockPaid ? (
                  <span className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30 px-3 py-1 rounded-full">Paid</span>
                ) : hasPendingBill ? (
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-200/30 dark:border-amber-900/30 px-3 py-1 rounded-full">Pending</span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-green-750 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30 px-3 py-1 rounded-full">Cleared</span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center pb-3 border-b border-border/50 dark:border-slate-800/60">
                <span>Base Plan charges:</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">₹{(bill.net_due + bill.skip_credit + bill.pause_credit - bill.extra_charges).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/50 dark:border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <span>Skip Day Credits:</span>
                  <span className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-border/40 dark:border-slate-800/60 text-[10px] px-1.5 py-0.5 rounded font-extrabold">{bill.days_skipped} days</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">-₹{bill.skip_credit.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/50 dark:border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <span>Vacation Pause Credits:</span>
                  <span className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-border/40 dark:border-slate-800/60 text-[10px] px-1.5 py-0.5 rounded font-extrabold">{bill.days_paused} days</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">-₹{bill.pause_credit.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/50 dark:border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <span>Extra Milk Orders:</span>
                  <span className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-border/40 dark:border-slate-800/60 text-[10px] px-1.5 py-0.5 rounded font-extrabold">{bill.extra_litres_ordered}L</span>
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-450">+₹{bill.extra_charges.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/50 dark:border-slate-800/60">
                <span>Carry in balance:</span>
                <span className={cn("font-bold", bill.carry_in_balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-450")}>
                  {bill.carry_in_balance >= 0 ? '-' : '+'}₹{Math.abs(bill.carry_in_balance).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-[15px] font-black text-slate-900 dark:text-white">
                <span>Total Net Due:</span>
                <span className="text-brand-secondary font-mono text-[18px]">₹{mockPaid ? '0.00' : bill.net_due.toFixed(2)}</span>
              </div>
            </div>

            {hasPendingBill && (
              <div className="p-5 bg-slate-50 dark:bg-slate-900/35 border-t border-border/50 dark:border-slate-800/80">
                <button
                  onClick={() => { setShowPayModal(true); setPaymentStep('details'); }}
                  className="w-full h-11 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard size={14} />
                  <span>Pay Balance Due (₹{bill.net_due.toFixed(2)})</span>
                </button>
              </div>
            )}
          </div>

          {upcomingAdjustments.length > 0 && (
            <div className="bg-white border border-[#e8edf5] rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden mt-6">
              <div className="p-5 border-b border-[#e8edf5] bg-[#f8fafc]">
                <h3 className="text-[14px] font-black text-[#0f172a] font-display">Upcoming Adjustments</h3>
                <p className="text-[11px] text-[#94a3b8] font-bold mt-0.5 uppercase tracking-widest">Applies to next month's bill</p>
              </div>
              <div className="p-5 space-y-3">
                {upcomingAdjustments.map((adj, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[13px] font-semibold text-[#64748b]">
                    <span className="flex flex-col">
                      <span className="text-[#0f172a] font-bold">
                        {adj.adjustment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        {adj.refund_status === 'requested' && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Refund Pending</span>}
                        {adj.refund_status === 'processed' && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Refunded</span>}
                      </span>
                      <span className="text-[11px] font-normal">{adj.description || 'Adjustment'}</span>
                    </span>
                    <span className={cn("font-bold", adj.adjustment_type.includes('credit') || adj.amount < 0 ? "text-[#16a34a]" : "text-[#ef4444]")}>
                      {adj.adjustment_type.includes('credit') || adj.amount < 0 ? '-' : '+'}₹{Math.abs(adj.amount).toFixed(2)}
                    </span>
                  </div>
                ))}

                {(() => {
                  const refundableAmt = upcomingAdjustments
                    .filter(a => a.amount < 0 && (!a.refund_status || a.refund_status === 'none'))
                    .reduce((sum, a) => sum + Math.abs(a.amount), 0);
                  
                  if (refundableAmt > 0) {
                    return (
                      <div className="pt-4 mt-4 border-t border-[#e8edf5]">
                        <button 
                          onClick={handleRefundRequest}
                          disabled={isRequestingRefund}
                          className="w-full h-10 rounded-xl bg-white border-2 border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff] active:scale-[0.98] font-bold text-[13px] transition-all disabled:opacity-50"
                        >
                          {isRequestingRefund ? 'Requesting...' : `Request Refund to Bank (₹${refundableAmt.toFixed(2)})`}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl shadow-sm p-5 space-y-4 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
            <h3 className="text-[11px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={14} className="text-brand-secondary" /> Pricing Formula
            </h3>
            <div className="space-y-3">
              <p className="leading-relaxed">
                Pricing is set by the admin and calculated based on <span className="font-bold text-slate-900 dark:text-white">actual days in the month</span>. Your daily rate is applied to each delivery day.
              </p>
              <p className="leading-relaxed">
                Skips and pauses accumulate credit at your subscription's daily rate, which automatically reduces your next monthly statement.
              </p>
            </div>
            <div className="h-[1px] bg-border/50 dark:bg-slate-800/60" />
            <div className="flex gap-2.5">
              <Info size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold">
                Online payment balances update instantly. For cash payments, contact delivery managers.
              </p>
            </div>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => paymentStep !== 'processing' && setShowPayModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-10 overflow-hidden text-slate-900 dark:text-white"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-secondary" />

              {paymentStep === 'details' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-black font-display text-slate-900 dark:text-white">Secure Checkout</h3>
                    <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Complete your subscription payment securely via Razorpay.</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-border/50 dark:border-slate-800/80 p-4 rounded-xl text-[13px] font-semibold text-slate-600 dark:text-slate-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Statement Amount:</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{bill.net_due.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 dark:text-white border-t border-border/40 dark:border-slate-800/60 pt-2 mt-2">
                      <span>Paying Total:</span>
                      <span>₹{bill.net_due.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowPayModal(false)}
                      className="w-1/3 h-10 rounded-xl border border-border/50 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[13px] hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startPayment}
                      className="w-2/3 h-10 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm border-none cursor-pointer transition-all"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-[15px] font-black text-slate-900 dark:text-white">Processing Payment...</p>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> Secured by SSL encryption
                    </p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 animate-[float_3s_ease-in-out_infinite]">
                    <CheckCircle2 size={30} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">Payment Successful!</h3>
                    <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1">₹{bill.net_due.toFixed(2)} credited successfully.</p>
                  </div>
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-border/50 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold text-[13px] cursor-pointer mt-4 transition-all"
                  >
                    Close Invoice
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
