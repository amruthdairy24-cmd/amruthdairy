import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'skip'
  | 'vacation'
  | 'extra'
  | 'active'
  | 'pending'
  | 'paid'
  | 'paused'
  | 'cancelled'
  | 'teal'
  | 'amber'
  | 'neutral'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  skip: 'bg-red-50 text-red-600 border border-red-100',
  vacation: 'bg-blue-50 text-blue-600 border border-blue-100',
  extra: 'bg-green-50 text-green-600 border border-green-100',
  active: 'bg-teal-100 text-teal-700 border border-teal-200',
  pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  paid: 'bg-green-50 text-green-700 border border-green-200',
  paused: 'bg-blue-50 text-blue-600 border border-blue-100',
  cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
  teal: 'bg-teal-50 text-teal-700 border border-teal-100',
  amber: 'bg-amber-50 text-amber-600 border border-amber-100',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
}

const dotColors: Record<BadgeVariant, string> = {
  skip: 'bg-red-500',
  vacation: 'bg-blue-500',
  extra: 'bg-green-500',
  active: 'bg-teal-500',
  pending: 'bg-amber-500',
  paid: 'bg-green-500',
  paused: 'bg-blue-400',
  cancelled: 'bg-slate-400',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  neutral: 'bg-slate-400',
}

export function Badge({ variant = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'rounded-full px-3 py-1',
        'text-xs font-bold',
        'leading-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
