
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    sendEmailVerification, 
    updateProfile as firebaseUpdateProfile, 
    GoogleAuthProvider, 
    FacebookAuthProvider, 
    signInWithPopup, 
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult,
    type User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useGlobal } from '@/lib/context/GlobalContext';
import type { AppUser, UserProfile as DbUserProfile } from '@/lib/types';
import { auth as clientAuth, db } from '@/lib/firebaseClient';
import { fetchWithAuth } from '../lib/api';

export type UserProfile = DbUserProfile;

interface AuthContextType {
  isLoading: boolean;
  user: AppUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { fullName?: string; avatarUrl?: string; [key: string]: any; }) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; user?: FirebaseUser; message?: string; requiresVerification?: boolean; }>;
  handleSocialLogin: (provider: 'google' | 'facebook') => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  signUpWithPhone: (phone: string) => Promise<void>;
  handleOtpSuccess: (user: FirebaseUser) => void;
  resendOtp: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showSnackbar } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(clientAuth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {},
      });
    }
  }, []);

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
  
  const fetchUserProfile = async (fbUser: FirebaseUser, extraData: Record<string, any> = {}): Promise<{ appUser: AppUser; userProfile: UserProfile } | null> => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userProfile: UserProfile;

      if (userDoc.exists()) {
        userProfile = userDoc.data() as UserProfile;
        if (Object.keys(extraData).length > 0 && !userProfile.full_name) {
            await updateDoc(userDocRef, { full_name: extraData.displayName });
            userProfile.full_name = extraData.displayName;
        }
      } else {
        userProfile = {
          id: fbUser.uid,
          email: fbUser.email,
          phone: fbUser.phoneNumber,
          full_name: fbUser.displayName || extraData.displayName,
          roles: ['buyer'],
          status: 'active',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          verification_status: 'verified', // Phone verified users are auto-verified
        };
        await setDoc(userDocRef, userProfile);
      }

      const appUser: AppUser = {
        id: fbUser.uid,
        email: fbUser.email,
        phone: fbUser.phoneNumber,
        fullName: userProfile.full_name,
        avatarUrl: fbUser.photoURL,
        roles: userProfile.roles,
        onboarding_completed: userProfile.onboarding_completed,
        ...userProfile
      };
      
      return { appUser, userProfile };

    } catch (error) {
      console.error("Error fetching user profile:", error);
      showSnackbar({ title: 'Profile Error', description: 'Could not load your user profile.' }, 'error');
      return null;
    }
  };

  const handleUserSession = useCallback(async (fbUser: FirebaseUser | null, extraData: Record<string, any> = {}) => {
    setIsLoading(true);
    if (fbUser) {
      const isEmailProvider = fbUser.providerData.some(p => p.providerId === 'password');
      if (isEmailProvider && !fbUser.emailVerified) {
        setUser({ id: fbUser.uid, email: fbUser.email, roles: [], onboarding_completed: false });
        setProfile(null);
        if (!pathname.startsWith('/auth/verify-email')) {
          router.push('/auth/verify-email');
        }
      } else {
        const profileData = await fetchUserProfile(fbUser, extraData);
        if (profileData) {
          setUser(profileData.appUser);
          setProfile(profileData.userProfile);
          if (!profileData.userProfile.onboarding_completed && !pathname.startsWith('/onboarding')) {
            router.push('/onboarding');
          } else if (profileData.userProfile.onboarding_completed && (pathname.startsWith('/auth') || pathname.startsWith('/onboarding'))){
            router.push('/');
          }
        }
      }
    } else {
      setUser(null);
      setProfile(null);
    }
    setIsLoading(false);
  }, [router, pathname, showSnackbar]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (fbUser) => {
        handleUserSession(fbUser);
    });
    return () => unsubscribe();
  }, [handleUserSession]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(clientAuth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      const fbUser = userCredential.user;
      
      await firebaseUpdateProfile(fbUser, { displayName: fullName });
      
      const userProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email,
        full_name: fullName || null,
        roles: ['buyer'],
        status: 'pending',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        verification_status: 'unverified',
      };

      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      await sendEmailVerification(fbUser, { url: `${window.location.origin}/auth/verify-email` });
      
      return { success: true, user: fbUser, requiresVerification: true, message: 'Verification email sent! Please check your inbox.' };
    } catch (error: any) {
      const friendlyError = mapAuthError(error);
      return { success: false, message: friendlyError.description };
    }
  }, []);

  const handleSocialLogin = useCallback(async (providerName: 'google' | 'facebook') => {
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
    try {
      await signInWithPopup(clientAuth, provider);
    } catch (error: any) {
      const friendlyError = mapAuthError(error);
      showSnackbar(friendlyError, 'error');
      throw error;
    }
  }, [showSnackbar]);

  const startPhoneAuth = useCallback(async (phone: string) => {
    const appVerifier = (window as any).recaptchaVerifier;
    try {
      const confirmationResult = await signInWithPhoneNumber(clientAuth, phone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      router.push(`/auth/verify-phone?phone=${encodeURIComponent(phone)}`);
    } catch (error: any) {
      console.error("Phone auth error:", error);
      showSnackbar({ code: error?.code, description: `Failed to send OTP: ${error.message}` }, 'error');
      try {
        const widgetId = appVerifier.render();
        grecaptcha.reset(widgetId);
      } catch (e) {
        console.error("Error resetting reCAPTCHA:", e);
      }
      throw error;
    }
  }, [showSnackbar, router]);
  
  const resendOtp = useCallback(async(phone: string) => {
      await startPhoneAuth(phone);
  }, [startPhoneAuth]);

  const signInWithPhone = useCallback(async (phone: string) => {
    localStorage.removeItem('phone_signup_displayName');
    await startPhoneAuth(phone);
  }, [startPhoneAuth]);

  const signUpWithPhone = useCallback(async (phone: string) => {
    await startPhoneAuth(phone);
  }, [startPhoneAuth]);

  const handleOtpSuccess = useCallback(async (fbUser: FirebaseUser) => {
    const displayName = localStorage.getItem('phone_signup_displayName');
    const extraData = displayName ? { displayName } : {};
    
    await handleUserSession(fbUser, extraData);

    localStorage.removeItem('phone_signup_displayName');
  }, [handleUserSession]);

  const logout = useCallback(async () => {
    await firebaseSignOut(clientAuth);
    setUser(null);
    setProfile(null);
    router.push('/');
  }, [router]);

  const updateUser = useCallback(async (data: { fullName?: string, avatarUrl?: string, [key: string]: any }) => {
    if (!clientAuth.currentUser) throw new Error("Not authenticated");
    
    // Use the secure API route for onboarding completion
    if (data.onboarding_completed) {
        const response = await fetchWithAuth('/api/onboarding/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to complete onboarding.');
        }
    } else {
        // For other profile updates, update directly (or create other specific API routes)
        const { fullName, avatarUrl, ...otherProfileData } = data;
        const authUpdate: { displayName?: string, photoURL?: string } = {};
        if (fullName) authUpdate.displayName = fullName;
        if (avatarUrl) authUpdate.photoURL = avatarUrl;
        
        if (Object.keys(authUpdate).length > 0) {
          await firebaseUpdateProfile(clientAuth.currentUser, authUpdate);
        }
        
        const profileUpdateData: Record<string, any> = { ...otherProfileData, updated_at: new Date().toISOString() };
        if (fullName) profileUpdateData.full_name = fullName;
        if (avatarUrl) profileUpdateData.profile_picture_url = avatarUrl;
        
        const userDocRef = doc(db, 'users', clientAuth.currentUser.uid);
        await updateDoc(userDocRef, profileUpdateData);
    }


    // Re-fetch profile to update context state
    const userDocRef = doc(db, 'users', clientAuth.currentUser.uid);
    const profileSnap = await getDoc(userDocRef);
    if(profileSnap.exists()) {
        const newProfile = profileSnap.data() as UserProfile;
        setProfile(newProfile);
        setUser(prev => prev ? ({...prev, ...newProfile}) : null);
    }

  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const value = useMemo(() => ({
    isLoading,
    user,
    profile,
    isAuthenticated,
    login,
    logout,
    signUp,
    updateUser,
    handleSocialLogin,
    signInWithPhone,
    signUpWithPhone,
    handleOtpSuccess,
    resendOtp
  }), [isLoading, user, profile, isAuthenticated, login, logout, signUp, updateUser, handleSocialLogin, signInWithPhone, signUpWithPhone, handleOtpSuccess, resendOtp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
