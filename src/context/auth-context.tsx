"use client";

import React, { createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";

export type MockUser = {
  id?: string;
  name?: string;
  email?: string;
  image?: string | null;
  roles?: string[];
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
    ? ({ id: (session.user as any).id, name: session.user.name, email: session.user.email, image: session.user.image, roles: (session.user as any).roles } as MockUser)
    : null;

  const logout = async () => {
    await signOut({ redirect: false });
  };

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
