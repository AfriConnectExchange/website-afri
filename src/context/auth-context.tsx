
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
          // If the user's email is not verified yet, don't create the final profile or redirect to onboarding.
          // For strict flow we sign the user out after signup and require verification + explicit sign-in.
          if (!fbUser.emailVerified) {
            const minimalUser: AppUser = {
              id: fbUser.uid,
              email: fbUser.email ?? null,
              fullName: fbUser.displayName ?? null,
              avatarUrl: fbUser.photoURL ?? null,
              roles: []
            };
            setUser(minimalUser);
            setProfile(null);
            setIsLoading(false);
            return;
          }

          // Build app-level user and ensure server-side profile exists for verified users
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
              // read the created/merged profile returned by the server
              const body = await res.json().catch(() => null);
              const serverProfile = body?.profile ?? body ?? null;
              if (serverProfile) {
                setProfile(serverProfile as UserProfile);
                // merge any returned profile fields into the app user
                setUser((prev) => ({ ...prev, ...(serverProfile as any) } as AppUser));

                // If onboarding data is missing, redirect to onboarding
                if (!serverProfile.full_name) {
                  try {
                    router.push('/onboarding');
                  } catch (e) {
                    // router may not be available in some contexts; ignore
                  }
                }
              } else {
                setProfile({ id: fbUser.uid, email: fbUser.email ?? null, full_name: fbUser.displayName ?? null, roles: [] });
                setUser((prev) => ({ ...prev, email: fbUser.email ?? null, fullName: fbUser.displayName ?? null } as AppUser));
              }
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

      const fbUser = auth.currentUser;
      // If the user hasn't verified their email, prompt them and sign them out
      if (fbUser && !fbUser.emailVerified) {
        try {
          await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/verify-email` });
        } catch (e) {
          // ignore resend errors
          console.error('resend verification failed', e);
        }
        showSnackbar({ title: 'Please verify your email', description: 'A verification link was sent. Check your inbox.' }, 'error');
        // sign out the unverified session to prevent access until verified
        await firebaseSignOut(auth);
        router.push('/auth/signin');
        return;
      }

      router.push('/');
    } catch (err: any) {
      // show friendly translated message via global snackbar
      showSnackbar({ code: err?.code, description: err?.message ?? String(err) }, 'error');
      throw err;
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
      await sendEmailVerification(user, { url: `${window.location.origin}/auth/verify-email` });
      // Strict flow: sign out the newly-created (unverified) session so the user must verify and explicitly sign in.
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error('signout after signup failed', e);
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
