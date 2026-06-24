import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold leading-none',
  {
    variants: {
      variant: {
        skip: 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
        vacation: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        extra: 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
        active: 'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
        pending: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        paid: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30',
        paused: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        cancelled: 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
        teal: 'bg-teal-50 text-teal-700 border border-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
        amber: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        neutral: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

const dotColors: Record<string, string> = {
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

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  children: React.ReactNode
}

export function Badge({ variant, dot = false, className, children, ...props }: BadgeProps) {
  const resolvedVariant = variant || 'neutral'
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[resolvedVariant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
