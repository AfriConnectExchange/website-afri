
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createSPAClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Define a more specific type for your mock user
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  avatar_url?: string;
}

interface AuthContextType {
  isLoading: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  // Some callers pass an object; allow flexible signature
  login: (emailOrOptions: string | { email: string; password?: string }, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<SupabaseUser>) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  handleNeedsOtp: (phone: string, resend: () => Promise<void>) => void;
  handleOtpSuccess: (user: SupabaseUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSPAClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile as UserProfile | null);
      }
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        // When the user signs in, ensure we fetch their profile and
        // check onboarding progress so we can redirect new users to
        // the onboarding flow.
        if (event === 'SIGNED_IN' && session?.user) {
          const uid = session.user.id;
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();
          setProfile(userProfile as UserProfile | null);

          // Register device/session with server API
          try {
            const fingerprint = typeof window !== 'undefined' ? (localStorage.getItem('device_fingerprint') || (() => { const v = crypto.getRandomValues(new Uint32Array(4)).join('-'); localStorage.setItem('device_fingerprint', v); return v; })()) : null;
            await fetch('/api/auth/register-device', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                device_id: fingerprint,
                device_type: navigator?.platform || 'web',
                device_name: navigator?.platform || 'web',
                browser: navigator?.userAgent || '',
                os: navigator?.platform || '',
                ip_address: null,
                user_agent: navigator?.userAgent || '',
                location_data: null,
                remember: false,
                session_token: session.access_token,
                refresh_token: session.refresh_token,
                fingerprint
              })
            });
          } catch (err) {
            console.error('Failed to register device', err);
          }

          try {
            // Supabase client generics in this project are complex; cast to any
            // for this small onboarding existence check to keep the code simple.
            const { data: onboardingProgress, error: onboardingError } = await (supabase as any)
              .from('user_onboarding_progress')
              .select('walkthrough_completed')
              .eq('user_id', uid)
              .single();

            if (onboardingError && onboardingError.code !== 'PGRST116') {
              console.error('Error fetching onboarding progress:', onboardingError);
            }

            if (!onboardingProgress || !onboardingProgress.walkthrough_completed) {
              router.push('/onboarding');
            } else {
              // Existing user with onboarding complete
              router.push('/');
            }
          } catch (err) {
            console.error('Onboarding redirect check failed', err);
            router.push('/');
          }

        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);


  const login = useCallback(async (emailOrOptions: string | { email: string; password?: string }, password?: string) => {
    let email: string;
    let pwd: string | undefined;
    if (typeof emailOrOptions === 'string') {
      email = emailOrOptions;
      pwd = password;
    } else {
      email = emailOrOptions.email;
      pwd = emailOrOptions.password;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd ?? '' });
    if (error) {
      throw new Error(error.message);
    }
    // Auth state change will handle setting user and profile
    router.push('/');
  }, [supabase, router]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    });
    if (error) {
      throw new Error(error.message);
    }
    // After sign up, Supabase sends a verification email.
    // Do NOT perform the redirect here; let the UI component display success feedback
    // and decide when/how to navigate. This keeps the context focused on auth only.

  }, [supabase, router]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      throw new Error(error.message);
    }
  }, [supabase]);

  const resetPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  }, [supabase, router]);

  const updateUser = useCallback(async (data: Partial<SupabaseUser>) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.auth.updateUser(data);
    if(error) throw new Error(error.message);
  }, [user, supabase]);

  const handleNeedsOtp = (phone: string, resend: () => Promise<void>) => {
    // Implement OTP logic if needed
    console.log("OTP needed for:", phone);
  };

  const handleOtpSuccess = (user: SupabaseUser) => {
    setUser(user);
    (async () => {
      try {
        const { data: onboardingProgress, error: onboardingError } = await (supabase as any)
          .from('user_onboarding_progress')
          .select('walkthrough_completed')
          .eq('user_id', user.id)
          .single();

        if (onboardingError && onboardingError.code !== 'PGRST116') {
          console.error('Error fetching onboarding progress:', onboardingError);
        }

        if (!onboardingProgress || !onboardingProgress.walkthrough_completed) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Onboarding redirect check failed', err);
        router.push('/');
      }
    })();
  };

  const value = useMemo(() => ({
    isLoading,
    user,
    profile,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    signUp,
    sendPasswordResetEmail,
    resetPassword,
    handleNeedsOtp,
    handleOtpSuccess
  }), [isLoading, user, profile, login, logout, updateUser, signUp, sendPasswordResetEmail, resetPassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
