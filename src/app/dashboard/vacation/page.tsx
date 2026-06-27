'use client'

import { useState, useEffect } from 'react'
import { Palmtree, Calendar, AlertTriangle, CheckCircle, ArrowLeftRight, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface VacationPause {
  pause_start: string;
  pause_end: string;
  total_days: number;
  total_credit: number;
  resume_date: string;
  status: string;
}

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

export default function VacationPausePage() {
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [dailyRate, setDailyRate] = useState(82.6667)
  const [vacationList, setVacationList] = useState<VacationPause[]>([])
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [totalDays, setTotalDays] = useState(0)
  const [creditPreview, setCreditPreview] = useState(0)
  const [resumeDate, setResumeDate] = useState('')

  async function loadData() {
    try {
      setPageLoading(true)
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        if (json.subscription) {
          setDailyRate(json.subscription.daily_rate)
        }
        if (json.active_vacation) {
          setVacationList([json.active_vacation])
        } else {
          setVacationList([])
        }
      } else {
        setError(json.message || 'Failed to retrieve subscription details')
      }
    } catch (err) {
      setError('Network error loading page data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split('T')[0])

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 4)
    setEndDate(nextWeek.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (!startDate || !endDate) {
      setTotalDays(0); setCreditPreview(0); setResumeDate(''); return
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      setTotalDays(0); setCreditPreview(0); setResumeDate(''); return
    }
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    setTotalDays(diffDays)
    setCreditPreview(Math.round(diffDays * dailyRate * 100) / 100)
    
    const resume = new Date(endDate)
    resume.setDate(resume.getDate() + 1)
    setResumeDate(resume.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))
  }, [startDate, endDate, dailyRate])

  async function handleVacationSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) return setError('Please select both start and end dates.')

    const start = new Date(startDate)
    const end = new Date(endDate)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0,0,0,0)

    if (start < tomorrow) return setError('Vacation must start tomorrow or later.')
    if (end < start) return setError('End date must be on or after start date.')

    setError(''); setSuccessMsg(''); setLoading(true)

    try {
      const res = await fetch('/api/vacation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause_start: startDate, pause_end: endDate })
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(json.message || 'Vacation pause confirmed successfully!')
        await loadData()
      } else {
        setError(json.message || 'Failed to request vacation pause')
      }
    } catch (err) {
      setError('Network error submitting request')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-5xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[380px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="lg:col-span-2 h-[350px] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    )
  }

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
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Palmtree size={22} className="stroke-[2.2]" />
            </div>
            <span>Vacation Pause</span>
          </h1>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 pl-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
            <span>Pause your daily deliveries while you are away from home</span>
          </p>
        </div>
        
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-5 h-10 rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer self-start sm:self-center"
        >
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Vacation request form & Vacation Rules */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
          <form onSubmit={handleVacationSubmit} className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white tracking-tight">Schedule Pause</h2>
              <span className="text-[11px] font-extrabold text-[#014DA4] dark:text-blue-400 bg-sky-500/10 dark:bg-blue-950/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Daily Rate: ₹{dailyRate.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-slate-450 uppercase tracking-[2px] pl-0.5">Pause Start Date</label>
                <div className="flex items-center h-12 rounded-xl border border-border dark:border-slate-850 bg-white dark:bg-slate-950 px-3.5 gap-2.5 focus-within:ring-2 focus-within:ring-[#014DA4]/20 focus-within:border-[#014DA4] transition-all">
                  <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    min={(() => {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      return tomorrow.toISOString().split('T')[0]
                    })()}
                    onChange={(e) => { setStartDate(e.target.value); setError(''); setSuccessMsg('') }}
                    className="flex-1 h-full bg-transparent text-[13.5px] font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-slate-455 uppercase tracking-[2px] pl-0.5">Pause End Date</label>
                <div className="flex items-center h-12 rounded-xl border border-border dark:border-slate-850 bg-white dark:bg-slate-950 px-3.5 gap-2.5 focus-within:ring-2 focus-within:ring-[#014DA4]/20 focus-within:border-[#014DA4] transition-all">
                  <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate || (() => {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      return tomorrow.toISOString().split('T')[0]
                    })()}
                    onChange={(e) => { setEndDate(e.target.value); setError(''); setSuccessMsg('') }}
                    className="flex-1 h-full bg-transparent text-[13.5px] font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Preview */}
            {totalDays > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 text-[13.5px] font-bold text-slate-650 dark:text-slate-400 dark:text-slate-500 shadow-3xs"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-455">Total Paused Days:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">{totalDays} days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-455">Statement Credits Earned:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-500 font-mono text-sm">+₹{creditPreview.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-455">Delivery Resumes:</span>
                  <span className="font-extrabold text-[#014DA4] dark:text-blue-400 text-sm flex items-center gap-1">
                    <span>{resumeDate}</span>
                  </span>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {error && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-2 pl-1">
                <AlertTriangle size={14} className="text-rose-500" /> 
                <span>{error}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-650 font-bold flex items-center gap-2 pl-1">
                <CheckCircle size={14} className="text-emerald-500" /> 
                <span>{successMsg}</span>
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || totalDays <= 0}
              className="w-full h-12 rounded-xl bg-[#014DA4] hover:bg-[#014DA4]/95 active:scale-[0.98] text-white font-extrabold text-xs shadow-sm transition-all border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Palmtree size={14} className="stroke-[2.5]" />
                  <span>Confirm Vacation Pause</span>
                </>
              )}
            </button>
          </form>          {/* Vacation Rules Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <h3 className="text-[11px] font-extrabold text-slate-450 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 select-none uppercase tracking-[2.5px] pl-0.5">Vacation Rules</h3>
            
            <div className="space-y-4 text-left leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">1</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">One Day Advance Notice</p>
                  <p className="text-slate-450 dark:text-slate-400 dark:text-slate-500 mt-1">Vacation pauses must be submitted at least one day in advance. Same-day pauses are not supported.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">2</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Earn Statement Credits</p>
                  <p className="text-slate-455 dark:text-slate-400 dark:text-slate-500 mt-1">You will receive a statement credit of <strong className="text-emerald-600 dark:text-emerald-500 font-extrabold">₹{dailyRate.toFixed(2)}</strong> per day during the pause, reducing your next month's bill.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-[#014DA4] dark:text-blue-400 flex-shrink-0 mt-0.5 font-mono font-black text-[10px]">3</div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Seamless Resume</p>
                  <p className="text-slate-455 dark:text-slate-400 dark:text-slate-500 mt-1">Delivery will auto-resume the morning after your vacation ends. No reactivation or manual restart needed!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Scheduled Pauses */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          
          {/* Scheduled Vacation List Card */}
          <div className="bg-white dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-border/50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-left select-none">
              <h3 className="text-[13px] font-black text-[#014DA4] dark:text-blue-400 uppercase tracking-wider font-display">Active Vacation Pauses</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-widest">Confirmed Scheduled breaks</p>
            </div>
            
            <div className="p-2">
              {vacationList.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Palmtree size={32} className="text-slate-350 dark:text-slate-600 dark:text-slate-400 dark:text-slate-500 mx-auto mb-2.5 stroke-[1.5]" />
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">
                    No active or scheduled vacation pauses.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vacationList.map((vac, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-[#014DA4] dark:text-blue-400 bg-sky-500/10 dark:bg-blue-950/20 px-2 py-0.5 rounded-full tracking-wider">
                          Vacation Slot
                        </span>
                        <span className="text-[9.5px] font-extrabold text-green-700 bg-green-500/10 border border-green-200/20 px-2 py-0.5 rounded-full">
                          Confirmed
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 text-left">
                          <p className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                            {new Date(vac.pause_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(vac.pause_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-[11px] text-slate-450 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold mt-1">
                            Resumes: {vac.resume_date ? new Date(vac.resume_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Next day'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[11px] text-slate-450 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">Est. Credit</p>
                          <p className="text-sm font-black text-emerald-650 dark:text-emerald-500 font-mono mt-0.5">₹{((vac.total_days || 1) * dailyRate).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </motion.div>

      </div>
    </motion.div>
  )
}
