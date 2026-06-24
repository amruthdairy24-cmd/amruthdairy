'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-sans font-bold transition-all duration-200 ease-out select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: [
          'bg-teal-700 text-white shadow-button',
          'hover:bg-teal-500 hover:scale-[1.02] hover:-translate-y-px',
          'active:scale-[0.97] active:shadow-none',
          'disabled:bg-teal-700/40 disabled:shadow-none disabled:scale-100 disabled:translate-y-0',
          'dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-teal-600/40',
        ].join(' '),
        secondary: [
          'bg-amber-500 text-white shadow-amber',
          'hover:bg-amber-600 hover:scale-[1.02] hover:-translate-y-px',
          'active:scale-[0.97] active:shadow-none',
          'disabled:bg-amber-500/40 disabled:shadow-none disabled:scale-100 disabled:translate-y-0',
          'dark:bg-amber-600 dark:hover:bg-amber-500 dark:disabled:bg-amber-600/40',
        ].join(' '),
        ghost: [
          'border border-milk-300 text-teal-700 bg-transparent',
          'hover:bg-milk-100 hover:border-teal-700/30',
          'active:scale-[0.97]',
          'disabled:opacity-40 disabled:scale-100',
          'dark:border-milk-300/30 dark:text-teal-400 dark:hover:bg-milk-200/10',
        ].join(' '),
        danger: [
          'bg-red-500 text-white',
          'hover:bg-red-600 hover:scale-[1.02]',
          'active:scale-[0.97]',
          'disabled:opacity-40 disabled:scale-100',
          'dark:bg-red-600 dark:hover:bg-red-500',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-5 text-sm font-700',
        md: 'h-11 px-7 text-sm font-700',
        lg: 'h-14 px-10 text-base font-700',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  children: React.ReactNode
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      loading = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size || 'md'} />
            <span className="opacity-70">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

function LoadingSpinner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const spinnerSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <svg
      className={cn(spinnerSize, 'animate-spin')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
