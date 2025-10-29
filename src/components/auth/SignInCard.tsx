
'use client';
import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/auth-context';

type Props = {};

export default function SignInCard({}: Props) {
    const { login, handleSocialLogin, signInWithPhone } = useAuth() as any; // Use `as any` to access new methods
    const { showSnackbar } = useGlobal();
    const [formData, setFormData] = useState({ email: 'test@example.com', password: 'password', phone: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

    // Add this to your component
    useEffect(() => {
        const el = document.getElementById('recaptcha-container');
        if (el) {
            // This is a placeholder for the invisible reCAPTCHA
            // Firebase will automatically use it
        }
    }, []);


    const handleEmailLogin = async () => {
        setIsLoading(true);
        try {
            await login(formData.email, formData.password);
            // AuthProvider handles navigation on success
        } catch (error: any) {
            showSnackbar({ code: error?.code, description: error?.message }, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = async () => {
        if (!formData.phone) {
            showSnackbar({ description: 'Phone number is required.'}, 'error');
            return;
        }
        setIsLoading(true);
        try {
            await signInWithPhone(formData.phone);
            // The auth context will now trigger the OTP flow
        } catch (error: any) {
            showSnackbar({ code: error?.code, description: error.message }, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const onSocialLogin = async (provider: 'google' | 'facebook') => {
        setSocialLoading(provider);
        try {
            await handleSocialLogin(provider);
        } catch (error) {
            // error is handled in context
        } finally {
            setSocialLoading(null);
        }
    };

    return (
        <>
            <div id="recaptcha-container" />
            <div className="flex flex-col sm:flex-row gap-2">
                <AnimatedButton
                    variant="outline"
                    className="w-full"
                    onClick={() => onSocialLogin('google')}
                    isLoading={socialLoading === 'google'}
                >
                    <FcGoogle className="mr-2" size={24} />
                    Google
                </AnimatedButton>
                <AnimatedButton
                    variant="outline"
                    className="w-full"
                    onClick={() => onSocialLogin('facebook')}
                    isLoading={socialLoading === 'facebook'}
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
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
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
