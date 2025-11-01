// Cookie consent management utilities

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'afri_cookie_consent';
const COOKIE_CONSENT_VERSION = '1.0';

export const defaultCookiePreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

// Get saved cookie preferences from localStorage
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Check version compatibility
    if (parsed.version !== COOKIE_CONSENT_VERSION) {
      return null;
    }
    
    return parsed.preferences;
  } catch (e) {
    console.error('Failed to read cookie preferences:', e);
    return null;
  }
}

// Save cookie preferences to localStorage
export function saveCookiePreferences(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = {
      version: COOKIE_CONSENT_VERSION,
      preferences,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    
    // Apply preferences (enable/disable tracking scripts)
    applyCookiePreferences(preferences);
  } catch (e) {
    console.error('Failed to save cookie preferences:', e);
  }
}

// Check if user has made a cookie consent choice
export function hasUserConsented(): boolean {
  return getCookiePreferences() !== null;
}

// Accept all cookies
export function acceptAllCookies(): void {
  saveCookiePreferences({
    essential: true,
    analytics: true,
    marketing: true,
    preferences: true,
  });
}

// Reject optional cookies (keep only essential)
export function rejectOptionalCookies(): void {
  saveCookiePreferences({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });
}

// Apply cookie preferences (enable/disable tracking)
function applyCookiePreferences(preferences: CookiePreferences): void {
  // Google Analytics
  if (typeof window !== 'undefined') {
    if (preferences.analytics) {
      // Enable Google Analytics if you have it
      (window as any)['ga-disable-GA_MEASUREMENT_ID'] = false;
    } else {
      // Disable Google Analytics
      (window as any)['ga-disable-GA_MEASUREMENT_ID'] = true;
    }
  }
  
  // You can add more tracking script controls here
  // For example: Facebook Pixel, Hotjar, etc.
}

// Clear all cookie consent data
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (e) {
    console.error('Failed to clear cookie consent:', e);
  }
}
