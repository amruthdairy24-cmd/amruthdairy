'use client'

import { useState, useMemo } from 'react'
import { Droplets, Save, AlertTriangle, X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { cn } from '@/lib/utils'

interface CapacityLog {
  id: string;
  date: string;
  total_litres: number;
  booked_litres: number;
  is_full: boolean;
}

interface OverbookedAlert {
  date: string;
  booked: number;
}

export function CapacityClient({ data: initialData }: { data: CapacityLog[] }) {
  const [data, setData] = useState<CapacityLog[]>(initialData);
  
  const capacityMap = useMemo(() => {
    const map = new Map<string, CapacityLog>();
    data.forEach(log => map.set(log.date, log));
    return map;
  }, [data]);

  // Main Display Table State
  const [viewDate, setViewDate] = useState<Date>(new Date());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalViewDate, setModalViewDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [editTotal, setEditTotal] = useState<string>('100');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [overbookedAlerts, setOverbookedAlerts] = useState<OverbookedAlert[] | null>(null);

  // Helper for generating days in a month for the TABLE
  const getDaysInMonthArray = (dateObj: Date) => {
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(12, 0, 0, 0); 
      days.push(d);
    }
    return days;
  };

  // Helper for Modal Calendar (requires padding for first day of week)
  const getCalendarDays = (dateObj: Date) => {
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(12, 0, 0, 0); 
      days.push(d);
    }
    return days;
  };

  const tableDays = getDaysInMonthArray(viewDate);
  const modalCalendarDays = getCalendarDays(modalViewDate);

  const changeMonth = (offset: number, isModal: boolean = false) => {
    if (isModal) {
      const newDate = new Date(modalViewDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setModalViewDate(newDate);
    } else {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setViewDate(newDate);
    }
  };

  const openModal = () => {
    setStartDate(null);
    setEndDate(null);
    setEditTotal('100');
    setMessage(null);
    setOverbookedAlerts(null);
    setModalViewDate(new Date(viewDate)); 
    setShowModal(true);
  };

  const handleModalDateClick = (d: Date) => {
    setMessage(null);
    setOverbookedAlerts(null);
    d.setHours(12, 0, 0, 0);
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
      
      const log = capacityMap.get(d.toISOString().split('T')[0]);
      if (log) setEditTotal(log.total_litres.toString());
    } else {
      if (d < startDate) {
        setStartDate(d);
        setEndDate(null);
      } else {
        setEndDate(d);
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      setOverbookedAlerts(null);
      
      if (!startDate) {
        throw new Error("Please select a date or date range.");
      }
      
      const newTotal = Number(editTotal);
      if (isNaN(newTotal) || newTotal <= 0) {
        throw new Error("Please enter a valid positive number for capacity.");
      }
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate ? endDate.toISOString().split('T')[0] : startStr;

      const res = await fetch('/api/admin/capacity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: startStr,
          endDate: endStr,
          total_litres: newTotal
        })
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        if (result.overbooked && result.overbooked.length > 0) {
          setOverbookedAlerts(result.overbooked);
          throw new Error("Validation Failed: Some dates exceed the new requested capacity limit.");
        }
        throw new Error(result.message || 'Failed to update capacity');
      }
      
      setData(prev => {
        const newData = [...prev];
        const updatedRecords = Array.isArray(result.data) ? result.data : [result.data];
        
        updatedRecords.forEach((updatedRecord: any) => {
          const existingIndex = newData.findIndex(p => p.date === updatedRecord.date);
          if (existingIndex >= 0) {
            newData[existingIndex] = updatedRecord;
          } else {
            newData.push(updatedRecord);
          }
        });
        return newData;
      });
      
      setMessage({ text: 'Capacity updated successfully!', type: 'success' });
      setTimeout(() => setShowModal(false), 1500);
      
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const isDateInRange = (d: Date) => {
    if (!startDate || !endDate) return false;
    const time = d.getTime();
    return time >= startDate.getTime() && time <= endDate.getTime();
  };

  return (
    <div className="flex flex-col gap-6 relative">
      
      <AdminHeader 
        title="Production Capacity" 
        description="View your daily capacity limits in a list. Add or edit capacity for any date." 
        icon={Droplets} 
        actionLabel="Add / Edit Capacity"
        onAction={openModal}
      />

      {/* MAIN DISPLAY BOARD TABLE */}
      <div className="bg-white dark:bg-cream-100 rounded-3xl p-6 md:p-8 border border-border/50 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <CalendarIcon size={24} className="text-slate-900 dark:text-white" />
            <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white m-0">
              {viewDate.toLocaleString('default', { month: 'long' })} {viewDate.getFullYear()}
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-border/50 dark:border-slate-800/85 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 font-bold text-sm transition-all duration-150 cursor-pointer">&larr; Prev</button>
            <button onClick={() => setViewDate(new Date())} className="px-4 py-2 rounded-xl bg-slate-55 dark:bg-slate-950 border border-border/50 dark:border-slate-800/85 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 font-bold text-sm transition-all duration-150 cursor-pointer">Today</button>
            <button onClick={() => changeMonth(1)} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-border/50 dark:border-slate-800/85 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 font-bold text-sm transition-all duration-150 cursor-pointer">Next &rarr;</button>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="max-h-[65vh] overflow-y-auto rounded-2xl border border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 hide-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total Capacity (L)</th>
                <th className="p-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Booked (L)</th>
                <th className="p-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Available (L)</th>
                <th className="p-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {tableDays.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const log = capacityMap.get(dateStr) || { total_litres: 100, booked_litres: 0 };
                
                const percent = Math.min(100, (log.booked_litres / (log.total_litres || 1)) * 100);
                const available = Math.max(0, log.total_litres - log.booked_litres);
                
                const tempToday = new Date();
                tempToday.setHours(12,0,0,0);
                const isToday = tempToday.toISOString().split('T')[0] === dateStr;

                return (
                  <tr key={idx} className={cn(
                    "border-b border-border/40 dark:border-slate-800/60 transition-colors",
                    isToday ? "bg-blue-500/5 dark:bg-blue-950/10" : "bg-white dark:bg-cream-100 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  )}>
                    <td className={cn(
                      "p-4 text-sm font-semibold",
                      isToday ? "text-blue-700 dark:text-blue-400 font-extrabold" : "text-slate-900 dark:text-slate-200"
                    )}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {isToday && <span className="ml-2.5 text-[9px] bg-blue-600 text-white py-0.5 px-2 rounded font-extrabold shadow-sm">TODAY</span>}
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border",
                        percent >= 100 
                          ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200/20 dark:border-rose-900/30" 
                          : (percent >= 80 
                            ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-650 dark:text-amber-400 border-amber-200/20 dark:border-amber-900/30" 
                            : "bg-green-500/10 dark:bg-green-500/20 text-emerald-600 dark:text-emerald-400 border-green-200/20 dark:border-green-900/30")
                      )}>
                        {percent >= 100 ? <AlertTriangle size={13}/> : <CheckCircle2 size={13}/>}
                        {percent >= 100 ? 'Full' : (percent >= 80 ? 'Filling Fast' : 'Available')}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-extrabold text-slate-900 dark:text-white">
                      {log.total_litres} L
                    </td>
                    <td className="p-4 text-sm font-extrabold text-brand-accent">
                      {log.booked_litres} L
                    </td>
                    <td className={cn(
                      "p-4 text-sm font-black",
                      available <= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-605 dark:text-emerald-400"
                    )}>
                      {available.toFixed(1)} L
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full flex-1 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              percent >= 100 ? "bg-rose-500" : percent > 80 ? "bg-amber-500" : "bg-blue-600"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-450 dark:text-slate-500 min-w-[32px]">
                          {Math.round(percent)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT CAPACITY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <div className="bg-white dark:bg-cream-100 border border-border/50 dark:border-slate-800/80 rounded-3xl w-full max-w-[800px] shadow-2xl flex flex-col md:flex-row overflow-hidden text-slate-900 dark:text-white">
            
            {/* LEFT SIDE: CALENDAR SELECTION */}
            <div className="flex-1 p-6 md:p-8 bg-slate-50 dark:bg-slate-950/40 border-r border-border/40 dark:border-slate-800/60">
              <h3 className="text-[17px] font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2 font-display">
                <CalendarIcon size={20} /> Select Date(s)
              </h3>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-6">
                Click once for a single date, or click a second date to select a range.
              </p>

              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[14px] font-extrabold text-slate-905 dark:text-slate-200 m-0">
                  {modalViewDate.toLocaleString('default', { month: 'long' })} {modalViewDate.getFullYear()}
                </h4>
                <div className="flex gap-2">
                  <button onClick={() => changeMonth(-1, true)} className="px-2.5 py-1 rounded-lg border border-border/50 dark:border-slate-800/85 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 font-bold text-xs transition-colors cursor-pointer">&larr;</button>
                  <button onClick={() => changeMonth(1, true)} className="px-2.5 py-1 rounded-lg border border-border/50 dark:border-slate-800/85 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 font-bold text-xs transition-colors cursor-pointer">&rarr;</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {modalCalendarDays.map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} />;
                  
                  const dateStr = date.toISOString().split('T')[0];
                  
                  const sDateStr = startDate ? startDate.toISOString().split('T')[0] : null;
                  const eDateStr = endDate ? endDate.toISOString().split('T')[0] : null;
                  
                  const isStart = sDateStr === dateStr;
                  const isEnd = eDateStr === dateStr;
                  const inRange = isDateInRange(date);
                  
                  const isSelectedEndpoint = isStart || isEnd;
                  
                  const buttonRoundedClass = (isStart && !endDate) || (isStart && isEnd) ? 'rounded-lg' : 
                                      isStart && endDate ? 'rounded-l-lg rounded-r-none' :
                                      isEnd ? 'rounded-r-lg rounded-l-none' :
                                      inRange ? 'rounded-none' : 'rounded-lg';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleModalDateClick(date)}
                      className={cn(
                        "aspect-square border-none cursor-pointer p-0 transition-colors text-[13px] font-bold margin-y-0.5",
                        buttonRoundedClass,
                        isSelectedEndpoint 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm font-extrabold" 
                          : (inRange 
                            ? "bg-blue-500/15 dark:bg-blue-500/30 text-blue-800 dark:text-blue-300" 
                            : "bg-white dark:bg-cream-100 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 border border-border/35 dark:border-slate-850/50 shadow-sm")
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-black font-display text-slate-900 dark:text-white m-0">
                  Update Capacity
                </h3>
                <button onClick={() => setShowModal(false)} className="background-none border-none cursor-pointer p-1">
                  <X size={24} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                  Selected Dates
                </label>
                <div className="text-[15px] font-bold text-slate-900 dark:text-white p-3 px-4 bg-slate-50 dark:bg-slate-950 border border-border/50 dark:border-slate-800/80 rounded-xl">
                  {!startDate ? 'None selected' : 
                    !endDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) :
                    `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  }
                </div>
              </div>

              <div className="mb-auto">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                  Total Capacity (L)
                </label>
                <input 
                  type="number" 
                  value={editTotal} 
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none text-2xl font-black focus:border-blue-500 transition-colors"
                />
              </div>

              {/* OVERBOOKED WARNING */}
              {overbookedAlerts && (
                <div className="bg-rose-500/10 dark:bg-rose-950/15 border border-rose-200/30 dark:border-rose-900/30 rounded-xl p-4 mt-6">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2 font-bold">
                    <AlertTriangle size={18} />
                    <span>Capacity Conflict</span>
                  </div>
                  <p className="text-rose-900 dark:text-rose-205 text-[13px] mb-3 leading-relaxed">
                    You cannot set capacity to {editTotal}L because these dates are already overbooked:
                  </p>
                  <div className="max-h-[120px] overflow-y-auto divide-y divide-rose-200/30 dark:divide-rose-900/20 pr-1 hide-scrollbar">
                    {overbookedAlerts.map((alert, idx) => (
                      <div key={idx} className="flex justify-between py-1.5 first:pt-0">
                        <span className="font-semibold text-rose-800 dark:text-rose-350 text-[13px]">
                          {new Date(alert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-[13px]">
                          {alert.booked}L booked
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message && !overbookedAlerts && (
                <div className={cn(
                  "p-3 px-4 rounded-xl mt-6 text-sm font-semibold border",
                  message.type === 'success' 
                    ? "bg-green-500/10 dark:bg-green-950/15 border-green-200/30 dark:border-green-900/30 text-emerald-700 dark:text-emerald-400" 
                    : "bg-red-500/10 dark:bg-red-950/15 border-red-200/30 dark:border-red-900/30 text-rose-700 dark:text-rose-400"
                )}>
                  {message.text}
                </div>
              )}

              <button 
                onClick={handleSave}
                disabled={isSaving || !startDate}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 text-white border-none rounded-xl text-base font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Capacity'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
