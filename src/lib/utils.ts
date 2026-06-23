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
 * getIndiaTime — Returns current time in Asia/Kolkata timezone
 * ALWAYS use this for time comparisons, NEVER client machine time
 */
export function getIndiaTime(): Date {
  const now = new Date()
  const indiaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  )
  return indiaTime
}

/**
 * getIndiaHour — Returns current hour (0-23) in India timezone
 */
export function getIndiaHour(): number {
  return getIndiaTime().getHours()
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
 * cn — Class name utility (simple version without clsx)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
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
