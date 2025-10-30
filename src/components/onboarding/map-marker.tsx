"use client";
import React, { useEffect, useRef } from 'react';

declare global { interface Window { google: any; } }

interface MapMarkerProps {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number) => void;
  zoom?: number;
  height?: string;
}

function loadGoogleMaps(apiKey: string | undefined) {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.google && window.google.maps) return Promise.resolve();

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

export default function MapMarker({ lat, lng, onChange, zoom = 15, height = '200px' }: MapMarkerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let mounted = true;
    loadGoogleMaps(apiKey).then(() => {
      if (!mounted) return;
      if (!mapRef.current) return;
      try {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom,
        });
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance.current,
          draggable: true,
        });
        markerRef.current.addListener('dragend', (e: any) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          if (onChange) onChange(newLat, newLng);
        });
      } catch (e) {
        // ignore
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (markerRef.current) {
      const pos = { lat, lng };
      markerRef.current.setPosition(pos);
      if (mapInstance.current) mapInstance.current.panTo(pos);
    }
  }, [lat, lng]);

  return <div ref={mapRef} style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden' }} />;
}
