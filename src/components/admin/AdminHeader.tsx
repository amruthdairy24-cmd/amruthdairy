'use client'

import { Plus, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  title: string;
  description: string;
  icon: any; // Lucide icon component
  actionLabel?: string;
  onAction?: () => void;
  onSearch?: (term: string) => void;
  hideSearchRow?: boolean;
}

export function AdminHeader({ 
  title, 
  description, 
  icon: Icon, 
  actionLabel, 
  onAction, 
  onSearch,
  hideSearchRow = false
}: AdminHeaderProps) {
  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Top Row: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_4px_14px_rgba(15,46,92,0.3)] dark:shadow-[0_4px_14px_rgba(2,132,199,0.2)]"
          >
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[26px] font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>
        
        {actionLabel && (
          <button 
            onClick={onAction}
            className="flex items-center justify-center gap-1.5 px-[18px] h-10 rounded-xl text-[13px] font-bold text-white bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_4px_14px_rgba(15,46,92,0.25)] hover:shadow-[0_6px_18px_rgba(15,46,92,0.35)] dark:shadow-[0_4px_14px_rgba(2,132,199,0.2)] dark:hover:shadow-[0_6px_18px_rgba(2,132,199,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} /> 
            <span>{actionLabel}</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Search & Filters */}
      {!hideSearchRow && (
        <div 
          className="flex flex-col sm:flex-row justify-between items-center gap-4 p-[14px] rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all"
        >
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-455 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder={`Search ${title.toLowerCase()}...`}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-750 dark:text-slate-200" 
            />
          </div>
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-extrabold text-slate-600 dark:text-slate-300 transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-3xs hover:shadow-2xs cursor-pointer"
          >
            <Filter size={16} className="text-slate-400 dark:text-slate-500" /> 
            <span>Filters</span>
          </button>
        </div>
      )}
    </div>
  )
}

