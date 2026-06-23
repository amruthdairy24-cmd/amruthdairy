'use client'

import { Plus, Search, Filter } from 'lucide-react'

interface AdminHeaderProps {
  title: string;
  description: string;
  icon: any; // Lucide icon component
  actionLabel?: string;
  onAction?: () => void;
  onSearch?: (term: string) => void;
}

export function AdminHeader({ 
  title, 
  description, 
  icon: Icon, 
  actionLabel, 
  onAction, 
  onSearch 
}: AdminHeaderProps) {
  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Top Row: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white"
            style={{ 
              background: 'linear-gradient(135deg, #1e3a8f, #2563eb)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
            }}
          >
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[26px] font-black text-[#0f172a] font-display tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-[12px] font-bold text-[#64748b] mt-0.5">
              {description}
            </p>
          </div>
        </div>
        
        {actionLabel && (
          <button 
            onClick={onAction}
            className="flex items-center justify-center gap-1.5 px-[18px] rounded-xl text-[13px] font-bold text-white transition-all cursor-pointer"
            style={{
              height: '40px',
              background: 'linear-gradient(135deg, #1e3a8f, #2563eb)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.25)'
            }}
          >
            <Plus size={16} strokeWidth={3} /> 
            <span>{actionLabel}</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Search & Filters */}
      <div 
        className="flex flex-col sm:flex-row justify-between items-center gap-4 p-[14px] rounded-2xl border transition-all"
        style={{ 
          background: '#ffffff', 
          borderColor: '#e8edf5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${title.toLowerCase()}...`}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[13px] font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400" 
            style={{
              background: '#f8fafc',
              border: '1px solid #e8edf5'
            }}
          />
        </div>
        <button 
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 transition-all bg-white border border-[#e8edf5] hover:bg-slate-50 cursor-pointer"
        >
          <Filter size={16} /> 
          <span>Filters</span>
        </button>
      </div>
    </div>
  )
}
