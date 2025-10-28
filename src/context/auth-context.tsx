
 'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseClient';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AppUser, UserProfile as DbUserProfile } from '@/lib/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { useGlobal } from '@/lib/context/GlobalContext';
export { MockUser } from '@/lib/types';

// Define a more specific type for your mock user
export type UserProfile = DbUserProfile;

interface AuthContextType {
  isLoading: boolean;
  user: AppUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<{ displayName?: string; photoURL?: string }>) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; message?: string }>;
  handleNeedsOtp: (phone: string, resend: () => Promise<void>) => void;
  handleOtpSuccess: (user: FirebaseUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showSnackbar } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Build app-level user and ensure server-side profile exists
        const baseUser: AppUser = {
          id: fbUser.uid,
          email: fbUser.email ?? null,
          fullName: fbUser.displayName ?? null,
          avatarUrl: fbUser.photoURL ?? null,
          roles: []
        };
        setUser(baseUser);
        try {
          const idToken = await fbUser.getIdToken();
          const res = await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: fbUser.displayName ?? null }) });
          if (res.ok) {
            // optionally read back the profile from Firestore via client
            // but server creates/merges it so we can rely on that for now
            setProfile({ id: fbUser.uid, email: fbUser.email ?? null, full_name: fbUser.displayName ?? null, roles: [] });
            setUser((prev) => ({ ...prev, email: fbUser.email ?? null, fullName: fbUser.displayName ?? null } as AppUser));
          }
        } catch (err) {
          console.error('error creating profile', err);
        }
      } else {
        setProfile(null);
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);


  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    }
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (displayName) {
        await firebaseUpdateProfile(user, { displayName });
      }
  // Send verification email
  await sendEmailVerification(user, { url: `${window.location.origin}/auth/callback` });
      // Create or merge profile on server
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: displayName ?? null }) });
      } catch (e) {
        console.error('profile creation failed', e);
      }
      return { success: true, message: 'Verification email sent. Check your inbox.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    router.push('/auth/signin');
  }, [router]);

  const updateUser = useCallback(async (data: Partial<{ displayName?: string; photoURL?: string }>) => {
    // Use the real Firebase user from auth to update profile
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not authenticated');
    try {
      await firebaseUpdateProfile(fbUser, data as any);
      // Optionally update Firestore profile via API using the ID token
      const idToken = await fbUser.getIdToken();
      await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: data.displayName ?? null }) });
    } catch (err: any) {
      throw new Error(err.message || 'Update failed');
    }
  }, [user]);

  const handleNeedsOtp = (phone: string, resend: () => Promise<void>) => {
    // Implement OTP logic if needed
    console.log("OTP needed for:", phone);
  };

  const handleOtpSuccess = (user: FirebaseUser) => {
    const appUser: AppUser = {
      id: user.uid,
      email: user.email ?? null,
      fullName: user.displayName ?? null,
      avatarUrl: user.photoURL ?? null,
      roles: []
    };
    setUser(appUser);
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
