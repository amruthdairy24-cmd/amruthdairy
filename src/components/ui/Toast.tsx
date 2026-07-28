'use client'

import { toast as hotToast } from 'react-hot-toast'
import React from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (item: ToastItem) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const showToastMessage = (title: string, description?: string) => {
  if (description) {
    return `${title}\n${description}`
  }
  return title
}

export function useToast(): ToastContextValue {
  return {
    toast: (item) => {
      const msg = showToastMessage(item.title, item.description)
      if (item.type === 'error') hotToast.error(msg)
      else if (item.type === 'success') hotToast.success(msg)
      else hotToast(msg)
    },
    success: (title, description) => {
      hotToast.success(showToastMessage(title, description))
    },
    error: (title, description) => {
      hotToast.error(showToastMessage(title, description))
    },
    warning: (title, description) => {
      hotToast(showToastMessage(title, description), { icon: '⚠️' })
    },
    info: (title, description) => {
      hotToast(showToastMessage(title, description), { icon: 'ℹ️' })
    },
  }
}
