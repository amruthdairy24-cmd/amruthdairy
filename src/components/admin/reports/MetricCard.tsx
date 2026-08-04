import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trendPercentage?: number;
  icon?: LucideIcon;
  loading?: boolean;
  action?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trendPercentage,
  icon: Icon,
  loading = false,
  action
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-[140px]">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl p-5 shadow-sm relative overflow-hidden group flex flex-col justify-between h-[140px]">
      {Icon && (
        <div className="absolute top-4 right-4 text-slate-300 dark:text-slate-700 opacity-50">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
        {action && (
          <div className="relative z-10">
            {action}
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
          {value}
        </p>
        
        {(subtitle || trendPercentage !== undefined) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trendPercentage !== undefined && (
              <span className={cn(
                "font-medium",
                trendPercentage >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
