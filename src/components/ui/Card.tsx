import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'admin' | 'teal' | 'flat'
  hover?: boolean
  children: React.ReactNode
}

export function Card({
  variant = 'default',
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-milk-300 rounded-[20px] shadow-card',
    admin: 'bg-slate-50 border border-slate-100 rounded-[18px] shadow-card',
    teal: 'bg-teal-700 text-white rounded-[24px]',
    flat: 'bg-milk-50 border border-milk-200 rounded-[20px]',
  }

  return (
    <div
      className={cn(
        variantStyles[variant],
        hover &&
          'transition-all duration-300 ease-out cursor-pointer hover:shadow-card-hover hover:-translate-y-[3px]',
        className
      )}
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
