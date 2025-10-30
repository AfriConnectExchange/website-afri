"use client";
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window { google: any; }
}

interface SelectedPlace {
  formatted_address: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface AddressInputProps {
  value?: string;
  onChange?: (val: string) => void;
  onSelect?: (place: SelectedPlace) => void;
  country?: string; // e.g., 'NG' to restrict suggestions
  placeholder?: string;
}

function loadGoogleMaps(apiKey: string | undefined) {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.google && window.google.maps && window.google.maps.places) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
    document.head.appendChild(script);
  });
}

export default function AddressInput({ value = '', onChange, onSelect, country, placeholder }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setLoading(true);
    loadGoogleMaps(apiKey).then(() => {
      if (!inputRef.current) return;
      try {
        const opts: any = { fields: ['formatted_address', 'address_components', 'geometry', 'place_id'] };
        if (country) opts.componentRestrictions = { country };
        // types: ['address'] gives address suggestions
        opts.types = ['address'];
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, opts);
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place) return;
          const formatted = place.formatted_address ?? null;
          const placeId = place.place_id ?? null;
          const geometry = place.geometry;
          const latitude = geometry?.location?.lat ? geometry.location.lat() : null;
          const longitude = geometry?.location?.lng ? geometry.location.lng() : null;

          const components: Record<string, string> = {};
          (place.address_components || []).forEach((c: any) => {
            (c.types || []).forEach((t: string) => {
              components[t] = c.long_name;
            });
          });

          const city = components.locality || components.postal_town || components.administrative_area_level_2 || null;
          const postcode = components.postal_code || null;
          const countryName = components.country || null;

          setLat(latitude);
          setLng(longitude);
          if (onChange) onChange(formatted ?? '');
          if (onSelect) onSelect({ formatted_address: formatted, place_id: placeId, latitude, longitude, city, postcode, country: countryName });
        });
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    // cleanup
    return () => {
      try {
        if (autocompleteRef.current && typeof autocompleteRef.current.unbindAll === 'function') {
          autocompleteRef.current.unbindAll();
        }
      } catch (e) {}
    };
  }, [country, onChange, onSelect]);

  return (
    <div>
      <input
        ref={inputRef}
        defaultValue={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder || 'Start typing address...'}
        className="w-full rounded-md border p-2"
      />
      <div className="mt-2 text-sm text-muted-foreground">
        {loading ? 'Loading address suggestions…' : (lat && lng ? `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` : 'Select an address from suggestions')}
      </div>
    </div>
  );
}
