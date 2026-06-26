'use client'

import { cn } from '@/lib/utils'

type StatusType = 
  | 'success' // Active, Completed, Paid, Delivered
  | 'warning' // Pending, Low Stock, Due
  | 'danger'  // Inactive, Cancelled, Out of Stock, Failed
  | 'info'    // Draft, Vacation, Processing
  | 'default' // Default grey

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

export function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  // Auto-map common statuses if type isn't explicitly provided
  let determinedType = type;
  if (type === 'default') {
    const s = status.toLowerCase();
    if (['active', 'completed', 'paid', 'delivered', 'optimal', 'ready', 'converted'].includes(s)) determinedType = 'success';
    else if (['pending', 'low stock', 'due', 'generating', 'waitlist'].includes(s)) determinedType = 'warning';
    else if (['inactive', 'cancelled', 'out of stock', 'failed', 'dropped'].includes(s)) determinedType = 'danger';
    else if (['draft', 'vacation', 'processing', 'scheduled'].includes(s)) determinedType = 'info';
  }

  const styleClasses = {
    success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/60 dark:border-green-800/45',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/45',
    danger:  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/45',
    info:    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/45',
    default: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/45',
  };

  const dotClasses = {
    success: 'bg-green-500 dark:bg-green-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger:  'bg-red-500 dark:bg-red-400',
    info:    'bg-blue-500 dark:bg-blue-400',
    default: 'bg-slate-500 dark:bg-slate-400',
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.5px] border-[1.5px]",
        styleClasses[determinedType]
      )}
    >
      <span 
        className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", dotClasses[determinedType])}
      />
      {status}
    </span>
  );
}

