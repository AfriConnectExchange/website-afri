
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendEmailVerification, updateProfile as firebaseUpdateProfile, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useGlobal } from '@/lib/context/GlobalContext';
import type { AppUser, UserProfile as DbUserProfile } from '@/lib/types';
import { auth as clientAuth, db } from '@/lib/firebaseClient'; // Use the client-side instances

export type UserProfile = DbUserProfile;

interface AuthContextType {
  isLoading: boolean;
  user: AppUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { fullName?: string; avatarUrl?: string; [key: string]: any; }) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; }>;
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
    const code = err?.code || 'auth/unknown-error';
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return { title: 'Invalid Credentials', description: 'The email or password you entered is incorrect.' };
      case 'auth/invalid-email':
        return { title: 'Invalid Email', description: 'Please enter a valid email address.' };
      case 'auth/email-already-in-use':
        return { title: 'Email Already In Use', description: 'This email is already registered. Please sign in.' };
      case 'auth/network-request-failed':
        return { title: 'Network Error', description: 'Please check your internet connection and try again.' };
      case 'auth/popup-closed-by-user':
        return { title: 'Sign-in Cancelled', description: 'You closed the sign-in window before completing the process.' };
      default:
        return { title: 'Authentication Error', description: err.message || 'An unknown error occurred.' };
    }
  };
  
  const fetchUserProfile = async (fbUser: FirebaseUser): Promise<{ appUser: AppUser; userProfile: UserProfile } | null> => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userProfile: UserProfile;

      if (userDoc.exists()) {
        userProfile = userDoc.data() as UserProfile;
      } else {
        // This case is for social sign-ins where a profile might not exist yet.
        userProfile = {
          id: fbUser.uid,
          email: fbUser.email,
          full_name: fbUser.displayName,
          roles: ['buyer'],
          status: 'active',
          onboarding_completed: false, // NEW USERS START HERE
          created_at: new Date().toISOString(),
          verification_status: 'verified', // Social providers are considered verified
        };
        await setDoc(userDocRef, userProfile);
      }

      const appUser: AppUser = {
        id: fbUser.uid,
        email: fbUser.email,
        fullName: userProfile.full_name,
        avatarUrl: fbUser.photoURL,
        ...userProfile
      };

      return { appUser, userProfile };

    } catch (error) {
      console.error("Error fetching user profile:", error);
      showSnackbar({ title: 'Profile Error', description: 'Could not load your user profile.' }, 'error');
      return null;
    }
  };

  const handleUserSession = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      if (!fbUser.emailVerified) {
        setUser({ id: fbUser.uid, email: fbUser.email, roles: [], onboarding_completed: false });
        setProfile(null);
        // Don't setIsLoading to false here, wait for navigation
        if (window.location.pathname !== '/auth/verify-email') {
          router.push('/auth/verify-email');
        }
      } else {
        const profileData = await fetchUserProfile(fbUser);
        if (profileData) {
          setUser(profileData.appUser);
          setProfile(profileData.userProfile);
          if (!profileData.userProfile.onboarding_completed) {
            router.push('/onboarding');
          }
        }
      }
    } else {
      setUser(null);
      setProfile(null);
    }
    setIsLoading(false);
  }, [router, showSnackbar]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, handleUserSession);
    return () => unsubscribe();
  }, [handleUserSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      const friendlyError = mapAuthError(error);
      throw new Error(friendlyError.description);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      const fbUser = userCredential.user;
      
      await firebaseUpdateProfile(fbUser, { displayName: fullName });
      
      const userProfile = {
        id: fbUser.uid,
        email: fbUser.email,
        full_name: fullName || null,
        roles: ['buyer'],
        status: 'active',
        onboarding_completed: false, // All new users must onboard
        created_at: new Date().toISOString(),
        verification_status: 'unverified',
      };

      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      
      await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/signin?verified=true` });
      
      await firebaseSignOut(clientAuth);
      
      return { success: true, requiresVerification: true, message: 'Verification email sent! Please check your inbox.' };
    } catch (error: any) {
      const friendlyError = mapAuthError(error);
      return { success: false, message: friendlyError.description };
    }
  }, []);

  const handleSocialLogin = useCallback(async (providerName: 'google' | 'facebook') => {
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
    try {
      await signInWithPopup(clientAuth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      const friendlyError = mapAuthError(error);
      showSnackbar(friendlyError, 'error');
    }
  }, [showSnackbar]);

  const logout = useCallback(async () => {
    await firebaseSignOut(clientAuth);
    setUser(null);
    setProfile(null);
    router.push('/auth/signin');
  }, [router]);

  const updateUser = useCallback(async (data: { fullName?: string, avatarUrl?: string, [key: string]: any }) => {
    if (!clientAuth.currentUser) throw new Error("Not authenticated");
    
    const { fullName, avatarUrl, ...otherProfileData } = data;
    const authUpdate: { displayName?: string, photoURL?: string } = {};
    if (fullName) authUpdate.displayName = fullName;
    if (avatarUrl) authUpdate.photoURL = avatarUrl;
    
    // Update Firebase Auth profile
    if (Object.keys(authUpdate).length > 0) {
      await firebaseUpdateProfile(clientAuth.currentUser, authUpdate);
    }
    
    // Update Firestore profile
    const profileUpdateData = {
      full_name: fullName,
      avatar_url: avatarUrl,
      ...otherProfileData,
      updated_at: new Date().toISOString()
    };
    
    const userDocRef = doc(db, 'users', clientAuth.currentUser.uid);
    await updateDoc(userDocRef, profileUpdateData);

    // Re-fetch profile to update context
    await fetchUserProfile(clientAuth.currentUser);

  }, []);

  const value = useMemo(() => ({
    isLoading,
    user,
    profile,
    isAuthenticated: !!user && !isLoading,
    login,
    logout,
    signUp,
    updateUser,
    handleSocialLogin,
  }), [isLoading, user, profile, login, logout, signUp, updateUser, handleSocialLogin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
