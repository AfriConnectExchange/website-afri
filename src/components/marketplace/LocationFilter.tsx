'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  getCurrentPosition,
  reverseGeocode,
  cacheUserLocation,
  getCachedUserLocation,
  type LocationResult,
  type GeolocationError,
} from '@/lib/geolocation';

interface LocationFilterProps {
  onLocationChange: (location: LocationResult | null) => void;
  onRadiusChange: (radius: number) => void;
  onDeliveryOptionsChange: (options: DeliveryOptions) => void;
  defaultRadius?: number;
}

interface DeliveryOptions {
  pickupOnly: boolean;
  deliveryOnly: boolean;
}

export default function LocationFilter({
  onLocationChange,
  onRadiusChange,
  onDeliveryOptionsChange,
  defaultRadius = 25,
}: LocationFilterProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(defaultRadius);
  const [manualCity, setManualCity] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    pickupOnly: false,
    deliveryOnly: false,
  });

  // Load cached location on mount
  useEffect(() => {
    const cached = getCachedUserLocation();
    if (cached) {
      setLocation(cached);
      onLocationChange(cached);
    }
  }, []);

  const handleUseMyLocation = async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const result = await getCurrentPosition();
      
      // Get city/region from coordinates
      try {
        const details = await reverseGeocode(
          result.coordinates.lat,
          result.coordinates.lng
        );
        result.city = details.city;
        result.region = details.region;
        result.country = details.country;
      } catch (e) {
        // Continue without city details
      }

      setLocation(result);
      cacheUserLocation(result);
      onLocationChange(result);
    } catch (err) {
      const geoError = err as GeolocationError;
      setError(geoError.message);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setRadius(newRadius);
    onRadiusChange(newRadius);
  };

  const handleDeliveryOptionChange = (
    option: keyof DeliveryOptions,
    checked: boolean
  ) => {
    const newOptions = { ...deliveryOptions, [option]: checked };
    setDeliveryOptions(newOptions);
    onDeliveryOptionsChange(newOptions);
  };

  const handleClearLocation = () => {
    setLocation(null);
    setError(null);
    setManualCity('');
    onLocationChange(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-diaspora-orange" />
          Location
        </h3>
        {location && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearLocation}
            className="text-sm text-gray-600"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Current Location Button */}
      <div className="space-y-2">
        <Button
          onClick={handleUseMyLocation}
          disabled={isDetecting}
          className="w-full bg-brand-progress-blue hover:bg-blue-700 text-white"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Detecting Location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use My Location
            </>
          )}
        </Button>

        {location && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900">
                Location detected
              </p>
              <p className="text-xs text-green-700 truncate">
                {location.city && location.country
                  ? `${location.city}, ${location.country}`
                  : location.city || location.country || 'Location set'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Enter your city manually below.
            </p>
          </div>
        )}
      </div>

      {/* Manual City Entry */}
      <div className="space-y-2">
        <Label htmlFor="manual-city" className="text-sm font-medium">
          Or Enter City Manually
        </Label>
        <Input
          id="manual-city"
          type="text"
          placeholder="e.g., London, Manchester"
          value={manualCity}
          onChange={(e) => setManualCity(e.target.value)}
          className="w-full"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!manualCity.trim()}
        >
          Search by City
        </Button>
      </div>

      {/* Distance Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Distance Radius</Label>
          <span className="text-sm font-semibold text-brand-diaspora-orange">
            {radius} km
          </span>
        </div>
        <Slider
          value={[radius]}
          onValueChange={handleRadiusChange}
          min={0}
          max={50}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 km</span>
          <span>5 km</span>
          <span>10 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
        <p className="text-xs text-gray-600">
          Show products within {radius} km of your location
        </p>
      </div>

      {/* Delivery Options */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <Label className="text-sm font-medium">Delivery Options</Label>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pickup-only"
            checked={deliveryOptions.pickupOnly}
            onCheckedChange={(checked) =>
              handleDeliveryOptionChange('pickupOnly', checked as boolean)
            }
          />
          <label
            htmlFor="pickup-only"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Local pickup available
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="delivery-only"
            checked={deliveryOptions.deliveryOnly}
            onCheckedChange={(checked) =>
              handleDeliveryOptionChange('deliveryOnly', checked as boolean)
            }
          />
          <label
            htmlFor="delivery-only"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Delivery available
          </label>
        </div>

        {(deliveryOptions.pickupOnly || deliveryOptions.deliveryOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDeliveryOptions({ pickupOnly: false, deliveryOnly: false })
            }
            className="text-xs text-gray-600"
          >
            Clear delivery filters
          </Button>
        )}
      </div>

      {/* Mobile: Show summary at bottom */}
      <div className="sm:hidden pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          {location && (
            <p>
              📍 Searching near{' '}
              {location.city || location.country || 'your location'}
            </p>
          )}
          <p>📏 Within {radius} km radius</p>
          {deliveryOptions.pickupOnly && <p>📦 Pickup only</p>}
          {deliveryOptions.deliveryOnly && <p>🚚 Delivery available</p>}
        </div>
      </div>
    </div>
  );
}
