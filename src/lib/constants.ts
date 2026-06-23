/**
 * ═══════════════════════════════════════════════════════════
 * AMRUTH DAIRY — Application Constants
 * Single source of truth for all shared constants.
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Delivery areas served by Amruth Dairy.
 * Used in onboarding, subscribe page, admin dashboard, and profile forms.
 */
export const DELIVERY_AREAS = [
  'Padil',
  'Kulshekar',
  'Kadri',
  'Alape',
  'Bajal',
  'Pumpwell',
  'State Bank',
  'Kankanady',
  'Urwa',
  'Kottara',
  'Lalbagh',
  'Bendoorwell',
  'Bejai',
] as const

export type DeliveryArea = (typeof DELIVERY_AREAS)[number]

/**
 * Allowed subscription quantity options (litres per day).
 */
export const QUANTITY_OPTIONS = [
  { litres: 0.5, label: '½ L' },
  { litres: 1.0, label: '1 L' },
  { litres: 1.5, label: '1.5 L' },
  { litres: 2.0, label: '2 L' },
] as const

/**
 * Extra milk quantity options (litres).
 */
export const EXTRA_MILK_OPTIONS = [0.5, 1.0, 1.5] as const

/**
 * Allowed subscription quantity values (for validation).
 */
export const ALLOWED_QUANTITIES = [0.5, 1.0, 1.5, 2.0] as const

/**
 * Skip / Extra milk ordering deadline in IST (24hr format).
 * After this hour, orders for the next day are not allowed.
 */
export const SKIP_DEADLINE_HOUR_IST = 21 // 9:00 PM IST

/**
 * Support phone number.
 */
export const SUPPORT_PHONE = '+91 98765 43210'
export const SUPPORT_PHONE_RAW = '+919876543210'

/**
 * Default app_settings key for price per litre.
 */
export const SETTINGS_KEY_PRICE_PER_LITRE = 'price_per_litre'

/**
 * Delivery time promise displayed to customers.
 */
export const DELIVERY_TIME_PROMISE = 'Before 7:00 AM'
