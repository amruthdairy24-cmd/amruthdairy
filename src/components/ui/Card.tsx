import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-white border border-milk-300 rounded-brand-lg shadow-card dark:bg-warm-white dark:border-border dark:shadow-none',
        admin: 'bg-slate-50 border border-slate-100 rounded-brand-md shadow-card dark:bg-cream-100 dark:border-border dark:shadow-none',
        teal: 'bg-teal-700 text-white rounded-brand-xl dark:bg-teal-800',
        flat: 'bg-milk-50 border border-milk-200 rounded-brand-lg dark:bg-cream-200/40 dark:border-border',
      },
      hover: {
        true: 'cursor-pointer hover:shadow-card-hover hover:-translate-y-[3px] dark:hover:border-teal-500/30',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
    },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
}

export function Card({
  variant,
  hover,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, hover }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Card sub-components
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pt-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pb-6 pt-4', className)} {...props}>
      {children}
    </div>
  )
}
