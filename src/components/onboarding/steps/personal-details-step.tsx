'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { OnboardingData } from '../onboarding-flow';
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  address: z.string().min(5, 'Please enter a valid address.'),
  city: z.string().min(2, 'Please enter a city.'),
  postcode: z.string().min(4, 'Please enter a valid postcode.'),
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
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      postcode: data.postcode || '',
    },
  });
  
  const onSubmit = (values: PersonalDetailsValues) => {
    onDataChange({ ...values, fullName: values.fullName });
    onNext();
  }

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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <Label>Full Name</Label>
                  <FormControl>
                    <Input {...field} placeholder="e.g., John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <Label>Address</Label>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 123 Main Street" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
