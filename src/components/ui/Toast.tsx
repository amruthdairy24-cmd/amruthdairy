'use client'

import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...item, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    toast: addToast,
    success: (title, description) => addToast({ type: 'success', title, description }),
    error: (title, description) => addToast({ type: 'error', title, description }),
    warning: (title, description) => addToast({ type: 'warning', title, description }),
    info: (title, description) => addToast({ type: 'info', title, description }),
  }

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
  warning: <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />,
  info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-green-100 dark:border-green-500/20',
  error: 'border-red-100 dark:border-red-500/20',
  warning: 'border-amber-100 dark:border-amber-500/20',
  info: 'border-blue-100 dark:border-blue-500/20',
}

function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  return (
    <ToastPrimitive.Root
      onOpenChange={(open) => { if (!open) onClose() }}
      className={cn(
        'bg-white dark:bg-warm-white rounded-brand-md p-4 shadow-card',
        'border',
        typeStyles[toast.type],
        'flex items-start gap-3',
        'data-[state=open]:animate-slide-right',
        'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        'transition-all'
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-sm font-bold text-teal-900 dark:text-white">
          {toast.title}
        </ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description className="text-xs text-teal-900/60 dark:text-teal-400/65 mt-0.5">
            {toast.description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close asChild>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-milk-100 dark:hover:bg-cream-200 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} className="text-teal-900/40 dark:text-teal-400/40" />
        </button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
