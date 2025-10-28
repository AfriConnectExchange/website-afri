 'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseClient';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AppUser, UserProfile as DbUserProfile } from '@/lib/types';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useGlobal } from '@/lib/context/GlobalContext';
export { MockUser } from '@/lib/types';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';


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
        case 'auth/email-already-in-use':
            return { title: 'Email in use', description: 'This email address is already associated with an account.'};
        default:
            return { title: 'Sign-in Failed', description: msg };
    }
  };


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
          if (!fbUser.emailVerified) {
            const minimalUser: AppUser = {
              id: fbUser.uid,
              email: fbUser.email ?? null,
              fullName: fbUser.displayName ?? null,
              avatarUrl: fbUser.photoURL ?? null,
              roles: [],
              onboarding_completed: false
            };
            setUser(minimalUser);
            setProfile(null);
            setIsLoading(false);
            return;
          }
          
          try {
            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            let userProfile: UserProfile;

            if (userDoc.exists()) {
                userProfile = userDoc.data() as UserProfile;
            } else {
                 userProfile = {
                    id: fbUser.uid,
                    email: fbUser.email ?? '',
                    full_name: fbUser.displayName ?? '',
                    roles: ['buyer'],
                    status: 'active',
                    onboarding_completed: false,
                };
            }

            const appUser: AppUser = {
                id: fbUser.uid,
                email: fbUser.email,
                fullName: userProfile.full_name,
                avatarUrl: fbUser.photoURL,
                ...userProfile,
            };

            setUser(appUser);
            setProfile(userProfile);
          
          } catch (err) {
            console.error('Error fetching user profile', err);
            const fallbackUser: AppUser = {
              id: fbUser.uid,
              email: fbUser.email,
              fullName: fbUser.displayName,
              avatarUrl: fbUser.photoURL,
              roles: [],
              onboarding_completed: false
            };
            setUser(fallbackUser);
            setProfile(null);
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
      // On successful login, the onAuthStateChanged listener will handle setting user state and profile.
      // We can just redirect to home.
      router.push('/');
    } catch (err: any) {
      throw err; // Re-throw to be caught by UI component
    }
  }, [router, showSnackbar]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Update Firebase Auth profile
        if (displayName) {
          await firebaseUpdateProfile(fbUser, { displayName });
        }

        // Create user profile in Firestore
        const db = getFirestore();
        const userRef = doc(db, 'users', fbUser.uid);
        await setDoc(userRef, {
            id: fbUser.uid,
            email: fbUser.email,
            full_name: displayName ?? null,
            created_at: new Date().toISOString(),
            roles: ['buyer'],
            onboarding_completed: false,
            status: 'active'
        }, { merge: true });

        // Send verification email
        await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/verify-email` });
        
        // Sign out immediately to force email verification
        await firebaseSignOut(auth);

        return { success: true, message: 'Verification email sent. Check your inbox.' };
    } catch (err: any) {
        const friendlyError = mapAuthError(err);
        return { success: false, message: friendlyError.description };
    }
  }, []);
  
  const handleSocialLogin = async (providerName: 'google' | 'facebook') => {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        
        const db = getFirestore();
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        // If user document doesn't exist, create it
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                id: fbUser.uid,
                email: fbUser.email,
                full_name: fbUser.displayName,
                avatar_url: fbUser.photoURL,
                roles: ['buyer'],
                onboarding_completed: false,
                status: 'active',
                created_at: new Date().toISOString(),
            }, { merge: true });
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
      
      const db = getFirestore();
      const userRef = doc(db, 'users', fbUser.uid);
      await setDoc(userRef, {
          full_name: data.displayName,
          avatar_url: data.photoURL,
          updated_at: new Date().toISOString()
      }, { merge: true });

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
    isAuthenticated: !!user?.email && !isLoading,
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
