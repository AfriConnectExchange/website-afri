// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type MockUser = {
  id?: string;
  name?: string;
  email?: string;
  image?: string | null;
  roles?: string[];
  phone?: string | null;
  address?: string | null;
  emailVerified?: boolean;
  onboardingComplete?: boolean;
  fullName?: string;
  avatarUrl?: string;
  [key: string]: any;
};

type AuthContextValue = {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete?: boolean;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<MockUser>) => Promise<void>;
  sendPasswordResetEmail?: (email: string) => Promise<void>;
  resetPassword?: (password: string) => Promise<void>;
  handleNeedsOtp?: (phone: string, resendFn: () => Promise<void>) => void;
  handleOtpSuccess?: (user: any) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          if (mounted) setUser(data.user || null);
        }
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchMe();
    return () => { mounted = false; };
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setUser(null);
    // client-side redirect to signin page
    try { window.location.href = '/auth/signin'; } catch (e) { /* noop */ }
  };

  const updateUser = async (patch: Partial<MockUser>) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to send reset email');
    }
  };

  const resetPassword = async (password: string) => {
    // Implementation for password reset
    throw new Error('Not implemented');
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isOnboardingComplete: !!user?.onboardingComplete,
    logout,
    updateUser,
    sendPasswordResetEmail,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isOnboardingComplete: false,
      logout: async () => {},
      updateUser: async () => {},
    } as AuthContextValue;
  }
  return ctx;
}

export default AuthContext;