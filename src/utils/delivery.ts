import { CampusZone } from '../types';

export const DAY_DELIVERY_FEE = 15;
export const NIGHT_DELIVERY_FEE = 30;
export const BASE_HANDLING_FEE = 9;
export const PACKAGING_HANDLING_FEE = 9;

export const FREE_DELIVERY_THRESHOLD = 500;
export const FREE_HANDLING_THRESHOLD = 200;

/**
 * Checks if current time is within Night Hours (08:00 PM to 05:59 AM / 20:00 to 05:59).
 * Day Hours: 06:00 AM to 07:59 PM (06:00 to 19:59).
 */
export function isNightDeliveryTime(date: Date = new Date()): boolean {
  const currentHour = date.getHours();
  // Day: 6 AM <= currentHour < 8 PM (20)
  // Night: currentHour >= 20 || currentHour < 6
  return currentHour >= 20 || currentHour < 6;
}

/**
 * Gets base delivery charge:
 * - Day Hours (06:00 AM to 07:59 PM): ₹15
 * - Night Hours (08:00 PM to 05:59 AM): ₹30
 */
export function getBaseDeliveryFee(zone?: CampusZone | string | null, date: Date = new Date()): number {
  return isNightDeliveryTime(date) ? NIGHT_DELIVERY_FEE : DAY_DELIVERY_FEE;
}

/**
 * Calculates delivery fee based on Day/Night slot and subtotal:
 * - Subtotal >= ₹500: Delivery Fee = ₹0 (FREE)
 * - Subtotal < ₹500: ₹15 (Day) or ₹30 (Night)
 */
export function calculateDeliveryFee(
  zone: CampusZone | string | undefined | null,
  subtotal: number,
  date: Date = new Date()
): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0; // FREE above ₹500
  }
  return getBaseDeliveryFee(zone, date);
}

/**
 * Calculates handling fee based on subtotal and promo:
 * - Subtotal >= ₹200 or promo: Handling Fee = ₹0 (FREE)
 * - Subtotal < ₹200: ₹9
 */
export function calculateHandlingFee(subtotal: number, isSecretPromo: boolean = false): number {
  if (isSecretPromo || subtotal >= FREE_HANDLING_THRESHOLD) {
    return 0; // FREE above ₹200
  }
  return BASE_HANDLING_FEE;
}

/**
 * Comprehensive fee breakdown for checkout, cart, and orders
 */
export function getFeeBreakdown(subtotal: number, isSecretPromo: boolean = false, date: Date = new Date()) {
  const currentHour = date.getHours();
  const isNight = currentHour >= 20 || currentHour < 6;
  const baseDelivery = isNight ? NIGHT_DELIVERY_FEE : DAY_DELIVERY_FEE;
  const baseHandling = BASE_HANDLING_FEE;

  let deliveryFee = 0;
  let handlingFee = 0;

  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    deliveryFee = 0;
    handlingFee = 0;
  } else if (subtotal >= FREE_HANDLING_THRESHOLD) {
    handlingFee = 0;
    deliveryFee = baseDelivery;
  } else {
    deliveryFee = baseDelivery;
    handlingFee = isSecretPromo ? 0 : baseHandling;
  }

  const isFreeDeliveryQualified = deliveryFee === 0 && subtotal > 0;
  const isFreeHandlingQualified = handlingFee === 0 && subtotal > 0;
  const totalAmount = subtotal > 0 ? subtotal + deliveryFee + handlingFee : 0;

  return {
    isNight,
    baseDelivery,
    baseHandling,
    deliveryFee,
    handlingFee,
    totalAmount,
    isFreeDeliveryQualified,
    isFreeHandlingQualified,
    deliveryBadgeLabel: isNight ? '🌙 Night Delivery (₹30)' : '☀️ Day Delivery (₹15)',
  };
}

