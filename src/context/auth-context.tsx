
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
import { createSession, heartbeatSession, revokeSession, getDeviceId } from '@/lib/session-client';

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
  sendPhoneOtp: (phone: string) => Promise<ConfirmationResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showSnackbar } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();

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
        // Keep Firestore email_verified in sync with Firebase auth state so UI
        // doesn't prompt to verify an email that's already verified.
        if (fbUser.emailVerified && !userProfile.email_verified) {
          try {
            await updateDoc(userDocRef, { email_verified: true });
            userProfile.email_verified = true;
          } catch (err) {
            console.warn('Failed to update email_verified on profile:', err);
          }
        }
      } else {
        userProfile = {
          id: fbUser.uid,
          email: fbUser.email,
          phone: fbUser.phoneNumber,
          // Firestore does not accept undefined — use null when no name is available
          full_name: fbUser.displayName ?? extraData.displayName ?? null,
          roles: ['buyer'],
          status: 'active',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          verification_status: fbUser.phoneNumber ? 'pending' : 'unverified',
          email_verified: fbUser.emailVerified ?? false,
          phone_verified: fbUser.phoneNumber ? true : false,
        };
        await setDoc(userDocRef, userProfile);
      }

      const appUser: AppUser = {
        email: fbUser.email,
        phone: fbUser.phoneNumber,
        fullName: userProfile.full_name,
        avatarUrl: fbUser.photoURL,
        roles: userProfile.roles,
        onboarding_completed: userProfile.onboarding_completed,
        ...userProfile
      };
      
      return { appUser, userProfile };

    } catch (error: any) {
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
          // Create a server-side session record for device/session tracking
          try {
            // createSession will fetch ID token internally and persist session_id to localStorage
            createSession().then(sessionId => {
              if (sessionId) {
                console.debug('Session created:', sessionId);
              }
            }).catch(err => console.warn('createSession failed', err));
          } catch (e) {
            console.warn('createSession error', e);
          }
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

  // Heartbeat: ping session heartbeat periodically while user is signed in
  useEffect(() => {
    let timer: any = null;
    const startHeartbeat = () => {
      // send immediately then every 2 minutes
      heartbeatSession().catch(() => {});
      timer = setInterval(() => {
        heartbeatSession().catch(() => {});
      }, 2 * 60 * 1000);
    };

    if (clientAuth.currentUser) {
      startHeartbeat();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (fbUser) => {
        handleUserSession(fbUser);
    });
    return () => unsubscribe();
  }, [handleUserSession]);

  // Ensure a valid RecaptchaVerifier exists and the container is present in the DOM.
  // This will create a hidden container if needed and (re)initialize the verifier so
  // it won't point at a removed DOM element which causes the "client element has been removed" error.
  const ensureRecaptchaVerifier = useCallback(() => {
    if (typeof window === 'undefined') return null;

    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      // keep it out of layout
      container.style.position = 'absolute';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.overflow = 'hidden';
      container.style.left = '-9999px';
      document.body.appendChild(container);
    }

    // If there's an existing verifier, clear it first (per Firebase docs) so it
    // doesn't reference a removed DOM element. Then create a fresh verifier.
    // NOTE: use the documented argument order: new RecaptchaVerifier(containerId, params, auth)
    const existing = (window as any).recaptchaVerifier;
    try {
      if (existing && typeof existing.clear === 'function') {
        try {
          existing.clear();
        } catch (clearErr) {
          // Non-fatal: log and continue to re-create a verifier
          console.warn('Failed to clear existing reCAPTCHA verifier:', clearErr);
        }
      }

      const verifier = new RecaptchaVerifier(clientAuth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (err) {
      console.error('Failed to initialize reCAPTCHA verifier:', err);
      return null;
    }
  }, []);

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
      const result = await signInWithPopup(clientAuth, provider);
      // Show immediate success feedback. Use additionalUserInfo to guess if this was a sign-up.
      try {
        const isNew = (result as any)?.additionalUserInfo?.isNewUser;
        if (isNew) {
          showSnackbar({ title: 'Welcome to AfriConnect', description: 'Account created successfully.' }, 'success');
        } else {
          showSnackbar({ title: 'Signed in', description: 'Signed in successfully.' }, 'success');
        }
      } catch (e) {
        // If anything goes wrong determining new vs returning user, show a generic success
        showSnackbar({ title: 'Signed in', description: 'Signed in successfully.' }, 'success');
      }
    } catch (error: any) {
      // Log full error for debugging
      console.error('Social login error', error);
      const friendlyError = mapAuthError(error);
      // Surface the firebase error code in the UI to help debugging (e.g. auth/popup-closed-by-user)
      const codeHint = error?.code ? ` (${error.code})` : '';
      showSnackbar({ title: friendlyError.title, description: `${friendlyError.description}${codeHint}` }, 'error');
      throw error;
    }
  }, [showSnackbar]);

  const startPhoneAuth = useCallback(async (phone: string) => {
    // Ensure we have a fresh/valid verifier right before attempting phone auth.
    const appVerifier = ensureRecaptchaVerifier();
    if (!appVerifier) {
      throw new Error("reCAPTCHA verifier not initialized or could not be created.");
    }
    try {
      const confirmationResult = await signInWithPhoneNumber(clientAuth, phone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      try {
        showSnackbar({ title: 'OTP Sent', description: `A one-time code was sent to ${phone}.` }, 'success');
      } catch (snackErr) {
        // ignore snackbar errors; proceed to navigation
      }
      // Give the snackbar a short moment to render before navigating so the user sees feedback.
      await new Promise((res) => setTimeout(res, 250));
      router.push(`/auth/verify-phone?phone=${encodeURIComponent(phone)}`);
    } catch (error: any) {
      console.error("Phone auth error:", error);
      showSnackbar({ code: error?.code, description: `Failed to send OTP: ${error.message}` }, 'error');
      try {
        // RecaptchaVerifier.render() returns a Promise<number> in the modular SDK.
        if (appVerifier && typeof appVerifier.render === 'function') {
          try {
            const widgetId = await Promise.resolve(appVerifier.render());
            if (typeof (window as any).grecaptcha !== 'undefined' && (window as any).grecaptcha && typeof (window as any).grecaptcha.reset === 'function') {
              try {
                (window as any).grecaptcha.reset(widgetId);
              } catch (inner) {
                console.error('grecaptcha.reset failed:', inner);
              }
            }
          } catch (renderErr) {
            // render can fail if the original DOM element was removed. Attempt a safe re-init below.
            console.error('Error rendering reCAPTCHA widget for reset:', renderErr);
          }
        }

        // If reset failed because the recaptcha client/element was removed, try to re-create the verifier
        // only if the recaptcha container exists in the DOM.
        if (typeof window !== 'undefined') {
          try {
            const container = document.getElementById('recaptcha-container');
            if (container) {
              // Clear any existing verifier and create a fresh one using the
              // documented signature: containerId, params, auth
              if ((window as any).recaptchaVerifier && typeof (window as any).recaptchaVerifier.clear === 'function') {
                try {
                  (window as any).recaptchaVerifier.clear();
                } catch (clearErr) {
                  console.warn('Failed to clear recaptchaVerifier during re-init:', clearErr);
                }
              }
              (window as any).recaptchaVerifier = new RecaptchaVerifier(clientAuth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {},
              });
            } else {
              // Container not present; nothing to do here.
              // This can happen if the signup component unmounted before the flow completed.
              console.warn('recaptcha container not found in DOM; skipping re-init');
            }
          } catch (reinitErr) {
            console.error('Failed to re-initialize reCAPTCHA verifier:', reinitErr);
          }
        }
      } catch (e) {
        console.error("Error resetting reCAPTCHA:", e);
      }
      throw error;
    }
  }, [showSnackbar, router]);
  
  // Non-redirecting phone OTP sender for modal flows. Returns the confirmationResult
  // and does not navigate to the dedicated /auth/verify-phone page.
  const sendPhoneOtp = useCallback(async (phone: string) => {
    const appVerifier = ensureRecaptchaVerifier();
    if (!appVerifier) {
      throw new Error('reCAPTCHA verifier not initialized or could not be created.');
    }
    try {
      const confirmationResult = await signInWithPhoneNumber(clientAuth, phone, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      try {
        showSnackbar({ title: 'OTP Sent', description: `A one-time code was sent to ${phone}.` }, 'success');
      } catch (snackErr) {
        // ignore snackbar errors
      }
      return confirmationResult;
    } catch (error: any) {
      console.error('sendPhoneOtp error:', error);
      showSnackbar({ code: error?.code, description: `Failed to send OTP: ${error?.message}` }, 'error');
      throw error;
    }
  }, [ensureRecaptchaVerifier, showSnackbar]);

  const resendOtp = useCallback(async (phone: string) => {
    await sendPhoneOtp(phone);
  }, [sendPhoneOtp]);

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
    try {
      // Revoke current session server-side (best-effort)
      try {
        await revokeSession();
      } catch (e) {
        console.warn('Failed to revoke session on logout', e);
      }
    } finally {
      await firebaseSignOut(clientAuth);
      setUser(null);
      setProfile(null);
      router.push('/');
    }
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
    resendOtp,
    sendPhoneOtp
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
