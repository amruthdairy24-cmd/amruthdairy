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
  'Agnes',
  'Alape',
  'Alvares Road',
  'Anegundi',
  'Attavar',
  'Ballabag',
  'Balmatta Road',
  'Bavutagudde',
  'Bejai',
  'Bendoorwell',
  'Bikarnakatte',
  'Brigade Pinnacle',
  'Bunts Hostel',
  'Casagrande',
  'Charms Enclave',
  'Chilimbi',
  'Darbar Hills',
  'Deepa Plaza',
  'Esail Height',
  'Falneer',
  'Gandhinagara',
  'Gorigudde',
  'Gujjarakere',
  'Habitat One 54',
  'Jeppu Market',
  'Kadri Ground',
  'Kadrikambla',
  'Kapikad',
  'Karangalpady',
  'Karmar',
  'Kembar',
  'Kodakal',
  'Kodialguthu',
  'Kudroli',
  'Lohith Nagar',
  'Mallikatte',
  'Mangaladevi',
  'Mannagudda',
  'Marnamikatte',
  'Maroli',
  'Meghanagara',
  'Mulihithlu',
  'Naguri',
  'Nandigudde',
  'Nanthoor',
  'Northan Sky City',
  'Northern Sky Palm Streak',
  'Padil',
  'Padil Junction',
  'Pandeshwar',
  'Police Lane',
  'Prestage Valley Crest',
  'PVR',
  'Pumpwell',
  'Railway Junction',
  'Shivabag',
  'Ujjodi',
  'Valencia',
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
export const SUPPORT_PHONE = '+91 9880143808'
export const SUPPORT_PHONE_RAW = '+919880143808'

/**
 * Default app_settings key for price per litre.
 */
export const SETTINGS_KEY_PRICE_PER_LITRE = 'price_per_litre'

/**
 * Delivery time promise displayed to customers.
 */
export const DELIVERY_TIME_PROMISE = 'Before 7:00 AM'
