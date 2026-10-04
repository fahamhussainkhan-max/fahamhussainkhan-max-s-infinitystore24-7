import { CampusZone } from '../types';

export const STANDARD_DELIVERY_FEE = 30;
export const PROMOTIONAL_DELIVERY_FEE = 15;
export const FREE_DELIVERY_THRESHOLD = 200;
export const PACKAGING_HANDLING_FEE = 9;

/**
 * Calculates delivery fee based on destination and subtotal:
 * - Free delivery for orders at or above Rs. 200
 * - Promotional rate: Rs. 15 (Special Launch Offer: Flat 50% OFF from standard Rs. 30)
 */
export function calculateDeliveryFee(
  zone: CampusZone | string | undefined | null,
  subtotal: number
): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0; // Free delivery above Rs. 200
  }
  return getBaseDeliveryFee(zone);
}

/**
 * Gets base delivery charge for a destination before free delivery discount.
 * Standard rate is ₹30, currently charged at promotional rate of ₹15 (50% OFF).
 */
export function getBaseDeliveryFee(zone?: CampusZone | string | undefined | null): number {
  return PROMOTIONAL_DELIVERY_FEE;
}
