
'use client';
import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
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
import { Logo } from '../logo';

type Props = {};

// Helper function to call the security log API
const logSecurityEvent = async (eventType: string, description: string, isSuspicious: boolean = false) => {
  try {
    await fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, description, isSuspicious }),
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
};

function SignInCard({}: Props) {
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

  const handleSessionLogging = async () => {
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    try {
      // Ensure cookies are included so server can resolve the newly-created session
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const res = await fetch('/api/auth/log-session', { method: 'POST', credentials: 'include' });
        if (res.ok) return;
        // If unauthorized, the session cookie may not yet be available — retry briefly
        if (res.status === 401 && attempt < maxAttempts) {
          await sleep(250 * attempt);
          continue;
        }
        // other non-ok responses: log and stop
        console.error('Session logging failed with status:', res.status);
        return;
      }
    } catch (error) {
      console.error("Session logging failed:", error);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsSocialLoading(provider);
    try {
      const result = await signIn(provider, { redirect: false, callbackUrl: '/' });
      if (result?.error) {
        await logSecurityEvent('social-signin-failed', `Social sign-in failed with ${provider}: ${result.error}`, true);
        showAlert('destructive', `Sign-in with ${provider} failed`, result.error);
      } else if (result?.ok) {
        // Wait for NextAuth session to be available (avoid racing before cookie set)
        const maxWait = 3000; // ms
        const interval = 250;
        let waited = 0;
        while (waited < maxWait) {
            const sess = await getSession();
          if (sess && (sess as any).user?.id) break;
          await new Promise((r) => setTimeout(r, interval));
          waited += interval;
        }
        await handleSessionLogging();
        router.push('/');
      }
    } catch (err: any) {
      await logSecurityEvent('social-signin-exception', `Social sign-in exception with ${provider}: ${err?.message}`, true);
      showAlert('destructive', `Sign-in with ${provider} failed`, err?.message ?? String(err));
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        await logSecurityEvent('credentials-signin-failed', `Sign-in failed for email ${formData.email}: ${result.error}`, true);
        if (result.error === 'Please verify your email before signing in.') {
            localStorage.setItem('afri:pending_verification_email', formData.email);
            router.push('/auth/verify-email');
        } else {
            showAlert('destructive', 'Sign-in Failed', result.error);
        }
      } else if (result?.ok) {
        // Wait for the NextAuth session to be available before calling session-logging
        const maxWait = 3000; // ms
        const interval = 250;
        let waited = 0;
        while (waited < maxWait) {
    const sess = await getSession();
          if (sess && (sess as any).user?.id) break;
          await new Promise((r) => setTimeout(r, interval));
          waited += interval;
        }

  await handleSessionLogging();
        showAlert('default', 'Sign-in Successful', 'Welcome back!');
        router.push('/');
      }
    } catch (error: any) {
        await logSecurityEvent('credentials-signin-exception', `Sign-in exception for email ${formData.email}: ${error.message}`, true);
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
                    <Link href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline">
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
              <Link
                href="/auth/signup"
                className="text-primary hover:underline font-semibold"
              >
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
