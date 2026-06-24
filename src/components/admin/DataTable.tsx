'use client'

import { ReactNode } from 'react'
import { ChevronRight, Edit2, Trash2, Eye, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  isLoading, 
  onEdit, 
  onDelete, 
  onView 
}: DataTableProps<T>) {
  
  if (isLoading) {
    return (
      <div 
        className="rounded-2xl border border-border/50 dark:border-slate-800/80 bg-warm-white dark:bg-cream-100 shadow-[0_2px_16px_var(--shadow)] flex flex-col items-center justify-center min-h-[400px]"
      >
        <div 
          className="w-8 h-8 border-4 border-slate-100 dark:border-slate-800 border-t-brand-secondary rounded-full animate-spin mb-4"
        />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading data...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="rounded-2xl border border-border/50 dark:border-slate-800/80 bg-warm-white dark:bg-cream-100 shadow-[0_2px_16px_var(--shadow)] flex flex-col items-center justify-center min-h-[400px]"
      >
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <Search size={24} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No records found</h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">There is no data to display here yet.</p>
      </div>
    )
  }

  return (
    <div 
      className="rounded-brand-lg border border-border/50 dark:border-slate-800/80 bg-warm-white dark:bg-cream-100 shadow-[0_2px_16px_var(--shadow)] overflow-hidden flex flex-col"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-collapse">
          <thead>
            <tr 
              className="border-b border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50"
            >
              {/* Checkbox column */}
              <th className="py-3 px-4 w-12 text-center">
                <div 
                  className="w-4 h-4 rounded border-[1.5px] border-slate-300 dark:border-slate-700 hover:border-brand-secondary dark:hover:border-brand-secondary hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors mx-auto cursor-pointer flex items-center justify-center"
                />
              </th>
              
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={cn(
                    "py-3.5 px-4 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500",
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  )}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="py-3.5 px-4 text-[10px] uppercase font-extrabold tracking-wider text-right text-slate-400 dark:text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {data.map((row) => (
              <tr 
                key={row.id} 
                className="transition-colors group h-14 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              >
                {/* Row Checkbox */}
                <td className="py-3 px-4 text-center">
                  <div 
                    className="w-4 h-4 rounded border-[1.5px] border-slate-200 dark:border-slate-800 hover:border-brand-secondary dark:hover:border-brand-secondary hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all mx-auto cursor-pointer"
                  />
                </td>

                {/* Columns */}
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={cn(
                      "py-3 px-4 text-[13px] font-medium text-slate-700 dark:text-slate-300",
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    {col.cell ? col.cell(row) : (row as any)[col.accessorKey as string]}
                  </td>
                ))}

                {/* Actions */}
                {(onEdit || onDelete || onView) && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {onView && (
                        <button 
                          onClick={() => onView(row)} 
                          className="flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-secondary dark:hover:text-brand-secondary hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors cursor-pointer w-[30px] h-[30px]" 
                          title="View Details"
                        >
                          <Eye size={14}/>
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)} 
                          className="flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors cursor-pointer w-[30px] h-[30px]" 
                          title="Edit"
                        >
                          <Edit2 size={14}/>
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)} 
                          className="flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors cursor-pointer w-[30px] h-[30px]" 
                          title="Delete"
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div 
        className="p-4 flex items-center justify-between text-[11px] font-bold border-t border-border/50 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500"
      >
        <span>Showing {data.length} records</span>
        <div className="flex items-center gap-1.5">
          <button 
            className="w-[30px] h-[30px] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 text-slate-400 transition-colors cursor-pointer"
          >
            <ChevronRight size={14} className="rotate-180"/>
          </button>
          <span className="px-2 font-extrabold text-slate-600 dark:text-slate-400">Page 1 of 1</span>
          <button 
            className="w-[30px] h-[30px] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 text-slate-400 transition-colors cursor-pointer"
          >
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}

