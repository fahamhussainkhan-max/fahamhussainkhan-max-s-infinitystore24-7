import { CampusZone } from '../types';

/**
 * Exact Polygon boundary coordinates extracted from campus Google Earth KML
 * [Longitude, Latitude] pairs
 */
export const CAMPUS_DELIVERY_POLYGON: [number, number][] = [
  [88.30139082307268, 27.15448347998158],
  [88.30088398801111, 27.15160277275089],
  [88.30036771340264, 27.15067770969212],
  [88.29906158425614, 27.14977226321426],
  [88.29849838429296, 27.14952816766552],
  [88.29838911399051, 27.14908799375189],
  [88.29783194513392, 27.14817147354733],
  [88.29873390934202, 27.14707881956648],
  [88.30046331550787, 27.14657673155575],
  [88.30197423887499, 27.14734585843643],
  [88.30295198336489, 27.1490485322909],
  [88.30258681937283, 27.15115717545615],
  [88.30259416511656, 27.15432527507126],
  [88.30330703339573, 27.15650182085883],
  [88.30288915414587, 27.15705254176024],
  [88.30139082307268, 27.15448347998158]
];

/**
 * Point-in-polygon ray-casting algorithm to verify if GPS coordinates fall inside campus delivery zone
 * @param lng Longitude (decimal degrees)
 * @param lat Latitude (decimal degrees)
 * @returns boolean true if inside the geofenced campus boundary
 */
export function isInsideDeliveryZone(lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = CAMPUS_DELIVERY_POLYGON.length - 1; i < CAMPUS_DELIVERY_POLYGON.length; j = i++) {
    const xi = CAMPUS_DELIVERY_POLYGON[i][0], yi = CAMPUS_DELIVERY_POLYGON[i][1];
    const xj = CAMPUS_DELIVERY_POLYGON[j][0], yj = CAMPUS_DELIVERY_POLYGON[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Runs KML delivery boundary polygon check (Point-in-Polygon ray casting)
 * against user's current GPS coordinates.
 */
export async function verifyGPSInsideBoundary(): Promise<{
  isInside: boolean;
  latitude: number;
  longitude: number;
  accuracy: number;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS / Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const isInside = isInsideDeliveryZone(longitude, latitude);

        resolve({
          isInside,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          message: isInside
            ? '✓ Verified: Within 10-15 Min Express Campus Delivery Zone'
            : '📍 Location Outside Delivery Area — We currently deliver only within campus and nearby affiliated PGs (10-15 min express). Coming Soon to your area!',
        });
      },
      (error) => {
        let msg = 'Could not access device location. Please enable GPS permissions.';
        if (error.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser to verify.';
        } else if (error.code === 2) {
          msg = 'GPS signal unavailable. Please ensure location is switched on.';
        } else if (error.code === 3) {
          msg = 'Location request timed out. Please retry.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeolocationDetectResult {
  zone: CampusZone;
  distanceKm: number;
  accuracyMeters: number;
  message: string;
  isInsideGeofence: boolean;
  userCoords?: { lat: number; lng: number };
}

/**
 * Attempts to detect closest campus zone using browser Geolocation API
 * and evaluates boundary inclusion
 */
export async function detectNearestCampusZone(
  zones: CampusZone[]
): Promise<GeolocationDetectResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const insideGeofence = isInsideDeliveryZone(longitude, latitude);

        let closestZone = zones[0];
        let minDistance = Infinity;

        zones.forEach((zone) => {
          if (zone.coordinates) {
            const dist = getDistanceFromLatLonInKm(
              latitude,
              longitude,
              zone.coordinates.lat,
              zone.coordinates.lng
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestZone = zone;
            }
          }
        });

        const formattedDist =
          minDistance < 1
            ? `${Math.round(minDistance * 1000)}m away`
            : `${minDistance.toFixed(1)} km away`;

        resolve({
          zone: closestZone,
          distanceKm: minDistance,
          accuracyMeters: Math.round(accuracy),
          message: insideGeofence
            ? `Verified Inside Campus: near ${closestZone.name} (${formattedDist})`
            : `Detected ${formattedDist} from campus boundary`,
          isInsideGeofence: insideGeofence,
          userCoords: { lat: latitude, lng: longitude },
        });
      },
      (error) => {
        // Common errors: PERMISSION_DENIED (1), POSITION_UNAVAILABLE (2), TIMEOUT (3)
        let msg = 'Could not access device location.';
        if (error.code === 1) {
          msg = 'Location permission was denied. Please pick your hostel manually.';
        } else if (error.code === 2) {
          msg = 'Location is currently unavailable.';
        } else if (error.code === 3) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

