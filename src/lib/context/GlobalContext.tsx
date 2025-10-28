 'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import MuiSnackbar from '@/components/ui/Snackbar';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { AppUser, UserProfile as DbUserProfile } from '@/lib/types';

// Define a more specific type for your public.users table row
// Reuse the DB profile type from central types
export type UserProfile = DbUserProfile;

interface GlobalContextType {
  isLoading: boolean;
  user: AppUser | null;
  profile: UserProfile | null;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning'; duration?: number }>({ open: false, message: '', severity: 'info', duration: 5000 });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 5000) => {
    setSnackbar({ open: true, message, severity, duration });
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // create a minimal app user object to keep existing components happy
        const baseUser: AppUser = {
          id: fbUser.uid,
          email: fbUser.email ?? null,
          fullName: fbUser.displayName ?? null,
          avatarUrl: fbUser.photoURL ?? null,
          roles: [] as string[],
        };
        setUser(baseUser);
        try {
          const db = getFirestore();
          const docRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const p = snap.data() as UserProfile;
            setProfile(p);
            setUser((prev) => ({ ...prev, ...p } as AppUser));
          } else {
            const newProfile: UserProfile = { id: fbUser.uid, email: fbUser.email ?? null, full_name: fbUser.displayName ?? null, roles: [] };
            setProfile(newProfile);
            setUser((prev) => ({ ...prev, ...newProfile } as AppUser));
          }
        } catch (err) {
          console.error('failed to read profile', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo(() => ({
    isLoading,
    user,
    profile,
    showSnackbar,
  }), [isLoading, user, profile]);

  return (
    <GlobalContext.Provider value={value}>
      {children}
      <MuiSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        autoHideDuration={snackbar.duration}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </GlobalContext.Provider>
  );
}

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
