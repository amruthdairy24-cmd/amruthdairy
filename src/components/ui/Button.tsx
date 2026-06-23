'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
  asChild?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-teal-700 text-white shadow-button',
    'hover:bg-teal-500 hover:scale-[1.02] hover:-translate-y-px',
    'active:scale-[0.97] active:shadow-none',
    'disabled:bg-teal-700/40 disabled:shadow-none disabled:cursor-not-allowed',
  ].join(' '),
  secondary: [
    'bg-amber-500 text-white shadow-amber',
    'hover:bg-amber-600 hover:scale-[1.02] hover:-translate-y-px',
    'active:scale-[0.97] active:shadow-none',
    'disabled:bg-amber-500/40 disabled:shadow-none disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'border border-milk-300 text-teal-700 bg-transparent',
    'hover:bg-milk-100 hover:border-teal-700/30',
    'active:scale-[0.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600 hover:scale-[1.02]',
    'active:scale-[0.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-5 text-sm font-700',
  md: 'h-11 px-7 text-sm font-700',
  lg: 'h-14 px-10 text-base font-700',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
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
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2',
          'rounded-full font-sans font-bold',
          'transition-all duration-200 ease-out',
          'select-none cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:outline-offset-2',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size} />
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

function LoadingSpinner({ size }: { size: ButtonSize }) {
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
