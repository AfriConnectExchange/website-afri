
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<SupabaseUser>) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile as UserProfile | null);
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


  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    // Auth state change will handle setting user and profile
    router.push('/');
  }, [supabase, router]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    });
    if (error) {
      return { success: false, message: error.message };
    }
    // On success, Supabase will send a verification email.
    return { success: true, message: 'Verification email sent. Check your inbox.' };
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
    router.push('/');
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
    handleNeedsOtp,
    handleOtpSuccess
  }), [isLoading, user, profile, login, logout, updateUser, signUp]);

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
