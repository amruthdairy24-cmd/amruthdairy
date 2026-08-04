'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

const PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get('range') || 'month';

  const handleSelect = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', range);
    // Note: startDate, endDate, targetMonth will be computed in page.tsx based on 'range'
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#27272A] p-1 rounded-lg">
      <div className="pl-2 pr-1 text-slate-400 dark:text-slate-500">
        <CalendarIcon size={16} />
      </div>
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => handleSelect(preset.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            currentRange === preset.value
              ? "bg-white dark:bg-[#3F3F46] text-slate-900 dark:text-slate-50 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
