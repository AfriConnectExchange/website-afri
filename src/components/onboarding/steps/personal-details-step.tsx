
'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
// @ts-ignore - import CSS for react-phone-number-input (no types)
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { OnboardingData } from '../onboarding-flow';
import AddressInput from '../address-input';
import { useAuth } from '@/context/auth-context';
import { fetchWithAuth } from '@/lib/api';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useState } from 'react';

const formSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  phone: z.string().min(10, 'Please enter a valid phone number.').optional().or(z.literal('')),
  address: z.string().min(5, 'Please enter a valid address.'),
  city: z.string().min(2, 'Please enter a city.'),
  postcode: z.string().min(4, 'Please enter a valid postcode.'),
  shopName: z.string().optional().or(z.literal('')),
  isSeller: z.boolean().optional(),
});

type PersonalDetailsValues = z.infer<typeof formSchema>;

interface PersonalDetailsStepProps {
  data: Partial<OnboardingData>;
  onDataChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export function PersonalDetailsStep({ data, onDataChange, onNext, onBack }: PersonalDetailsStepProps) {
  const { user } = useAuth();
  const { showSnackbar } = useGlobal();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const form = useForm<PersonalDetailsValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || data.phone || '',
      address: data.address || '',
      city: data.city || '',
      postcode: data.postcode || '',
      shopName: data.shopName || '',
    },
  });
  
  const onSubmit = async (values: PersonalDetailsValues) => {
    // If the user provided an email (and they don't already have one), validate
    // that the email isn't already used by another account before proceeding.
    if (values.email && !user?.email) {
      setIsCheckingEmail(true);
      try {
        const resp = await fetchWithAuth('/api/profile/check-email-exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email })
        });
        const json = await resp.json();
        if (json?.exists) {
          // Email belongs to another account — show form error and snackbar
          form.setError('email', { type: 'manual', message: 'This email is already in use. Please use a different email or sign in.' });
          showSnackbar({ title: 'Email already in use', description: 'The email you entered is already registered. Use another email or sign in.' }, 'error');
          setIsCheckingEmail(false);
          return;
        }
      } catch (err: any) {
        console.error('Email uniqueness check failed:', err);
        showSnackbar({ title: 'Email check failed', description: 'Could not verify the email. Please try again.' }, 'error');
        setIsCheckingEmail(false);
        return;
      } finally {
        setIsCheckingEmail(false);
      }
    }

    // If the user provided a phone (and they don't already have one), validate
    // that the phone isn't already used by another account before proceeding.
    if (values.phone && !user?.phone) {
      setIsCheckingEmail(true);
      try {
        const resp = await fetchWithAuth('/api/profile/check-phone-exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: values.phone })
        });
        const json = await resp.json();
        if (json?.exists) {
          // Phone belongs to another account — show form error and snackbar
          form.setError('phone', { type: 'manual', message: 'This phone number is already in use. Please use a different number or sign in.' });
          showSnackbar({ title: 'Phone already in use', description: 'The phone number you entered is already registered. Use another number or sign in.' }, 'error');
          setIsCheckingEmail(false);
          return;
        }
      } catch (err: any) {
        console.error('Phone uniqueness check failed:', err);
        showSnackbar({ title: 'Phone check failed', description: 'Could not verify the phone number. Please try again.' }, 'error');
        setIsCheckingEmail(false);
        return;
      } finally {
        setIsCheckingEmail(false);
      }
    }

    onDataChange({ ...values, fullName: values.fullName });
    onNext();
  }

  const isSeller = (data as any).isSeller || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Let's get some basic information to set up your account.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Account type selection moved to its own step (AccountTypeStep). */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <Label>Full Name</Label>
                  <FormControl>
                    <Input {...field} placeholder="e.g., " />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditionally render Email or Phone based on what's missing */}
            {!user?.email && (
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Email Address (for account recovery)</Label>
                      <FormControl>
                        <Input {...field} type="email" placeholder="you@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {!user?.phone && (
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Phone Number</Label>
                      <FormControl>
                        <PhoneInput international defaultCountry="GB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <Label>Address</Label>
                  <FormControl>
                    <AddressInput
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                      }}
                      onSelect={(place) => {
                        // Update form fields based on place selection
                        if (place.formatted_address) form.setValue('address', place.formatted_address);
                        if (place.city) form.setValue('city', place.city);
                        if (place.postcode) form.setValue('postcode', place.postcode);
                        // Inform parent onboarding flow about lat/lng
                        onDataChange({ address: place.formatted_address ?? '', city: place.city ?? '', postcode: place.postcode ?? '', latitude: place.latitude ?? undefined, longitude: place.longitude ?? undefined });
                      }}
                      country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Map removed: we keep address autocomplete which populates city/postcode and coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <Label>City</Label>
                    <FormControl>
                      <Input {...field} placeholder="e.g., London" />
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
                    <Label>Postcode</Label>
                    <FormControl>
                      <Input {...field} placeholder="e.g., SW1A 1AA" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex gap-3">
              {onBack && (
                <Button variant="outline" onClick={onBack}>Back</Button>
              )}
              <Button type="submit" className="ml-auto" disabled={isCheckingEmail}>
                {isCheckingEmail ? 'Checking…' : 'Next'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
