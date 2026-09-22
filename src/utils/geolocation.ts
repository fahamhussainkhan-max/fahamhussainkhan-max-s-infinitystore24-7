import { CampusZone } from '../types';

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
}

/**
 * Attempts to detect closest campus zone using browser Geolocation API
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
          message: `Detected near ${closestZone.name} (${formattedDist})`,
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
