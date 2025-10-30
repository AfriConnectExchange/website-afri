import admin from './firebaseAdmin';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address?: string | null;
  place_id?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address) return null;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not set; skipping geocode');
    return null;
  }

  try {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn('Geocoding request failed', resp.status);
      return null;
    }
    const data = await resp.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) return null;

    const first = data.results[0];
    const loc = first.geometry?.location;
    if (!loc) return null;

    const components: Record<string, string> = {};
    (first.address_components || []).forEach((c: any) => {
      (c.types || []).forEach((t: string) => {
        components[t] = c.long_name;
      });
    });

    const city = components.locality || components.postal_town || components.administrative_area_level_2 || null;
    const postcode = components.postal_code || null;
    const country = components.country || null;

    return {
      latitude: Number(loc.lat),
      longitude: Number(loc.lng),
      formatted_address: first.formatted_address ?? null,
      place_id: first.place_id ?? null,
      city,
      postcode,
      country,
    };
  } catch (err) {
    console.error('geocodeAddress error', err);
    return null;
  }
}
