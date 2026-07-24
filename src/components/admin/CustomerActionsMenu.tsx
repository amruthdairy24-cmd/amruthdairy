'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Settings, SkipForward, Droplet, CalendarRange } from 'lucide-react'

interface CustomerActionsMenuProps {
  onManageSubscription: () => void
  onMarkSkip: () => void
  onAddExtraMilk: () => void
  onAddVacation: () => void
}

export function CustomerActionsMenu({
  onManageSubscription,
  onMarkSkip,
  onAddExtraMilk,
  onAddVacation
}: CustomerActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className="flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors cursor-pointer w-[30px] h-[30px]" 
        title="More Actions"
      >
        <MoreVertical size={14}/>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-[100] flex flex-col overflow-hidden">
          <button
            onClick={() => { setIsOpen(false); onManageSubscription() }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Settings size={14} className="text-blue-500" />
            Manage Subscription
          </button>
          
          <button
            onClick={() => { setIsOpen(false); onMarkSkip() }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <SkipForward size={14} className="text-amber-500" />
            Mark Skip
          </button>

          <button
            onClick={() => { setIsOpen(false); onAddExtraMilk() }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Droplet size={14} className="text-cyan-500" />
            Add Extra Milk
          </button>

          <button
            onClick={() => { setIsOpen(false); onAddVacation() }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CalendarRange size={14} className="text-purple-500" />
            Add Vacation
          </button>
        </div>
      )}
    </div>
  )
}
