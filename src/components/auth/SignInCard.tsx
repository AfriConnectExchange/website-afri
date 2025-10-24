
'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedButton } from '../ui/animated-button';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type Props = {};

export default function SignInCard({}: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const showAlert = (variant: 'default' | 'destructive', title: string, description: string) => {
    toast({ variant, title, description });
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      const result = await signIn(provider, { redirect: false, callbackUrl: '/' });
      if (result?.error) {
        showAlert('destructive', `Sign-in with ${provider} failed`, result.error);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      showAlert('destructive', `Sign-in with ${provider} failed`, err?.message ?? String(err));
    } finally {
      setIsLoading(false);
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
        if (result.error === 'Please verify your email before signing in.') {
            localStorage.setItem('afri:pending_verification_email', formData.email);
            router.push('/auth/verify-email');
        } else {
            showAlert('destructive', 'Sign-in Failed', result.error);
        }
      } else {
        showAlert('default', 'Sign-in Successful', 'Welcome back!');
        router.push('/');
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
                isLoading={isLoading}
            >
                <FcGoogle className="mr-2" size={24} />
                Google
            </AnimatedButton>
            <AnimatedButton
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('facebook')}
                isLoading={isLoading}
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
