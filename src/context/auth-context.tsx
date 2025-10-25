"use client";

import React, { createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

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
  [key: string]: any;
};

type AuthContextValue = {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete?: boolean;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<MockUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const user = session?.user
    ? ({
  id: (session.user as any).id,
  name: session.user.name,
  fullName: session.user.name,
  email: session.user.email,
  image: session.user.image,
  avatarUrl: session.user.image,
  roles: (session.user as any).roles,
        phone: (session.user as any).phone ?? null,
        address: (session.user as any).address ?? null,
        emailVerified: !!(session.user as any).emailVerified,
        onboardingComplete: !!(session.user as any).onboardingComplete,
      } as MockUser)
    : null;

  const logout = async () => {
    await signOut({ redirect: false });
  };

  // When a user signs in, attempt to register this device silently so server
  // has device info and can create user_session rows. We persist a device id
  // in localStorage to identify this browser across visits.
  useEffect(() => {
    const registerDevice = async () => {
      try {
        if (!(session as any)?.user?.id) return;
        // get existing device id or generate one
        const storageKey = 'afri:device_id';
        let deviceId = localStorage.getItem(storageKey);
        if (!deviceId) {
          deviceId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);
          localStorage.setItem(storageKey, deviceId as string);
        }

        // Post to devices/register; server will parse UA and IP
        await fetch('/api/devices/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: deviceId }),
        });
      } catch (err) {
        // do not block the UI on device registration failures
        // console.debug('Device register failed', err);
      }
    };

    registerDevice();
  }, [(session as any)?.user?.id]);

  const updateUser = async (patch: Partial<MockUser>) => {
    // We keep a shallow client-side merge; persistence should be done via API.
    // NextAuth session updates require a sign-in or JWT/session update strategy.
    return Promise.resolve();
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isOnboardingComplete: !!user?.onboardingComplete,
    logout,
    updateUser,
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
