'use client'

import { ReactNode } from 'react'
import { ChevronRight, Edit2, Trash2, Eye, Search } from 'lucide-react'

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
        className="rounded-2xl border flex flex-col items-center justify-center min-h-[400px]"
        style={{ 
          background: '#ffffff', 
          borderColor: '#e8edf5',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}
      >
        <div 
          className="w-8 h-8 border-4 rounded-full animate-spin mb-4"
          style={{ 
            borderColor: '#eff6ff', 
            borderTopColor: '#2563eb' 
          }}
        />
        <p className="text-sm font-bold text-slate-500">Loading data...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="rounded-2xl border flex flex-col items-center justify-center min-h-[400px]"
        style={{ 
          background: '#ffffff', 
          borderColor: '#e8edf5',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}
      >
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Search size={24} className="text-slate-300" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No records found</h3>
        <p className="text-xs font-medium text-slate-500 mt-1">There is no data to display here yet.</p>
      </div>
    )
  }

  return (
    <div 
      className="rounded-[20px] border overflow-hidden flex flex-col"
      style={{ 
        background: '#ffffff', 
        borderColor: '#e8edf5',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-collapse">
          <thead>
            <tr 
              className="border-b"
              style={{ 
                background: '#f8fafc',
                borderBottomColor: '#f1f5f9' 
              }}
            >
              {/* Checkbox column */}
              <th className="py-3 px-4 w-12 text-center">
                <div 
                  className="w-4 h-4 rounded border transition-colors mx-auto cursor-pointer flex items-center justify-center"
                  style={{
                    borderColor: '#e2e8f0',
                    borderWidth: '1.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb'
                    e.currentTarget.style.background = '#eff6ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.background = 'transparent'
                  }}
                />
              </th>
              
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`py-3.5 px-4 text-[10px] uppercase font-extrabold tracking-wider ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={{ color: '#94a3b8' }}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="py-3.5 px-4 text-[10px] uppercase font-extrabold tracking-wider text-right" style={{ color: '#94a3b8' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-50">
            {data.map((row) => (
              <tr 
                key={row.id} 
                className="transition-colors group"
                style={{ height: '56px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fafbff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Row Checkbox */}
                <td className="py-3 px-4 text-center">
                  <div 
                    className="w-4 h-4 rounded border transition-all mx-auto cursor-pointer"
                    style={{
                      borderColor: '#e2e8f0',
                      borderWidth: '1.5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb'
                      e.currentTarget.style.background = '#eff6ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  />
                </td>

                {/* Columns */}
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={`py-3 px-4 text-[13px] font-medium text-slate-700 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
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
                          className="flex items-center justify-center rounded-lg text-slate-400 hover:text-[#2563eb] transition-colors border border-transparent cursor-pointer" 
                          style={{ width: '30px', height: '30px' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eff6ff'
                            e.currentTarget.style.borderColor = '#bfdbfe'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
                          title="View Details"
                        >
                          <Eye size={14}/>
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)} 
                          className="flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 transition-colors border border-transparent cursor-pointer" 
                          style={{ width: '30px', height: '30px' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0fdf4'
                            e.currentTarget.style.borderColor = '#bbf7d0'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
                          title="Edit"
                        >
                          <Edit2 size={14}/>
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)} 
                          className="flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 transition-colors border border-transparent cursor-pointer" 
                          style={{ width: '30px', height: '30px' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef2f2'
                            e.currentTarget.style.borderColor = '#fecaca'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
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
        className="p-4 flex items-center justify-between text-[11px] font-bold border-t"
        style={{ 
          background: '#f8fafc',
          borderTopColor: '#f1f5f9',
          color: '#94a3b8'
        }}
      >
        <span>Showing {data.length} records</span>
        <div className="flex items-center gap-1.5">
          <button 
            className="rounded-lg border flex items-center justify-center hover:bg-white text-slate-400 transition-colors cursor-pointer"
            style={{ width: '30px', height: '30px', borderColor: '#e2e8f0' }}
          >
            <ChevronRight size={14} className="rotate-180"/>
          </button>
          <span className="px-2 font-extrabold text-[#475569]">Page 1 of 1</span>
          <button 
            className="rounded-lg border flex items-center justify-center hover:bg-white text-slate-400 transition-colors cursor-pointer"
            style={{ width: '30px', height: '30px', borderColor: '#e2e8f0' }}
          >
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}
