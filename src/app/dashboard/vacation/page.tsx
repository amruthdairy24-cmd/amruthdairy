'use client'

import { useState, useEffect } from 'react'
import { Palmtree, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface VacationPause {
  pause_start: string;
  pause_end: string;
  total_days: number;
  total_credit: number;
  resume_date: string;
  status: string;
}

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
      <div className="max-w-xl space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      
      <div>
        <h1 className="text-[22px] font-black text-slate-900 dark:text-white font-display tracking-tight mb-1 flex items-center gap-2">
          <Palmtree size={24} className="text-brand-secondary" /> Vacation Pause
        </h1>
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-450">Pause your daily deliveries while you are away from home.</p>
      </div>

      <div className="bg-amber-500/10 dark:bg-amber-550/15 border border-amber-200/30 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="text-amber-750 dark:text-amber-400 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-[11px] font-black text-amber-800 dark:text-amber-350 uppercase tracking-wider">Vacation Delivery Rules</h4>
          <p className="text-[12px] font-semibold text-amber-900 dark:text-amber-200/85 mt-1 leading-relaxed">
            Vacation pauses must be registered at least one day in advance. Delivery will auto-resume the day after your vacation ends.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        <div className="md:col-span-3 space-y-5">
          <form onSubmit={handleVacationSubmit} className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Pause Start</label>
                <div className="flex items-center h-11 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 px-3 gap-2 focus-within:ring-2 focus-within:ring-brand-secondary/20 focus-within:border-brand-secondary">
                  <Calendar size={15} className="text-slate-400 dark:text-slate-500" />
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
                    className="flex-1 h-full bg-transparent text-[13px] font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-widest">Pause End</label>
                <div className="flex items-center h-11 rounded-xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 px-3 gap-2 focus-within:ring-2 focus-within:ring-brand-secondary/20 focus-within:border-brand-secondary">
                  <Calendar size={15} className="text-slate-400 dark:text-slate-500" />
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
                    className="flex-1 h-full bg-transparent text-[13px] font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {totalDays > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-border/50 dark:border-slate-800/80 rounded-xl p-5 space-y-3.5 animate-fade-in text-[13px] font-bold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center pb-3 border-b border-border/40 dark:border-slate-800/65">
                  <span>Total Vacation Days:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">{totalDays} days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/40 dark:border-slate-800/65">
                  <span>Total Credit Accrued:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">₹{creditPreview.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Milk Resumes:</span>
                  <span className="font-extrabold text-brand-secondary text-sm">{resumeDate}</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-[12px] text-rose-650 dark:text-rose-450 font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} /> {error}
              </p>
            )}

            {successMsg && (
              <p className="text-[12px] text-emerald-650 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle size={14} /> {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || totalDays <= 0}
              className="w-full h-11 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 active:scale-[0.98] text-white font-extrabold text-[13px] shadow-sm transition-all border-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Palmtree size={14} strokeWidth={2.5} />
                  <span>Confirm Vacation Pause</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-[11px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest pl-1">Scheduled Pauses</h3>
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-2xl shadow-sm p-4 space-y-3">
            {vacationList.length === 0 ? (
              <p className="text-[12px] text-slate-400 dark:text-slate-550 font-semibold py-8 text-center">
                No vacation pauses active or scheduled.
              </p>
            ) : (
              <div className="space-y-3">
                {vacationList.map((vac, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/40 border border-border/50 dark:border-slate-800/80 rounded-xl p-4 text-[13px] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-brand-secondary tracking-wider">Scheduled Pause</span>
                      <span className="text-[9px] font-bold text-green-700 dark:text-green-450 bg-green-500/10 dark:bg-green-500/20 border border-green-200/30 dark:border-green-900/30 px-2 py-0.5 rounded-full">Confirmed</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {new Date(vac.pause_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(vac.pause_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                        Resumes: {vac.resume_date ? new Date(vac.resume_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Next day'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
