import { CampusZone } from '../types';

/**
 * Calculates delivery fee based on destination and subtotal:
 * - Free delivery for orders above Rs. 200
 * - Rs. 15 for CCCT / CCST campus and internal hostels
 * - Rs. 20 for outer / further PDS spots
 */
export function calculateDeliveryFee(
  zone: CampusZone | string | undefined | null,
  subtotal: number
): number {
  if (subtotal >= 200) {
    return 0; // Free delivery above Rs. 200
  }
  return getBaseDeliveryFee(zone);
}

/**
 * Gets base delivery charge for a destination before free delivery discount
 */
export function getBaseDeliveryFee(zone: CampusZone | string | undefined | null): number {
  if (!zone) return 15;

  const zoneName = typeof zone === 'string' ? zone : zone.name || zone.id || '';
  const zoneId = typeof zone === 'object' && zone ? zone.id || '' : '';
  const isExplicitOuter = typeof zone === 'object' && zone ? Boolean(zone.isOuterSpot) : false;

  if (
    isExplicitOuter ||
    /outer|far|makaju|happy|chisopani|custom/i.test(zoneName) ||
    /outer|far|makaju|happy|chisopani|custom/i.test(zoneId)
  ) {
    return 20;
  }

  return 15;
}

export const PACKAGING_HANDLING_FEE = 9;
