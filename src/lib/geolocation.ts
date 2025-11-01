/**
 * Geolocation Services for AfriConnect Exchange
 * Handles user location detection, geocoding, and distance calculations
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coordinates: Coordinates;
  city?: string;
  region?: string;
  country?: string;
  postal_code?: string;
  accuracy?: number; // meters
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Get user's current location using browser Geolocation API
 * @param timeout Maximum time to wait for location (ms)
 * @returns Promise with coordinates or error
 */
export async function getCurrentPosition(
  timeout: number = 10000
): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      } as GeolocationError);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout,
      maximumAge: 300000, // Cache position for 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
          default:
            message = 'An unknown error occurred while getting your location.';
        }
        reject({ code: error.code, message } as GeolocationError);
      },
      options
    );
  });
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in kilometers (rounded to 1 decimal place)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "350m", "2.3 km", "24 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  } else {
    return `${Math.round(distanceKm)} km away`;
  }
}

/**
 * Geocode an address to coordinates using external API
 * Note: This requires server-side implementation with Google Maps or Mapbox API
 * @param address Full address string
 * @returns Promise with coordinates and location details
 */
export async function geocodeAddress(
  address: string
): Promise<LocationResult> {
  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      'Unable to geocode address. Please check the address and try again.'
    );
  }
}

/**
 * Reverse geocode coordinates to address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise with location details
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationResult> {
  try {
    const response = await fetch(
      `/api/geocode/reverse?lat=${lat}&lng=${lng}`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Unable to get location details from coordinates.');
  }
}

/**
 * Validate coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns True if valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculate bounding box for a given location and radius
 * Useful for initial filtering before calculating exact distances
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(lat)));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Check if coordinates are within a given radius
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param pointLat Point latitude
 * @param pointLng Point longitude
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
}

/**
 * Store user location in session storage (privacy-safe)
 * @param location Location result to cache
 */
export function cacheUserLocation(location: LocationResult): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('user_location', JSON.stringify(location));
    sessionStorage.setItem('user_location_timestamp', Date.now().toString());
  }
}

/**
 * Retrieve cached user location from session storage
 * @param maxAgeMs Maximum age of cached location (default: 30 minutes)
 * @returns Cached location or null if expired/missing
 */
export function getCachedUserLocation(
  maxAgeMs: number = 30 * 60 * 1000
): LocationResult | null {
  if (typeof window === 'undefined') return null;

  const cached = sessionStorage.getItem('user_location');
  const timestamp = sessionStorage.getItem('user_location_timestamp');

  if (!cached || !timestamp) return null;

  const age = Date.now() - parseInt(timestamp);
  if (age > maxAgeMs) {
    // Expired, clear cache
    sessionStorage.removeItem('user_location');
    sessionStorage.removeItem('user_location_timestamp');
    return null;
  }

  return JSON.parse(cached);
}

/**
 * Clear cached user location
 */
export function clearCachedUserLocation(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user_location');
    sessionStorage.removeItem('user_location_timestamp');
  }
}
