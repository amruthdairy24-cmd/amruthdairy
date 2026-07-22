import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

/**
 * formatRupees — Convert paise (integer) to display string
 * ALWAYS use this for displaying monetary values. Never store rupees.
 *
 * @param paise - Amount in paise (integer). e.g. 248000
 * @returns Formatted string. e.g. "₹2,480"
 */
export function formatRupees(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)
}

/**
 * formatRupeesCompact — For display in small badges
 * @param paise - Amount in paise
 * @returns e.g. "₹82.67"
 */
export function formatRupeesCompact(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/**
 * getIndiaTimeString — Returns current date-time string in Asia/Kolkata timezone
 */
export function getIndiaTimeString(): string {
  return formatInTimeZone(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX")
}

/**
 * getTodayIST — Returns current date string (YYYY-MM-DD) in Asia/Kolkata timezone
 */
export function getTodayIST(): string {
  return formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')
}

/**
 * getIndiaHour — Returns current hour (0-23) in India timezone
 */
export function getIndiaHour(): number {
  return parseInt(formatInTimeZone(new Date(), 'Asia/Kolkata', 'H'), 10)
}

/**
 * canSkipToday — Check if it's before the 9 PM deadline
 */
export function canSkipToday(): { allowed: boolean; reason?: string } {
  const hour = getIndiaHour()
  if (hour >= 21) {
    return { allowed: false, reason: 'deadline_passed' }
  }
  return { allowed: true }
}

/**
 * formatDate — Format a Date object for display
 * @param date
 * @param format - 'long' | 'short' | 'month'
 */
export function formatDate(
  date: Date | string,
  format: 'long' | 'short' | 'month' | 'day' = 'long'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    case 'short':
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    case 'month':
      return d.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    case 'day':
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'Asia/Kolkata',
      })
    default:
      return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  }
}

/**
 * getDaysInMonth — Get number of days in a given month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * getDailyRate — Calculate per-day rate for a given month
 * @param monthlyAmountPaise - Monthly amount in paise
 * @param date - Any date in the month
 * @returns Daily rate in paise (rounded)
 */
export function getDailyRate(monthlyAmountPaise: number, date: Date): number {
  const daysInMonth = getDaysInMonth(date)
  return Math.round(monthlyAmountPaise / daysInMonth)
}

/**
 * cn — Class name utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * getBillingMonth — Returns YYYY-MM string for a date
 */
export function getBillingMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * pluralize — Simple plural helper
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

import { fromZonedTime } from 'date-fns-tz'

/**
 * getDeadlineForDate — Given a date string (YYYY-MM-DD), returns the UTC Date
 * representing 9 PM IST on the PREVIOUS day.
 */
export function getDeadlineForDate(dateStr: string): Date {
  const target = new Date(dateStr)
  target.setDate(target.getDate() - 1)
  const prevDateStr = target.toISOString().split('T')[0]
  
  // Create a string representing 9 PM in IST
  const localTimeString = `${prevDateStr}T21:00:00`
  
  // Convert the IST time string into a valid UTC Date object
  return fromZonedTime(localTimeString, 'Asia/Kolkata')
}

/**
 * getEarliestStartDateStr — Returns the earliest possible start date (YYYY-MM-DD)
 * for a new subscription. Takes the 9 PM IST cutoff into account.
 */
export function getEarliestStartDateStr(): string {
  const now = new Date()
  const istTimeStr = formatInTimeZone(now, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss")
  const istDate = new Date(istTimeStr) // This creates a local date object containing the IST values
  
  const currentHour = istDate.getHours()
  
  if (currentHour >= 21) {
    istDate.setDate(istDate.getDate() + 2)
  } else {
    istDate.setDate(istDate.getDate() + 1)
  }
  
  const year = istDate.getFullYear()
  const month = String(istDate.getMonth() + 1).padStart(2, '0')
  const day = String(istDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}
