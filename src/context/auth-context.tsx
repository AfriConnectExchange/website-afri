// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

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
  const { data: session, status, update } = useSession();

  const isLoading = status === "loading";

  // Development-only debugging: log session/status to help diagnose client hydration
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[AuthProvider] next-auth status:', status, 'session:', session);
    }
  }, [status, session]);
  
  // ✅ Map NextAuth session to your user object
  const user = session?.user
    ? ({
        id: (session.user as any).id,
        name: session.user.name,
        fullName: session.user.name,
        email: session.user.email,
        image: session.user.image,
        avatarUrl: session.user.image,
        roles: (session.user as any).roles || [],
        phone: (session.user as any).phone ?? null,
        address: (session.user as any).address ?? null,
        emailVerified: !!(session.user as any).emailVerified,
        onboardingComplete: !!(session.user as any).onboardingComplete,
      } as MockUser)
    : null;

  const logout = async () => {
    await signOut({ redirect: false, callbackUrl: '/auth/signin' });
  };

  // ✅ Update user via API, then refresh session
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

      // ✅ Trigger NextAuth session update
      await update();
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