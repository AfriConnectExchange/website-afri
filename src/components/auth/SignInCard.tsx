
'use client';
import React, { useState } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedButton } from '../ui/animated-button';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebaseClient';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';

type Props = {};

export default function SignInCard({}: Props) {
    const { login } = useAuth();
    const { showSnackbar } = useGlobal();
    const [formData, setFormData] = useState({ email: '', password: '', phone: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const showAlert = (variant: 'default' | 'destructive', title: string, description: string) => {
        const severity = variant === 'destructive' ? 'error' : 'info';
        showSnackbar({ title, description }, severity);
    };

    const mapAuthError = (err: any) => {
        const code = err?.code || err?.error || null;
        const msg = err?.message ?? String(err ?? 'An error occurred');
        switch (code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return { title: 'Invalid credentials', description: 'Email or password is incorrect.' };
            case 'auth/invalid-email':
                return { title: 'Invalid email', description: 'Please enter a valid email address.' };
            case 'auth/network-request-failed':
                return { title: 'Network error', description: 'Please check your connection and try again.' };
            case 'auth/popup-closed-by-user':
                return { title: 'Sign-in Cancelled', description: 'You closed the sign-in popup before completing.' };
            default:
                return { title: 'Sign-in Failed', description: msg };
        }
    };

    const handleEmailLogin = async () => {
        setIsLoading(true);
        try {
            await login(formData.email, formData.password);
            // AuthProvider will handle verification checks and navigation
        } catch (error: any) {
            const friendly = mapAuthError(error);
            showAlert('destructive', friendly.title, friendly.description);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = async () => {
        if (!formData.phone) {
            showAlert('destructive', 'Error', 'Phone number is required.');
            return;
        }
        setIsLoading(true);
        // OTP not implemented yet
        setTimeout(() => {
            showAlert('destructive', 'Not Implemented', 'Phone login is not yet implemented.');
            setIsLoading(false);
        }, 1000);
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

            const fbUser = auth.currentUser;
            if (fbUser && !fbUser.emailVerified) {
                try {
                    await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/verify-email` });
                } catch (e) {
                    console.error('resend verification failed', e);
                }
                showAlert('destructive', 'Please verify your email', 'A verification link was sent to your email. Check your inbox.');
                await firebaseSignOut(auth);
                setIsLoading(false);
                return;
            }

            showSnackbar({ title: `Signed in with ${provider}`, description: '' }, 'success');
        } catch (err: any) {
            const friendly = mapAuthError(err);
            showAlert('destructive', friendly.title, friendly.description);
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
                <span className="mx-4 text-xs text-muted-foreground uppercase">Or sign in with</span>
                <Separator className="flex-1" />
            </div>

            <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="space-y-4 pt-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleEmailLogin();
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="test@example.com"
                                    className="pl-10"
                                    value={formData.email}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
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
                                    placeholder="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v: boolean) => !v)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <AnimatedButton type="submit" className="w-full" isLoading={isLoading}>
                            Sign In
                        </AnimatedButton>
                    </form>
                </TabsContent>
                <TabsContent value="phone" className="space-y-4 pt-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handlePhoneLogin();
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <PhoneInput
                                id="phone"
                                placeholder="Enter phone number for OTP"
                                international
                                defaultCountry="GB"
                                value={formData.phone}
                                onChange={(value) => setFormData((prev: any) => ({ ...prev, phone: value || '' }))}
                                required
                            />
                        </div>
                        <AnimatedButton type="submit" className="w-full" isLoading={isLoading}>
                            Send OTP
                        </AnimatedButton>
                    </form>
                </TabsContent>
            </Tabs>

            <div className="mt-6 text-center space-y-2">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot your password?
                </Link>
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
