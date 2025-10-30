
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
}

export function PersonalDetailsStep({ data, onDataChange, onNext }: PersonalDetailsStepProps) {
  const { user } = useAuth();
  
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
      isSeller: (data as any).isSeller || false,
    },
  });
  
  const onSubmit = (values: PersonalDetailsValues) => {
    onDataChange({ ...values, fullName: values.fullName });
    onNext();
  }

  const isSeller = form.watch('isSeller');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Let's get some basic information to set up your account.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isSeller"
              render={({ field }) => (
                <FormItem>
                  <Label>Account type</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => field.onChange(false)}
                      aria-pressed={!field.value}
                      className={`px-3 py-2 rounded-lg border ${!field.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-foreground'}`}>
                      Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(true)}
                      aria-pressed={!!field.value}
                      className={`px-3 py-2 rounded-lg border ${field.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-foreground'}`}>
                      Seller
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Choose whether you'll sell items on AfriConnect. Sellers will have access to shop management tools.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSeller && (
              <>
                <FormField
                  control={form.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Shop / Business Name</Label>
                      <FormControl>
                        <Input {...field} placeholder="e.g., AfriStore" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  We'll use your account name and phone as the shop owner contact. If you'd like a different owner contact, update it later in Shop Settings.
                </div>
              </>
            )}
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
            <Button type="submit" className="w-full">Next</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
