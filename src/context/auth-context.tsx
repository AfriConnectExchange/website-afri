
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
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
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
  handleSocialLogin: (provider: 'google' | 'facebook') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showSnackbar } = useGlobal();
  const router = useRouter();

  const mapAuthError = (err: any) => {
    const code = err?.code || err?.error || null;
    const msg = err?.message ?? String(err ?? 'An error occurred');
    switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
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


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
          if (!fbUser.emailVerified) {
            // For unverified users, create a minimal user object so UI can still react
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
          
          // For verified users, create the full profile
          const baseUser: AppUser = {
            id: fbUser.uid,
            email: fbUser.email ?? null,
            fullName: fbUser.displayName ?? null,
            avatarUrl: fbUser.photoURL ?? null,
            roles: [] // Will be populated from Firestore
          };

          try {
            const idToken = await fbUser.getIdToken();
            const res = await fetch('/api/profile', { 
                method: 'POST', 
                headers: { 
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json' 
                }, 
                body: JSON.stringify({ displayName: fbUser.displayName ?? null }) 
            });

            if (res.ok) {
                const body = await res.json().catch(() => null);
                const serverProfile = body?.profile ?? body ?? null;
                
                if (serverProfile) {
                    setProfile(serverProfile as UserProfile);
                    setUser((prev) => ({ ...prev, ...(serverProfile as any) } as AppUser));
                     if (!serverProfile.onboarding_completed) {
                        try {
                            router.push('/onboarding');
                        } catch (e) {
                            console.warn("Router not available, couldn't redirect to onboarding.");
                        }
                    }
                }
            } else {
                 console.error("Failed to fetch/create profile from server");
                 setUser(baseUser);
            }
          } catch (err) {
            console.error('Error creating/fetching profile', err);
            setUser(baseUser); // Set base user as fallback
          }

        } else {
          setProfile(null);
          setUser(null);
        }
      setIsLoading(false);
    });
    return () => unsub();
  }, [router]);


  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      if (!fbUser.emailVerified) {
        try {
          await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/verify-email` });
          showSnackbar({ title: 'Please verify your email', description: 'A new verification link has been sent. Please check your inbox.' }, 'error');
        } catch (e) {
          showSnackbar({ title: 'Please verify your email', description: 'Check your inbox for the verification link.' }, 'error');
        }
        await firebaseSignOut(auth);
        router.push('/auth/verify-email');
        throw new Error("Email not verified.");
      }
      router.push('/');
    } catch (err: any) {
      throw err; // Re-throw to be caught by UI component
    }
  }, [router, showSnackbar]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (displayName) {
        await firebaseUpdateProfile(user, { displayName });
      }
      await sendEmailVerification(user, { url: `${window.location.origin}/auth/verify-email` });
      
      await firebaseSignOut(auth);
      
      return { success: true, message: 'Verification email sent. Check your inbox.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }, []);
  
  const handleSocialLogin = async (providerName: 'google' | 'facebook') => {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        if (!fbUser.emailVerified && fbUser.email) {
            await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/verify-email` });
            await firebaseSignOut(auth);
            showSnackbar({ title: 'Verification Required', description: 'A verification link has been sent to your email. Please verify before signing in.' }, 'info');
            router.push('/auth/verify-email');
            return;
        }
        
        showSnackbar({ title: `Signed in with ${providerName}`, description: '' }, 'success');
        router.push('/');

      } catch (err: any) {
          const friendlyError = mapAuthError(err);
          showSnackbar({ title: friendlyError.title, description: friendlyError.description }, 'error');
          throw err;
      }
  };


  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    router.push('/auth/signin');
  }, [router]);

  const updateUser = useCallback(async (data: Partial<{ displayName?: string; photoURL?: string }>) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not authenticated');
    try {
      await firebaseUpdateProfile(fbUser, data as any);
      const idToken = await fbUser.getIdToken();
      await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: data.displayName ?? null }) });
      setUser(prev => prev ? { ...prev, fullName: data.displayName ?? prev.fullName, avatarUrl: data.photoURL ?? prev.avatarUrl } : null);
    } catch (err: any) {
      throw new Error(err.message || 'Update failed');
    }
  }, []);

  const handleNeedsOtp = (phone: string, resend: () => Promise<void>) => {
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
    isAuthenticated: !!user && !!user.email, // A more robust check
    login,
    logout,
    updateUser,
    signUp,
    handleNeedsOtp,
    handleOtpSuccess,
    handleSocialLogin,
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

    