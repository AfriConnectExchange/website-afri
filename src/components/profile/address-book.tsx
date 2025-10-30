"use client";
import { useState, useRef } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import AddressInput from '@/components/onboarding/address-input';
import MapMarker from '@/components/onboarding/map-marker';
import { PlusCircle, MapPin, Loader2, Home } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

// Mock address type for now
interface Address {
  id: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  isDefault?: boolean;
}

const addressSchema = z.object({
  street: z.string().min(5, 'Please enter a valid street address.'),
  city: z.string().min(2, 'Please enter a city.'),
  postcode: z.string().min(4, 'Please enter a valid postcode.'),
  country: z.string().min(2, 'Please enter a country.'),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressBookProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export function AddressBook({ onFeedback }: AddressBookProps) {
  const { user, profile, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // In a real app, `addresses` would be an array. For now, we use the single address from the profile.
  const addresses: Address[] = (profile?.address && profile.city) ? [{
    id: 'primary',
    street: profile.address,
    city: profile.city,
    postcode: profile.postcode || '',
    country: profile.country || '',
    isDefault: true,
  }] : [];

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
    },
  });

  const selectedCoordsRef = useRef<{ lat?: number | null; lng?: number | null }>({});

  const onSubmit = async (values: AddressFormValues) => {
    setIsSaving(true);
    try {
        // In a real app, this would add to a subcollection of addresses.
        // For now, we'll just update the main address on the user profile.
    const payload: any = {
      address: values.street,
      city: values.city,
      postcode: values.postcode,
      country: values.country,
    };
    // include lat/lng if available from autocomplete
    if ((selectedCoordsRef.current?.lat ?? null) !== null) payload.latitude = selectedCoordsRef.current.lat;
    if ((selectedCoordsRef.current?.lng ?? null) !== null) payload.longitude = selectedCoordsRef.current.lng;

    await updateUser(payload);
        onFeedback('success', 'Address saved successfully!');
        form.reset();
        setIsDialogOpen(false);
    } catch (error: any) {
        onFeedback('error', 'Failed to save address: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Address Book</CardTitle>
          <CardDescription>Manage your shipping and billing addresses.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Address</DialogTitle>
              <DialogDescription>
                This address will be saved to your profile for faster checkout.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <>
                        <FormControl>
                          <AddressInput
                            value={field.value}
                            onChange={(v) => field.onChange(v)}
                            onSelect={(place) => {
                              // fill form fields from place components
                              if (place.formatted_address) form.setValue('street', place.formatted_address);
                              if (place.city) form.setValue('city', place.city);
                              if (place.postcode) form.setValue('postcode', place.postcode);
                              if (place.country) form.setValue('country', place.country);
                              // store coords for saving
                              selectedCoordsRef.current = { lat: place.latitude ?? null, lng: place.longitude ?? null };
                            }}
                            country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || undefined}
                          />
                        </FormControl>
                        <FormMessage />
                        {selectedCoordsRef.current?.lat && selectedCoordsRef.current?.lng && (
                          <div>
                            <FormLabel>Adjust location on map</FormLabel>
                            <MapMarker lat={selectedCoordsRef.current.lat ?? 0} lng={selectedCoordsRef.current.lng ?? 0} onChange={(lat, lng) => { selectedCoordsRef.current = { lat, lng }; }} />
                          </div>
                        )}
                      </>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSaving || !form.formState.isDirty}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Address
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-semibold">No addresses saved</h3>
            <p className="text-sm text-muted-foreground">Add an address to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="border p-4 rounded-lg flex justify-between items-start">
                <div className="space-y-1">
                  {address.isDefault && (
                    <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                      <Home className="w-4 h-4"/>
                      <span>Default Address</span>
                    </div>
                  )}
                  <p className="text-sm font-medium">{address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.postcode}
                  </p>
                  <p className="text-sm text-muted-foreground">{address.country}</p>
                </div>
                <div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
