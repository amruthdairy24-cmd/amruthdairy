'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leadingIcon, trailingIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-small font-semibold text-teal-900"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute left-4 flex items-center text-teal-900/50 pointer-events-none z-10">
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              'w-full h-12 rounded-[14px] px-4 text-sm',
              'font-sans text-teal-900',
              'bg-milk-100 border border-milk-300',
              'placeholder:text-teal-900/40',
              // Focus
              'focus:outline-none focus:border-teal-700 focus:bg-white',
              'focus:ring-2 focus:ring-teal-100',
              // Transition
              'transition-all duration-150',
              // Error
              error && 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100',
              // Prefix/suffix padding
              leadingIcon != null ? 'pl-10' : undefined,
              trailingIcon != null ? 'pr-10' : undefined,
              className
            )}
            {...props}
          />

          {trailingIcon && (
            <div className="absolute right-4 flex items-center text-teal-900/50 z-10">
              {trailingIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-tiny text-red-500 flex items-center gap-1" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-tiny text-teal-900/50">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Phone input with +91 prefix — for the login form
interface PhoneInputProps extends Omit<InputProps, 'leadingIcon' | 'type'> {
  onValueChange?: (value: string) => void
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onValueChange, onChange, ...props }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      // Strip non-numeric characters
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10)
      e.target.value = cleaned
      onValueChange?.(cleaned)
      onChange?.(e)
    }

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="98765 43210"
        leadingIcon={
          <span className="text-sm font-semibold text-teal-700 pr-2 border-r border-milk-300">
            +91
          </span>
        }
        className="pl-16"
        onChange={handleChange}
        {...props}
      />
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
