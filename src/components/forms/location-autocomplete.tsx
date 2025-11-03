'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadGoogleMaps, isGoogleMapsLoaded } from '@/lib/google-maps-loader';

// Google Places Autocomplete types
declare global {
  interface Window {
    google: any;
  }
}

interface LocationData {
  address: string;
  city: string;
  region?: string;
  country: string;
  postal_code: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  formatted_address: string;
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
}

export function LocationAutocomplete({
  onLocationSelect,
  defaultValue = '',
  placeholder = 'Start typing your address...',
  label = 'Product Location',
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const { toast } = useToast();

  // Load Google Maps script
  useEffect(() => {
    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      setIsScriptLoaded(true);
      return;
    }

    // Load script using centralized loader
    loadGoogleMaps({ libraries: ['places'], region: 'GB' })
      .then(() => {
        setIsScriptLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load Google Maps. Please refresh the page.',
        });
      });
  }, [toast]);

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || !window.google) return;

    try {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'], // Only show addresses (not businesses)
          componentRestrictions: { country: 'gb' }, // Restrict to UK for now
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        }
      );

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initialize address autocomplete.',
      });
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isScriptLoaded, toast]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    
    if (!place || !place.geometry) {
      toast({
        variant: 'destructive',
        title: 'Invalid Location',
        description: 'Please select a valid address from the suggestions.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Extract address components
      const components: Record<string, string> = {};
      place.address_components?.forEach((component: any) => {
        component.types.forEach((type: string) => {
          components[type] = component.long_name;
        });
      });

      // Build location data
      const locationData: LocationData = {
        address: [
          components.street_number,
          components.route,
        ].filter(Boolean).join(' ') || place.name || '',
        city: components.postal_town || components.locality || '',
        region: components.administrative_area_level_1 || components.administrative_area_level_2 || '',
        country: components.country || 'United Kingdom',
        postal_code: components.postal_code || '',
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
        formatted_address: place.formatted_address || '',
      };

      setInputValue(place.formatted_address);
      onLocationSelect(locationData);

      toast({
        title: '✓ Location Set',
        description: `${locationData.city}, ${locationData.postal_code}`,
      });
    } catch (error) {
      console.error('Error processing place:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process selected location.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode using Google Maps API
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              const place = results[0];
              
              // Extract address components
              const components: Record<string, string> = {};
              place.address_components?.forEach((component: any) => {
                component.types.forEach((type: string) => {
                  components[type] = component.long_name;
                });
              });

              const locationData: LocationData = {
                address: [
                  components.street_number,
                  components.route,
                ].filter(Boolean).join(' ') || '',
                city: components.postal_town || components.locality || '',
                region: components.administrative_area_level_1 || '',
                country: components.country || 'United Kingdom',
                postal_code: components.postal_code || '',
                coordinates: {
                  lat: latitude,
                  lng: longitude,
                },
                formatted_address: place.formatted_address || '',
              };

              setInputValue(place.formatted_address);
              onLocationSelect(locationData);

              toast({
                title: '✓ Location Detected',
                description: `${locationData.city}, ${locationData.postal_code}`,
              });
            } else {
              throw new Error('Geocoding failed');
            }
            setIsLoading(false);
          });
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to get your location.',
          });
          setIsLoading(false);
        }
      },
      (error) => {
        let message = 'Failed to get your location.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable location access.';
        }
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: message,
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="location-input">{label} *</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isLoading || !isScriptLoaded}
          className="text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <MapPin className="w-3 h-3 mr-1" />
          )}
          Use My Location
        </Button>
      </div>

      <Input
        ref={inputRef}
        id="location-input"
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={!isScriptLoaded || isLoading}
        className="w-full"
      />

      {!isScriptLoaded && (
        <p className="text-xs text-muted-foreground">
          Loading address autocomplete...
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Start typing your address and select from suggestions. This helps buyers find items near them.
      </p>
    </div>
  );
}
