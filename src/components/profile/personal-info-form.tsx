
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Textarea } from '../ui/textarea';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { createSPAClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';

const formSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters.'),
  phone_number: z.string().min(10, 'Please enter a valid phone number.').optional().or(z.literal('')),
  location: z.string().optional(),
});

type PersonalInfoFormValues = z.infer<typeof formSchema>;

interface PersonalInfoFormProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export function PersonalInfoForm({ onFeedback }: PersonalInfoFormProps) {
  const supabase = createSPAClient();
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      location: '',
    },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
           form.reset({
              full_name: data.full_name || '',
              phone_number: data.phone_number || '',
              location: data.address_line1 || '',
            });
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [user, supabase, form]);

  const onSubmit = async (values: PersonalInfoFormValues) => {
    setIsSaving(true);
    if (!user) {
        onFeedback('error', 'You must be logged in to update your profile.');
        setIsSaving(false);
        return;
    }

    try {
        const { error } = await supabase.from('profiles').update({
            full_name: values.full_name,
            address_line1: values.location,
            phone_number: values.phone_number,
        }).eq('id', user.id);
        
        if (error) throw error;

        onFeedback('success', 'Profile updated successfully!');
        // Consider if a reload is necessary or if state can be managed locally
        // setTimeout(() => window.location.reload(), 1500);
    } catch(error: any) {
        onFeedback('error', error.message);
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
           <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="full_name"
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
                  name="phone_number"
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
             </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address / Location</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main St, London, UK"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
             <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Profile
              </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
