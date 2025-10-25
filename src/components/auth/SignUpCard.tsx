
'use client';
import React, { useState } from 'react';
import { Mail, Eye, EyeOff, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedButton } from '../ui/animated-button';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { PasswordStrength } from './PasswordStrength';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Props = {};

export default function SignUpCard({}: Props) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const showAlert = (variant: 'default' | 'destructive', title: string, description: string) => {
    if (variant === 'destructive') toast.error(title, { description });
    else toast.success(title, { description });
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      const result = await signIn(provider, { redirect: false, callbackUrl: '/' });
      if (result?.error) {
        showAlert('destructive', `Sign-up with ${provider} failed`, result.error);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      showAlert('destructive', `Sign-up with ${provider} failed`, err?.message ?? String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showAlert('destructive', 'Passwords do not match', 'Please re-enter your password.');
      return;
    }
    if (!formData.acceptTerms) {
      showAlert('destructive', 'Terms not accepted', 'You must agree to the Terms of Service.');
      return;
    }

    setIsLoading(true);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Something went wrong');
        }

        const result = await signIn('email', {
          redirect: false,
          email: formData.email,
        });

        if (result?.error) {
          showAlert('destructive', 'Sign-up Failed', result.error);
        } else {
          localStorage.setItem('afri:pending_verification_email', formData.email);
          router.push('/auth/verify-email');
        }

    } catch (error: any) {
        showAlert('destructive', 'Sign-up Failed', error.message);
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
            <span className="mx-4 text-xs text-muted-foreground">OR SIGN UP WITH EMAIL</span>
            <Separator className="flex-1" />
        </div>

          <form onSubmit={handleSignUp} className="space-y-4">
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
              <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
               <PasswordStrength password={formData.password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    acceptTerms: Boolean(checked),
                  }))
                }
              />
              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground"
              >
                I agree to the <Link href="/terms-of-service" className="underline text-primary">Terms of Service</Link> and <Link href="/privacy-policy" className="underline text-primary">Privacy Policy</Link>
              </Label>
            </div>
            <AnimatedButton
              type="submit"
              size="lg"
              className="w-full mt-6"
              isLoading={isLoading}
              animationType="glow"
            >
              Create Account
            </AnimatedButton>
          </form>
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm mt-4">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-primary hover:underline font-semibold"
              >
                Sign in
              </Link>
            </div>
          </div>
    </>
  );
}
