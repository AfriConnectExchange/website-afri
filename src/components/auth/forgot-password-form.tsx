
'use client';
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedButton } from '../ui/animated-button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

type Props = {};

export default function ForgotPasswordForm({}: Props) {
  const { sendPasswordResetEmail } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const showAlert = (variant: 'default' | 'destructive', title: string, description: string) => {
    toast({ variant, title, description });
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
        await sendPasswordResetEmail(email);
        showAlert('default', 'Check your email', `A password reset link has been sent to ${email}.`);
        localStorage.setItem('afri:pending_verification_email', email);
        router.push('/auth/check-email');
    } catch (error: any) {
        showAlert('destructive', 'Error', error.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
      <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              />
              </div>
          </div>
        
        <AnimatedButton
          type="submit"
          size="lg"
          className="w-full mt-6"
          isLoading={isLoading}
          animationType="glow"
        >
          Send Reset Link
        </AnimatedButton>
      </form>
  );
}
