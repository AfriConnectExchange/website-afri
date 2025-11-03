/**
 * Centralized Google Maps Script Loader
 * Ensures Google Maps is only loaded once across the entire application
 */

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export interface GoogleMapsLoaderOptions {
  libraries?: string[];
  region?: string;
}

/**
 * Load Google Maps JavaScript API
 * Returns a promise that resolves when the script is loaded
 * Prevents duplicate script loading by returning the same promise
 */
export function loadGoogleMaps(
  options: GoogleMapsLoaderOptions = {}
): Promise<void> {
  // If already loaded, resolve immediately
  if (isLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      // Script exists, wait for it to load
      if (window.google && window.google.maps) {
        isLoaded = true;
        isLoading = false;
        resolve();
        return;
      }

      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        isLoaded = true;
        isLoading = false;
        resolve();
      });

      existingScript.addEventListener('error', () => {
        isLoading = false;
        reject(new Error('Failed to load existing Google Maps script'));
      });

      return;
    }

    // Create and load new script
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      isLoading = false;
      reject(new Error('Google Maps API key not found'));
      return;
    }

    const script = document.createElement('script');
    const libraries = options.libraries || ['places'];
    const region = options.region || 'GB';

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&region=${region}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      loadPromise = null; // Reset promise so it can be retried
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Check if Google Maps is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded && typeof window !== 'undefined' && !!window.google?.maps;
}

/**
 * Wait for Google Maps to be loaded
 * Useful when you're not sure if it's already loading
 */
export async function waitForGoogleMaps(
  timeout: number = 10000
): Promise<void> {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }

  return Promise.race([
    loadGoogleMaps(),
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Google Maps load timeout')), timeout)
    ),
  ]);
}

/**
 * Reset loader state (useful for testing)
 */
export function resetGoogleMapsLoader(): void {
  isLoading = false;
  isLoaded = false;
  loadPromise = null;
}
