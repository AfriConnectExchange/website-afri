
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
  signUpWithPhone: (phone: string, profileData: { displayName: string }) => Promise<void>;
  handleNeedsOtp: (callback: (data: { phone: string, resend: () => Promise<void> }) => void) => void;
  handleOtpSuccess: (user: FirebaseUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showSnackbar } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();
  const [otpCallback, setOtpCallback] = useState<Function | null>(null);

  useEffect(() => {
    // This is a common pattern for initializing Firebase services that need the DOM.
    // We attach the verifier to the window object to ensure it's a singleton.
    if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(clientAuth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
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
        // If there's extra data (like from a phone signup with name), update the profile
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
          verification_status: 'verified',
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

  const startPhoneAuth = useCallback(async (phone: string, profileData?: { displayName: string }) => {
    const appVerifier = (window as any).recaptchaVerifier;
    try {
      const confirmationResult = await signInWithPhoneNumber(clientAuth, phone, appVerifier);
      // Store confirmationResult so it can be used in the OTP screen
      (window as any).confirmationResult = confirmationResult;
      (window as any).phoneAuthData = profileData; // Store extra data if it's a signup

      const resend = () => startPhoneAuth(phone, profileData);

      // Trigger the UI to switch to the OTP screen
      if (otpCallback) {
        otpCallback({ phone, resend });
      }
    } catch (error: any) {
      console.error("Phone auth error:", error);
      showSnackbar({ code: error?.code, description: `Failed to send OTP: ${error.message}` }, 'error');
      // Reset reCAPTCHA
      appVerifier.render().then((widgetId: any) => {
        grecaptcha.reset(widgetId);
      });
      throw error;
    }
  }, [showSnackbar, otpCallback]);

  const signInWithPhone = useCallback(async (phone: string) => {
    await startPhoneAuth(phone);
  }, [startPhoneAuth]);

  const signUpWithPhone = useCallback(async (phone: string, profileData: { displayName: string }) => {
    await startPhoneAuth(phone, profileData);
  }, [startPhoneAuth]);

  const handleNeedsOtp = useCallback((callback: Function) => {
    setOtpCallback(() => callback);
  }, []);

  const handleOtpSuccess = useCallback(async (user: FirebaseUser) => {
    const extraData = (window as any).phoneAuthData || {};
    await handleUserSession(user, extraData);
    (window as any).phoneAuthData = null; // Clean up
  }, [handleUserSession]);


  const logout = useCallback(async () => {
    await firebaseSignOut(clientAuth);
    setUser(null);
    setProfile(null);
    router.push('/');
  }, [router]);

  const updateUser = useCallback(async (data: { fullName?: string, avatarUrl?: string, [key: string]: any }) => {
    if (!clientAuth.currentUser) throw new Error("Not authenticated");
    
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

    await fetchUserProfile(clientAuth.currentUser);

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
    handleNeedsOtp,
    handleOtpSuccess
  }), [isLoading, user, profile, isAuthenticated, login, logout, signUp, updateUser, handleSocialLogin, signInWithPhone, signUpWithPhone, handleNeedsOtp, handleOtpSuccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
