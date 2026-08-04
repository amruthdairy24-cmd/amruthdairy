import React from 'react';
import { DefaulterRow } from '@/lib/reports/types';

interface ExceptionTableProps {
  data: DefaulterRow[];
}

export function ExceptionTable({ data }: ExceptionTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500 flex flex-col items-center">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
          <span className="text-xl">🎉</span>
        </div>
        <p>No exceptions to report today.</p>
        <p className="text-xs text-slate-400 mt-1">All dues are cleared.</p>
      </div>
    );
  }

  const handleRemind = (row: DefaulterRow) => {
    if (!row.phone) {
      alert("No phone number available for this customer.");
      return;
    }
    const cleanPhone = row.phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const msg = `Hi ${row.name},\n\nThis is a gentle reminder that your Amruth Dairy milk subscription bill of ₹${row.amountDue.toLocaleString('en-IN')} is currently pending.\n\nPlease clear the dues at your earliest convenience to ensure uninterrupted deliveries.\n\nThank you!\nAmruth Dairy`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="text-xs uppercase bg-slate-50 dark:bg-[#18181B] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#27272A]">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Customer Name</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Amount Due</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={row.customerId} 
              className={`hover:bg-slate-50 dark:hover:bg-[#27272A] transition-colors ${idx !== data.length - 1 ? 'border-b border-slate-100 dark:border-[#27272A]' : ''}`}
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                {row.name}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400 font-medium">
                ₹{row.amountDue.toLocaleString('en-IN')}
              </td>
              <td className="px-4 py-3 text-right">
                <button 
                  onClick={() => handleRemind(row)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Remind
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
