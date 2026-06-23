/**
 * ═══════════════════════════════════════════════════════════
 * AMRUTH DAIRY — Centralized Billing Module
 *
 * Per project rule: "Billing calculations ONLY go in src/lib/billing.ts"
 *
 * Price is ADMIN-MANAGED:
 *   - Admin sets `price_per_litre` via app_settings table
 *   - Monthly = price_per_litre × quantity × actual_days_in_month
 *   - Daily rate = price_per_litre × quantity
 *
 * All API routes and frontend pages MUST import from here.
 * ═══════════════════════════════════════════════════════════
 */

import { SETTINGS_KEY_PRICE_PER_LITRE } from '@/lib/constants'

export interface PriceSettingValue {
  amount: number;
  next_amount?: number;
  effective_date?: string;
}

// ─────────────────────────────────────────
// Calendar helpers
// ─────────────────────────────────────────

/**
 * Get actual number of days in a given month.
 * @param year - Full year (e.g. 2026)
 * @param month - 1-indexed month (1 = January, 12 = December)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Get days in month from a Date object.
 */
export function getDaysInMonthFromDate(date: Date): number {
  return getDaysInMonth(date.getFullYear(), date.getMonth() + 1)
}

/**
 * Get the first day of the month as YYYY-MM-DD string.
 */
export function getFirstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/**
 * Get remaining delivery days from a start date to end of that month.
 * Excludes any dates in the excludedDates set.
 *
 * @param startDate - YYYY-MM-DD string
 * @param excludedDates - Set of YYYY-MM-DD strings to exclude
 * @returns Number of delivery days
 */
export function getRemainingDeliveryDays(
  startDate: string,
  excludedDates: Set<string> = new Set()
): number {
  const start = new Date(startDate)
  const year = start.getFullYear()
  const month = start.getMonth() + 1
  const lastDay = getDaysInMonth(year, month)
  const startDay = start.getDate()

  let count = 0
  for (let d = startDay; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!excludedDates.has(dateStr)) {
      count++
    }
  }
  return count
}

/**
 * Get all dates in a month as YYYY-MM-DD strings.
 */
export function getAllDatesInMonth(year: number, month: number): string[] {
  const daysInMonth = getDaysInMonth(year, month)
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return dates
}

// ─────────────────────────────────────────
// Pricing calculations
// ─────────────────────────────────────────



/**
 * Calculate the monthly amount for a subscription.
 * Monthly = daily_rate × actual_days_in_month
 *
 * @param dailyRate - Daily rate in rupees
 * @param year - Full year
 * @param month - 1-indexed month
 * @returns Monthly amount in rupees (rounded to 2 decimals)
 */
export function calculateMonthlyAmount(
  dailyRate: number,
  year: number,
  month: number
): number {
  const daysInMonth = getDaysInMonth(year, month)
  return Math.round(dailyRate * daysInMonth * 100) / 100
}

/**
 * Calculate monthly amount excluding specific dates.
 *
 * @param dailyRate - Daily rate in rupees
 * @param year - Full year
 * @param month - 1-indexed month
 * @param excludedDates - Set of YYYY-MM-DD strings to exclude from billing
 * @returns Monthly amount in rupees (rounded to 2 decimals)
 */
export function calculateMonthlyAmountWithExclusions(
  dailyRate: number,
  year: number,
  month: number,
  excludedDates: Set<string> = new Set()
): number {
  const daysInMonth = getDaysInMonth(year, month)
  let deliveryDays = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!excludedDates.has(dateStr)) {
      deliveryDays++
    }
  }
  return Math.round(dailyRate * deliveryDays * 100) / 100
}

/**
 * Calculate pro-rata amount for a partial month subscription.
 *
 * @param dailyRate - Daily rate in rupees
 * @param startDate - YYYY-MM-DD subscription start date
 * @param excludedDates - Set of YYYY-MM-DD strings to exclude
 * @returns Pro-rata amount in rupees (rounded to 2 decimals)
 */
export function calculateProRataAmount(
  dailyRate: number,
  startDate: string,
  excludedDates: Set<string> = new Set()
): number {
  const deliveryDays = getRemainingDeliveryDays(startDate, excludedDates)
  return Math.round(dailyRate * deliveryDays * 100) / 100
}

/**
 * Calculate skip credit amount.
 * @param dailyRate - The subscription's daily rate
 * @returns Credit amount in rupees
 */
export function calculateSkipCredit(dailyRate: number): number {
  return Math.round(dailyRate * 100) / 100
}

/**
 * Calculate vacation credit amount.
 * @param dailyRate - The subscription's daily rate
 * @param totalDays - Number of vacation days
 * @returns Credit amount in rupees
 */
export function calculateVacationCredit(
  dailyRate: number,
  totalDays: number
): number {
  return Math.round(dailyRate * totalDays * 100) / 100
}

/**
 * Calculate extra milk charge.
 * Extra milk is priced proportionally to the subscription rate.
 *
 * @param extraLitres - Extra litres ordered
 * @param pricePerLitre - Admin-set price per litre
 * @returns Charge amount in rupees
 */
export interface TieredPricingValue {
  prices: Record<string, number>; // "0.5": 40, "1": 80, etc.
  next_prices?: Record<string, number>;
  effective_date?: string;
}

const DEFAULT_TIER_PRICES = {
  "0.5": 41.34,
  "1": 82.67,
  "1.5": 124,
  "2": 165.34
};

export function calculateDailyRate(
  quantity: number,
  prices: Record<string, number>
): number {
  const qtyStr1 = quantity.toString();
  const qtyStr2 = quantity.toFixed(1);
  if (prices[qtyStr1] !== undefined) {
    return prices[qtyStr1];
  }
  if (prices[qtyStr2] !== undefined) {
    return prices[qtyStr2];
  }
  // Fallback if quantity is non-standard
  const baseRate = prices["1.0"] || prices["1"] || 82.67;
  return Math.round(baseRate * quantity * 100) / 100;
}

export function calculateExtraMilkCharge(
  extraLitres: number,
  prices: Record<string, number>
): number {
  const baseRate = prices["1"] || 82.67;
  return Math.round(baseRate * extraLitres * 100) / 100;
}

// ─────────────────────────────────────────
// Server-side pricing fetch
// ─────────────────────────────────────────

export async function fetchMilkPrices(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: { from: (table: string) => any }
): Promise<Record<string, number>> {
  const { data, error } = await adminClient
    .from('app_settings')
    .select('value')
    .eq('key', 'milk_tier_prices')
    .single()

  if (error || !data) {
    return DEFAULT_TIER_PRICES;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = (data as any).value as TieredPricingValue
  
  if (parsed.next_prices && parsed.effective_date) {
    const today = new Date();
    const effective = new Date(parsed.effective_date);
    if (today >= effective) {
      return parsed.next_prices;
    }
  }

  return parsed.prices || DEFAULT_TIER_PRICES;
}

export async function fetchRawMilkPricing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: { from: (table: string) => any }
): Promise<TieredPricingValue> {
  const { data, error } = await adminClient
    .from('app_settings')
    .select('value')
    .eq('key', 'milk_tier_prices')
    .single()

  if (error || !data) {
    return { prices: DEFAULT_TIER_PRICES };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any).value as TieredPricingValue;
}

// ─────────────────────────────────────────
// Client-side pricing fetch
// ─────────────────────────────────────────

export async function fetchMilkPricesClient(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/admin/settings?key=milk_tier_prices')
    const data = await res.json()
    if (data.success && data.value) {
      const parsed = data.value as TieredPricingValue;
      if (parsed.next_prices && parsed.effective_date) {
        const today = new Date();
        const effective = new Date(parsed.effective_date);
        if (today >= effective) {
          return parsed.next_prices;
        }
      }
      return parsed.prices || DEFAULT_TIER_PRICES;
    }
  } catch (err) {
    console.warn('[billing] Failed to fetch price from API, using default')
  }
  return DEFAULT_TIER_PRICES;
}

