
'use client';
import React, { useState } from 'react';
import { Mail, Eye, EyeOff, User, Phone } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedButton } from '../ui/animated-button';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// @ts-ignore - importing css side-effect for phone input styles
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { Checkbox } from '../ui/checkbox';
import { PasswordStrength } from './PasswordStrength';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/lib/context/GlobalContext';
import { auth } from '@/lib/firebaseClient';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

type Props = {};

export default function SignUpCard({}: Props) {
  const { signUp } = useAuth();
  const { showSnackbar } = useGlobal();

  const [signupMethod, setSignupMethod] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const showAlert = (severity: 'success' | 'error' | 'info' | 'warning', message: string) => {
    showSnackbar(message, severity);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        const p = new GoogleAuthProvider();
        await signInWithPopup(auth, p);
      } else {
        const p = new FacebookAuthProvider();
        await signInWithPopup(auth, p);
      }
      // After social sign-in, onAuthStateChanged will create/merge profile via server
      showAlert('success', `Signed up with ${provider}.`);
    } catch (err: any) {
      showAlert('error', `Sign-up with ${provider} failed: ${err?.message ?? String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isRedirecting) return;
    if (formData.password !== formData.confirmPassword) {
      showAlert('error', 'Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!formData.acceptTerms) {
      showAlert('error', 'Terms not accepted. You must agree to the Terms of Service.');
      return;
    }

  setIsLoading(true);
  try {
        if (signupMethod === 'email') {
      const result = await signUp(formData.email, formData.password);
      if (result?.success) {
        showAlert('success', result.message || 'Account created — check your email for a verification link.');
        // keep form disabled while we wait to redirect
        setIsRedirecting(true);
            // persist email so verify page can show it
            try { localStorage.setItem('signup_email', formData.email); } catch {};
        setTimeout(() => router.push('/auth/verify-email'), 1200);
      } else {
        showAlert('error', result?.message || 'Unable to create account.');
      }
    } else {
      // Real Supabase phone signup logic would go here
  showAlert('error', 'Not Implemented: Phone sign-up is not yet implemented.');
    }
  } catch (error: any) {
    showAlert('error', `Sign-up Failed: ${error.message}`);
  } finally {
    // If we are redirecting keep button disabled; otherwise re-enable
    if (!isRedirecting) setIsLoading(false);
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
            <span className="mx-4 text-xs text-muted-foreground">OR SIGN UP WITH</span>
            <Separator className="flex-1" />
        </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <Tabs defaultValue="email" onValueChange={setSignupMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="space-y-4 pt-4">
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
                          required={signupMethod === 'email'}
                      />
                      </div>
                  </div>
              </TabsContent>
              <TabsContent value="phone" className="space-y-4 pt-4">
                  <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <PhoneInput
                          id="phone"
                          placeholder="Enter your phone number"
                          international
                          defaultCountry="GB"
                          value={formData.phone}
                          onChange={(value) => setFormData((prev) => ({ ...prev, phone: value || ''}))}
                          required={signupMethod === 'phone'}
                      />
                  </div>
              </TabsContent>
           </Tabs>

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
              isLoading={isLoading || isRedirecting}
              animationType="glow"
            >
              {signupMethod === 'phone' ? 'Send OTP' : 'Create Account'}
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

  // place snackbar at the root of the component render
  
