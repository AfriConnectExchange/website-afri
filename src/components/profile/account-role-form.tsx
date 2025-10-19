
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';

const formSchema = z.object({
  primary_role: z.string().min(1, 'Please select a role.'),
});

type RoleFormValues = z.infer<typeof formSchema>;

interface AccountRoleFormProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export function AccountRoleForm({ onFeedback }: AccountRoleFormProps) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primary_role: 'buyer',
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
      setIsLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('primary_role')
          .eq('id', user.id)
          .single();
        
        if (data) {
          form.reset({
            primary_role: data.primary_role || 'buyer',
          });
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [form, user, supabase]);

  const onSubmit = async (values: RoleFormValues) => {
    setIsSaving(true);
    if (!user) {
      onFeedback('error', 'User not found');
      setIsSaving(false);
      return;
    }
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ primary_role: values.primary_role })
            .eq('id', user.id);
        if (error) throw error;
        onFeedback('success', 'Role updated successfully! Refreshing to apply changes.');
        setTimeout(() => window.location.reload(), 1500);
    } catch(error: any) {
        onFeedback('error', error.message);
    }
    
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Role</CardTitle>
                <CardDescription>Change your account type to access different features.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin" />
            </CardContent>
        </Card>
    )
  }
  
  const selectedRole = form.watch('primary_role');
  const requiresKyc = ['seller', 'sme', 'trainer'].includes(selectedRole);

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Account Role</CardTitle>
            <CardDescription>Change your account type to access different features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="primary_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="sme">SME Business</SelectItem>
                      <SelectItem value="trainer">Trainer/Educator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {requiresKyc && (
                <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                    This role may require KYC verification. 
                    <Button 
                        variant="link" 
                        className="p-0 h-auto ml-1"
                        onClick={() => router.push('/kyc')}
                    >
                        Complete KYC verification now.
                    </Button>
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
