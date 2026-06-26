'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-teal-900/40 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in',
            'data-[state=closed]:opacity-0'
          )}
        />

        {/* Content */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50',
            '-translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)]',
            sizeStyles[size],
            'bg-white dark:bg-warm-white dark:border dark:border-border rounded-brand-2xl shadow-card',
            'p-8',
            'focus:outline-none',
            'data-[state=open]:animate-fade-up'
          )}
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className={cn(
                'absolute top-5 right-5',
                'w-9 h-9 rounded-full',
                'bg-milk-100 hover:bg-milk-200 dark:bg-cream-200 dark:hover:bg-cream-200/80',
                'flex items-center justify-center',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700'
              )}
              aria-label="Close modal"
            >
              <X size={16} className="text-teal-900/60 dark:text-teal-400/60" />
            </button>
          </Dialog.Close>

          {/* Header */}
          <div className="mb-6">
            <Dialog.Title className="text-xl font-bold text-teal-900 dark:text-white">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1 text-sm text-teal-900/55 dark:text-teal-300/60">
                {description}
              </Dialog.Description>
            )}
          </div>

          {/* Body */}
          <div className="text-teal-900/80 dark:text-brown-600">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="mt-8 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Confirm Modal — for destructive actions
interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
  danger?: boolean
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  loading = false,
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-teal-900/70 dark:text-teal-300/70 leading-relaxed">{message}</p>
    </Modal>
  )
}
