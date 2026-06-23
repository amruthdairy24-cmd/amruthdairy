'use client'

import { useState, useMemo } from 'react'
import { Droplets, Save, AlertTriangle, Plus, X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      <AdminHeader 
        title="Production Capacity" 
        description="View your daily capacity limits in a list. Add or edit capacity for any date." 
        icon={Droplets} 
        actionLabel="Add / Edit Capacity"
        onAction={openModal}
      />

      {/* MAIN DISPLAY BOARD TABLE */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '24px', 
        padding: '32px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon size={24} color="#0f172a" />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {viewDate.toLocaleString('default', { month: 'long' })} {viewDate.getFullYear()}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => changeMonth(-1)} style={navBtnStyle}>&larr; Prev</button>
            <button onClick={() => setViewDate(new Date())} style={navBtnStyle}>Today</button>
            <button onClick={() => changeMonth(1)} style={navBtnStyle}>Next &rarr;</button>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div style={{ 
          maxHeight: '65vh', 
          overflowY: 'auto', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Total Capacity (L)</th>
                <th style={thStyle}>Booked (L)</th>
                <th style={thStyle}>Available (L)</th>
                <th style={thStyle}>Utilization</th>
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
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: isToday ? '#eff6ff' : '#ffffff',
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ ...tdStyle, fontWeight: isToday ? 800 : 600, color: isToday ? '#1d4ed8' : '#0f172a' }}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {isToday && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>TODAY</span>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700,
                        background: percent >= 100 ? '#fef2f2' : (percent >= 80 ? '#fffbeb' : '#f0fdf4'),
                        color: percent >= 100 ? '#ef4444' : (percent >= 80 ? '#d97706' : '#22c55e')
                      }}>
                        {percent >= 100 ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>}
                        {percent >= 100 ? 'Full' : (percent >= 80 ? 'Filling Fast' : 'Available')}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a' }}>
                      {log.total_litres} L
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#ea580c' }}>
                      {log.booked_litres} L
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: available <= 0 ? '#ef4444' : '#22c55e' }}>
                      {available.toFixed(1)} L
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', flex: 1, overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${percent}%`, 
                            background: percent >= 100 ? '#ef4444' : percent > 80 ? '#f59e0b' : '#3b82f6',
                            borderRadius: '99px'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', minWidth: '35px' }}>
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '800px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', overflow: 'hidden'
          }}>
            
            {/* LEFT SIDE: CALENDAR SELECTION */}
            <div style={{ flex: 1, padding: '32px', background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} /> Select Date(s)
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                Click once for a single date, or click a second date to select a range.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                  {modalViewDate.toLocaleString('default', { month: 'long' })} {modalViewDate.getFullYear()}
                </h4>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => changeMonth(-1, true)} style={miniNavBtnStyle}>&larr;</button>
                  <button onClick={() => changeMonth(1, true)} style={miniNavBtnStyle}>&rarr;</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{day}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {modalCalendarDays.map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} />;
                  
                  const dateStr = date.toISOString().split('T')[0];
                  
                  const sDateStr = startDate ? startDate.toISOString().split('T')[0] : null;
                  const eDateStr = endDate ? endDate.toISOString().split('T')[0] : null;
                  
                  const isStart = sDateStr === dateStr;
                  const isEnd = eDateStr === dateStr;
                  const inRange = isDateInRange(date);
                  
                  const isSelectedEndpoint = isStart || isEnd;
                  const bgColor = isSelectedEndpoint ? '#0f172a' : (inRange ? '#e2e8f0' : '#ffffff');
                  const textColor = isSelectedEndpoint ? '#ffffff' : (inRange ? '#0f172a' : '#334155');
                  
                  const borderRadius = (isStart && !endDate) || (isStart && isEnd) ? '8px' : 
                                      isStart && endDate ? '8px 0 0 8px' :
                                      isEnd ? '0 8px 8px 0' :
                                      inRange ? '0' : '8px';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleModalDateClick(date)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: borderRadius,
                        border: 'none',
                        background: bgColor,
                        color: textColor,
                        fontSize: '13px',
                        fontWeight: isSelectedEndpoint || inRange ? 700 : 500,
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background 0.2s',
                        margin: '2px 0',
                        boxShadow: !inRange && !isSelectedEndpoint ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Update Capacity
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={24} color="#64748b" />
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Selected Dates
                </label>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {!startDate ? 'None selected' : 
                    !endDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) :
                    `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  }
                </div>
              </div>

              <div style={{ marginBottom: 'auto' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Total Capacity (L)
                </label>
                <input 
                  type="number" 
                  value={editTotal} 
                  onChange={(e) => setEditTotal(e.target.value)}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', 
                    outline: 'none', fontSize: '24px', fontWeight: 800, color: '#0f172a',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* OVERBOOKED WARNING */}
              {overbookedAlerts && (
                <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '16px', marginTop: '24px', border: '1px solid #fee2e2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px', fontWeight: 700 }}>
                    <AlertTriangle size={18} />
                    <span>Capacity Conflict</span>
                  </div>
                  <p style={{ color: '#991b1b', fontSize: '13px', marginBottom: '12px' }}>
                    You cannot set capacity to {editTotal}L because these dates are already overbooked:
                  </p>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {overbookedAlerts.map((alert, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: idx !== overbookedAlerts.length - 1 ? '1px solid #fecaca' : 'none' }}>
                        <span style={{ fontWeight: 600, color: '#991b1b', fontSize: '13px' }}>
                          {new Date(alert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '13px' }}>
                          {alert.booked}L booked
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message && !overbookedAlerts && (
                <div style={{ 
                  padding: '12px 16px', borderRadius: '8px', marginTop: '24px', fontSize: '14px', fontWeight: 500,
                  background: message.type === 'success' ? '#dcfce7' : '#fef2f2',
                  color: message.type === 'success' ? '#166534' : '#991b1b'
                }}>
                  {message.text}
                </div>
              )}

              <button 
                onClick={handleSave}
                disabled={isSaving || !startDate}
                style={{
                  width: '100%', padding: '16px', background: '#0f172a', color: '#fff', border: 'none',
                  borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: isSaving || !startDate ? 'not-allowed' : 'pointer',
                  opacity: isSaving || !startDate ? 0.7 : 1, marginTop: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
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

const navBtnStyle = {
  background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 16px', 
  cursor: 'pointer', fontWeight: 700, color: '#475569', fontSize: '14px'
};

const miniNavBtnStyle = {
  background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '4px 8px', 
  cursor: 'pointer', fontWeight: 700, color: '#475569', fontSize: '12px'
};

const thStyle = {
  padding: '16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px', fontSize: '14px', color: '#475569'
};
