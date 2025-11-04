'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button3D } from '@/components/ui/button-3d';
import { Card3D } from '@/components/ui/card-3d';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
  fullName: z.string(),
  phone: z.string().min(10, 'Please enter a valid phone number.').optional().or(z.literal('')),
});

type PersonalInfoFormValues = z.infer<typeof formSchema>;

interface PersonalInfoFormProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export function PersonalInfoForm({ onFeedback }: PersonalInfoFormProps) {
  const { user, profile, updateUser, isLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile) {
        form.reset({
            fullName: profile.full_name || '',
            phone: profile.phone || '',
        });
    }
  }, [profile, form]);

  const onSubmit = async (values: PersonalInfoFormValues) => {
    setIsSaving(true);
    if (!user) {
        onFeedback('error', 'You must be logged in to update your profile.');
        setIsSaving(false);
        return;
    }

    // If phone changed and user currently doesn't have that phone (or it's different),
    // check server-side if the phone is already associated with another account.
    try {
      if (values.phone && values.phone !== (profile?.phone || '')) {
        setIsChecking(true);
        const resp = await fetchWithAuth('/api/profile/check-phone-exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: values.phone }),
        });
        const json = await resp.json();
        if (json?.exists) {
          form.setError('phone', { type: 'manual', message: 'This phone number is already in use. Please use a different number or sign in.' });
          onFeedback('error', 'The phone number you entered is already registered. Use another number or sign in.');
          setIsChecking(false);
          setIsSaving(false);
          return;
        }
        setIsChecking(false);
      }
    } catch (err: any) {
      console.error('Phone uniqueness check failed:', err);
      onFeedback('error', 'Could not verify the phone number. Please try again.');
      setIsChecking(false);
      setIsSaving(false);
      return;
    }

  try {
    await updateUser({
      phone: values.phone,
    });
    onFeedback('success', 'Contact info updated successfully!');
  } catch(error: any) {
    onFeedback('error', 'Failed to update profile: ' + error.message);
  }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <Card3D>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
          <p className="text-sm text-muted-foreground mb-6">Update your personal details and contact information.</p>
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
      </Card3D>
    );
  }

  return (
    <Card3D>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Update your personal details and contact information. Your name cannot be changed.
            </p>
            
            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          readOnly 
                          className="bg-muted/50 cursor-not-allowed"
                        />
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
            </div>

            <div className="flex justify-end">
              <Button3D 
                type="submit" 
                disabled={isSaving || !form.formState.isDirty || isChecking}
              >
                {(isSaving || isChecking) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button3D>
            </div>
          </div>
        </form>
      </Form>
    </Card3D>
  );
}
