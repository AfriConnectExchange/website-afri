/**
 * Reverse Geocoding API - Convert coordinates to address
 * GET /api/geocode/reverse?lat={latitude}&lng={longitude}
 */

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Geocoding service not configured' },
        { status: 500 }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const addressComponents = result.address_components;

    // Extract location details
    let city: string | undefined;
    let region: string | undefined;
    let country: string | undefined;
    let postal_code: string | undefined;

    addressComponents.forEach((component: any) => {
      const types = component.types;
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        region = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      } else if (types.includes('postal_code')) {
        postal_code = component.long_name;
      }
    });

    return NextResponse.json(
      {
        coordinates: { lat: latitude, lng: longitude },
        city,
        region,
        country,
        postal_code,
        formatted_address: result.formatted_address,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Unable to reverse geocode coordinates' },
      { status: 500 }
    );
  }
}
