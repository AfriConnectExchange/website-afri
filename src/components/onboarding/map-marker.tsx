"use client";
import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps, isGoogleMapsLoaded } from '@/lib/google-maps-loader';

declare global { interface Window { google: any; } }

interface MapMarkerProps {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number) => void;
  zoom?: number;
  height?: string;
}

export default function MapMarker({ lat, lng, onChange, zoom = 15, height = '200px' }: MapMarkerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    
    // Use centralized loader
    loadGoogleMaps({ libraries: ['places'], region: 'GB' })
      .then(() => {
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
