"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaysInMonth = getDaysInMonth;
exports.getDaysInMonthFromDate = getDaysInMonthFromDate;
exports.getFirstOfMonth = getFirstOfMonth;
exports.getRemainingDeliveryDays = getRemainingDeliveryDays;
exports.getAllDatesInMonth = getAllDatesInMonth;
exports.calculateMonthlyAmount = calculateMonthlyAmount;
exports.calculateMonthlyAmountWithExclusions = calculateMonthlyAmountWithExclusions;
exports.calculateProRataAmount = calculateProRataAmount;
exports.calculateSkipCredit = calculateSkipCredit;
exports.isCreditAdjustmentType = isCreditAdjustmentType;
exports.isChargeAdjustmentType = isChargeAdjustmentType;
exports.getNextMonthStart = getNextMonthStart;
exports.sumCreditAdjustments = sumCreditAdjustments;
exports.sumChargeAdjustments = sumChargeAdjustments;
exports.sumExtraMilkNetCharges = sumExtraMilkNetCharges;
exports.sumExtraMilkCreditUsage = sumExtraMilkCreditUsage;
exports.calculateCarryForwardCreditBalance = calculateCarryForwardCreditBalance;
exports.calculateNetDueFromCredits = calculateNetDueFromCredits;
exports.calculateDailyRate = calculateDailyRate;
exports.calculateExtraMilkCharge = calculateExtraMilkCharge;
exports.resolveTieredMilkPrices = resolveTieredMilkPrices;
exports.fetchMilkPrices = fetchMilkPrices;
exports.fetchRawMilkPricing = fetchRawMilkPricing;
exports.fetchMilkPricesClient = fetchMilkPricesClient;
exports.fetchTrialPricing = fetchTrialPricing;
exports.fetchTrialPricingClient = fetchTrialPricingClient;
exports.resolveSubscriptionState = resolveSubscriptionState;
exports.resolveSubscriptionStateForDate = resolveSubscriptionStateForDate;
// ─────────────────────────────────────────
// Calendar helpers
// ─────────────────────────────────────────
/**
 * Get actual number of days in a given month.
 * @param year - Full year (e.g. 2026)
 * @param month - 1-indexed month (1 = January, 12 = December)
 */
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}
/**
 * Get days in month from a Date object.
 */
function getDaysInMonthFromDate(date) {
    return getDaysInMonth(date.getFullYear(), date.getMonth() + 1);
}
/**
 * Get the first day of the month as YYYY-MM-DD string.
 */
function getFirstOfMonth(year, month) {
    return `${year}-${String(month).padStart(2, '0')}-01`;
}
/**
 * Get remaining delivery days from a start date to end of that month.
 * Excludes any dates in the excludedDates set.
 *
 * @param startDate - YYYY-MM-DD string
 * @param excludedDates - Set of YYYY-MM-DD strings to exclude
 * @returns Number of delivery days
 */
function getRemainingDeliveryDays(startDate, excludedDates = new Set()) {
    const start = new Date(startDate);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    const lastDay = getDaysInMonth(year, month);
    const startDay = start.getDate();
    let count = 0;
    for (let d = startDay; d <= lastDay; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!excludedDates.has(dateStr)) {
            count++;
        }
    }
    return count;
}
/**
 * Get all dates in a month as YYYY-MM-DD strings.
 */
function getAllDatesInMonth(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    const dates = [];
    for (let d = 1; d <= daysInMonth; d++) {
        dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return dates;
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
function calculateMonthlyAmount(dailyRate, year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    return Math.round(dailyRate * daysInMonth * 100) / 100;
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
function calculateMonthlyAmountWithExclusions(dailyRate, year, month, excludedDates = new Set()) {
    const daysInMonth = getDaysInMonth(year, month);
    let deliveryDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!excludedDates.has(dateStr)) {
            deliveryDays++;
        }
    }
    return Math.round(dailyRate * deliveryDays * 100) / 100;
}
/**
 * Calculate pro-rata amount for a partial month subscription.
 *
 * @param dailyRate - Daily rate in rupees
 * @param startDate - YYYY-MM-DD subscription start date
 * @param excludedDates - Set of YYYY-MM-DD strings to exclude
 * @returns Pro-rata amount in rupees (rounded to 2 decimals)
 */
function calculateProRataAmount(dailyRate, startDate, excludedDates = new Set()) {
    const deliveryDays = getRemainingDeliveryDays(startDate, excludedDates);
    return Math.round(dailyRate * deliveryDays * 100) / 100;
}
/**
 * Calculate skip credit amount.
 * @param dailyRate - The subscription's daily rate
 * @returns Credit amount in rupees
 */
function calculateSkipCredit(dailyRate) {
    return Math.round(dailyRate * 100) / 100;
}
function toMoneyValue(value) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function isCreditAdjustmentType(type) {
    return type === 'skip_credit'
        || type === 'vacation_credit'
        || type === 'carry_forward'
        || type === 'credit'
        || type === 'referral_credit';
}
function isChargeAdjustmentType(type) {
    return type === 'extra_charge'
        || type === 'charge';
}
function getNextMonthStart(monthStart) {
    const [yearStr, monthStr] = monthStart.slice(0, 10).split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return getFirstOfMonth(nextYear, nextMonth);
}
function sumCreditAdjustments(adjustments = [], targetMonth) {
    const total = adjustments.reduce((sum, adjustment) => {
        if (targetMonth && adjustment.target_month !== targetMonth) {
            return sum;
        }
        const amount = toMoneyValue(adjustment.amount);
        if (amount < 0 || isCreditAdjustmentType(adjustment.adjustment_type)) {
            return sum + Math.abs(amount);
        }
        return sum;
    }, 0);
    return roundMoney(total);
}
function sumChargeAdjustments(adjustments = [], targetMonth) {
    const total = adjustments.reduce((sum, adjustment) => {
        if (targetMonth && adjustment.target_month !== targetMonth) {
            return sum;
        }
        const amount = toMoneyValue(adjustment.amount);
        if (amount > 0 && isChargeAdjustmentType(adjustment.adjustment_type)) {
            return sum + amount;
        }
        return sum;
    }, 0);
    return roundMoney(total);
}
function sumExtraMilkNetCharges(orders = [], chargeMonth) {
    const total = orders.reduce((sum, order) => {
        if (chargeMonth && order.charge_month !== chargeMonth) {
            return sum;
        }
        if (order.status && order.status !== 'confirmed') {
            return sum;
        }
        if (order.payment_status === 'paid_instantly') {
            return sum;
        }
        const netCharge = order.net_charge_amount !== undefined && order.net_charge_amount !== null
            ? toMoneyValue(order.net_charge_amount)
            : 0;
        return sum + Math.max(0, netCharge);
    }, 0);
    return roundMoney(total);
}
function sumExtraMilkCreditUsage(orders = [], chargeMonth) {
    const total = orders.reduce((sum, order) => {
        if (chargeMonth && order.charge_month !== chargeMonth) {
            return sum;
        }
        if (order.status && order.status !== 'confirmed') {
            return sum;
        }
        return sum + Math.max(0, toMoneyValue(order.skip_credit_applied));
    }, 0);
    return roundMoney(total);
}
function calculateCarryForwardCreditBalance(adjustments = [], extraMilkOrders = [], targetMonth) {
    const creditTotal = sumCreditAdjustments(adjustments, targetMonth);
    const creditUsed = sumExtraMilkCreditUsage(extraMilkOrders, targetMonth);
    return roundMoney(Math.max(0, creditTotal - creditUsed));
}
function calculateNetDueFromCredits(monthlyAmount, creditBalance, extraMilkCharges, carryInBalance = 0, amountPaid = 0) {
    return roundMoney((monthlyAmount + extraMilkCharges) - creditBalance + carryInBalance - amountPaid);
}
const DEFAULT_TIER_PRICES = {
    "0.5": 40,
    "1": 80,
    "1.0": 80,
    "1.5": 120,
    "2": 160,
    "2.0": 160
};
function calculateDailyRate(quantity, prices) {
    const qtyStr1 = quantity.toString();
    const qtyStr2 = quantity.toFixed(1);
    if (prices[qtyStr1] !== undefined) {
        return prices[qtyStr1];
    }
    if (prices[qtyStr2] !== undefined) {
        return prices[qtyStr2];
    }
    // Fallback if quantity is non-standard
    const baseRate = prices["1.0"] || prices["1"] || 80;
    return Math.round(baseRate * quantity * 100) / 100;
}
function calculateExtraMilkCharge(extraLitres, prices) {
    const baseRate = prices["1.0"] || prices["1"] || 80;
    return Math.round(baseRate * extraLitres * 100) / 100;
}
// ─────────────────────────────────────────
// Server-side pricing fetch
// ─────────────────────────────────────────
function resolveTieredMilkPrices(pricing, _asOfDate) {
    void _asOfDate;
    if (pricing.next_prices) {
        return pricing.next_prices;
    }
    if (pricing.prices) {
        return pricing.prices;
    }
    return DEFAULT_TIER_PRICES;
}
async function fetchMilkPrices(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
adminClient, asOfDate) {
    const { data, error } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'milk_tier_prices')
        .single();
    if (error || !data) {
        console.error('[billing] fetchMilkPrices failed, using DEFAULT_TIER_PRICES:', error);
        return DEFAULT_TIER_PRICES;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = data.value;
    return resolveTieredMilkPrices(parsed, asOfDate);
}
async function fetchRawMilkPricing(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
adminClient) {
    const { data, error } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'milk_tier_prices')
        .single();
    if (error || !data) {
        return { prices: DEFAULT_TIER_PRICES };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.value;
}
// ─────────────────────────────────────────
// Client-side pricing fetch
// ─────────────────────────────────────────
async function fetchMilkPricesClient(asOfDate) {
    try {
        const res = await fetch('/api/admin/settings?key=milk_tier_prices');
        const data = await res.json();
        if (data.success && data.value) {
            const parsed = data.value;
            return resolveTieredMilkPrices(parsed, asOfDate);
        }
    }
    catch {
        console.warn('[billing] Failed to fetch price from API, using default');
    }
    return DEFAULT_TIER_PRICES;
}
async function fetchTrialPricing(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
adminClient) {
    const { data, error } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'trial_pricing')
        .single();
    if (error || !data || !data.value) {
        return { enabled: false, prices: DEFAULT_TIER_PRICES };
    }
    return data.value;
}
async function fetchTrialPricingClient() {
    try {
        const res = await fetch('/api/admin/settings?key=trial_pricing');
        const data = await res.json();
        if (data.success && data.value) {
            return data.value;
        }
    }
    catch {
        console.warn('[billing] Failed to fetch trial price from API, using default');
    }
    return { enabled: false, prices: DEFAULT_TIER_PRICES };
}
/**
 * Single Canonical Business Rule Resolver for Subscription State.
 */
function resolveSubscriptionState(input) {
    const { subscription, currentMonthBilling, latestPaidMonth, currentBillingMonthStr, currentDateStr } = input;
    if (!subscription) {
        return {
            state: 'NOT_SUBSCRIBED',
            canRenew: false,
            targetMonth: currentBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    const subStatus = (subscription.status || '').toLowerCase();
    if (subStatus === 'cancelled') {
        return {
            state: 'CANCELLED',
            canRenew: true,
            targetMonth: currentBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    if (subStatus === 'paused') {
        return {
            state: 'PAUSED',
            canRenew: false,
            targetMonth: currentBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    // Active Trial Check
    if (subscription.plan_type === 'trial' && subscription.end_date) {
        const today = currentDateStr || new Date().toISOString().split('T')[0];
        if (today <= subscription.end_date) {
            return {
                state: 'TRIAL_ACTIVE',
                canRenew: true,
                targetMonth: currentBillingMonthStr,
                currentMonthPaid: true,
                isCovered: true
            };
        }
    }
    // Check if current month is paid via currentMonthBilling
    const isCurrentBillingPaid = currentMonthBilling?.payment_status === 'paid';
    // Check if latestPaidMonth >= currentBillingMonthStr
    const isLatestPaidCurrentOrFuture = Boolean(latestPaidMonth && latestPaidMonth >= currentBillingMonthStr);
    const isCurrentPaid = isCurrentBillingPaid || isLatestPaidCurrentOrFuture;
    if (isCurrentPaid) {
        // Current month is paid! Compute next target month for renewal if customer wants to renew advance
        const parts = (latestPaidMonth || currentBillingMonthStr).split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const nextM = month === 12 ? 1 : month + 1;
        const nextY = month === 12 ? year + 1 : year;
        const targetMonth = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
        const dayOfMonth = currentDateStr ? parseInt(currentDateStr.split('-')[2], 10) : new Date().getDate();
        const canRenew = dayOfMonth >= 25;
        return {
            state: 'SUBSCRIBED_ACTIVE',
            canRenew,
            targetMonth,
            currentMonthPaid: true,
            isCovered: true
        };
    }
    // Pending payment state
    if (subStatus === 'pending_payment' ||
        currentMonthBilling?.payment_status === 'pending') {
        return {
            state: 'PAYMENT_PENDING',
            canRenew: true,
            targetMonth: currentBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    // Unrenewed / Eligible for renewal
    return {
        state: 'UNRENEWED_ELIGIBLE',
        canRenew: true,
        targetMonth: currentBillingMonthStr,
        currentMonthPaid: false,
        isCovered: false
    };
}
/**
 * Resolves subscription state and delivery coverage for a specific target date (e.g. skip date or extra milk date).
 */
function resolveSubscriptionStateForDate(input) {
    const { subscription, targetMonthBilling, targetBillingMonthStr, targetDateStr } = input;
    if (!subscription) {
        return {
            state: 'NOT_SUBSCRIBED',
            canRenew: false,
            targetMonth: targetBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    const subStatus = (subscription.status || '').toLowerCase();
    if (subStatus === 'cancelled') {
        return {
            state: 'CANCELLED',
            canRenew: true,
            targetMonth: targetBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    if (subStatus === 'paused') {
        return {
            state: 'PAUSED',
            canRenew: false,
            targetMonth: targetBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    // Active Trial Check for target date
    if (subscription.plan_type === 'trial' && subscription.end_date) {
        if (targetDateStr <= subscription.end_date) {
            return {
                state: 'TRIAL_ACTIVE',
                canRenew: true,
                targetMonth: targetBillingMonthStr,
                currentMonthPaid: true,
                isCovered: true
            };
        }
    }
    // Check if target month is specifically paid
    const isTargetPaid = targetMonthBilling?.payment_status === 'paid';
    if (isTargetPaid) {
        return {
            state: 'SUBSCRIBED_ACTIVE',
            canRenew: false,
            targetMonth: targetBillingMonthStr,
            currentMonthPaid: true,
            isCovered: true
        };
    }
    if (subStatus === 'pending_payment' || targetMonthBilling?.payment_status === 'pending') {
        return {
            state: 'PAYMENT_PENDING',
            canRenew: true,
            targetMonth: targetBillingMonthStr,
            currentMonthPaid: false,
            isCovered: false
        };
    }
    return {
        state: 'UNRENEWED_ELIGIBLE',
        canRenew: true,
        targetMonth: targetBillingMonthStr,
        currentMonthPaid: false,
        isCovered: false
    };
}
