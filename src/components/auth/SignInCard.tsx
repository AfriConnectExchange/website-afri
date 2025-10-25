// src/components/auth/SignInCard.tsx
'use client';
import React, { useState } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedButton } from '../ui/animated-button';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

// ✅ REMOVED: handleSessionLogging function (NextAuth handles this automatically)

function SignInCard() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<false | 'google' | 'facebook'>(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const showAlert = (variant: 'default' | 'destructive', title: string, description: string) => {
    if (variant === 'destructive') toast.error(title, { description });
    else toast.success(title, { description });
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    // Redirect to a provider-specific OAuth endpoint handled by your server
    // (implement /api/auth/oauth/[provider] to start the OAuth flow).
    setIsSocialLoading(provider);
    try {
      window.location.href = `/api/auth/oauth/${provider}`;
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        // Log failed sign-in attempt
        await fetch('/api/security/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'credentials-signin-failed',
            description: `Sign-in failed for email ${formData.email}: ${result.error}`,
            isSuspicious: true,
          }),
        }).catch(console.error);
        if (result.error === 'Please verify your email before signing in.') {
          localStorage.setItem('afri:pending_verification_email', formData.email);
          router.push('/auth/verify-email');
        } else {
          showAlert('destructive', 'Sign-in Failed', result.error || 'Sign-in failed');
        }
      } else {
  // Success path — force a full reload so the AuthProvider will fetch the new session
  showAlert('default', 'Sign-in Successful', 'Welcome back!');
  window.location.href = '/';
      }
    } catch (error: any) {
      showAlert('destructive', 'Sign-in Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <AnimatedButton
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin('google')}
          isLoading={isSocialLoading === 'google'}
        >
          <FcGoogle className="mr-2" size={24} />
          Google
        </AnimatedButton>
        <AnimatedButton
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin('facebook')}
          isLoading={isSocialLoading === 'facebook'}
        >
          <FaFacebook className="mr-2 text-[#1877F2]" size={24} />
          Facebook
        </AnimatedButton>
      </div>

      <div className="flex items-center my-6">
        <Separator className="flex-1" />
        <span className="mx-4 text-xs text-muted-foreground">OR SIGN IN WITH</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <AnimatedButton
          type="submit"
          size="lg"
          className="w-full mt-6"
          isLoading={isLoading}
          animationType="glow"
        >
          Sign In
        </AnimatedButton>
      </form>
      
      <div className="mt-6 text-center space-y-2">
        <div className="text-sm mt-4">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </div>
      </div>
    </>
  );
}

export default function SignInCardComponent() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <SignInCard />
      </CardContent>
    </Card>
  );
}