'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AnimatedButton } from '../ui/animated-button';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useEffect, useState } from 'react';
import { createSPAClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number.').optional().or(z.literal('')),
  location: z.string().min(2, 'Please enter a valid location').optional().or(z.literal('')),
});

type PersonalDetailsFormValues = z.infer<typeof formSchema>;

interface PersonalDetailsStepProps {
  onNext: (data: { full_name: string; phone_number: string; location: string; }) => void;
  onBack: () => void;
  defaultValues: Partial<PersonalDetailsFormValues>;
}

export function PersonalDetailsStep({ onNext, onBack, defaultValues }: PersonalDetailsStepProps) {
  const supabase = createSPAClient();
  const [user, setUser] = useState<User | null>(null);

  const form = useForm<PersonalDetailsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);
  
  useEffect(() => {
    form.reset({
        fullName: user?.user_metadata.full_name || defaultValues.fullName || '',
        phoneNumber: user?.phone || defaultValues.phoneNumber || '',
        location: defaultValues.location || '',
      })
  }, [user, form, defaultValues])

  const onSubmit = (values: PersonalDetailsFormValues) => {
    onNext({
        full_name: values.fullName,
        phone_number: values.phoneNumber || '',
        location: values.location || '',
    });
  };

  return (
    <div>
        <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Complete Your Profile</h2>
            <p className="text-muted-foreground">Just a few more details to get you set up.</p>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
          
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                     <PhoneInput
                        id="phone"
                        placeholder="Enter phone number"
                        international
                        defaultCountry="GB"
                        {...field}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location / Address</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., London, UK" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="flex justify-between items-center pt-4">
                <AnimatedButton variant="outline" type="button" onClick={onBack}>Back</AnimatedButton>
                <AnimatedButton type="submit">Finish Setup</AnimatedButton>
            </div>
        </form>
        </Form>
    </div>
  );
}
