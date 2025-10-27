'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { createSPAClient } from '@/lib/supabase/client';
import MuiSnackbar from '@/components/ui/Snackbar';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Define a more specific type for your public.users table row
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  // Add other fields from your users table as needed
  roles: string[] | null;
  status: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
}

interface GlobalContextType {
  isLoading: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSPAClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning'; duration?: number }>({ open: false, message: '', severity: 'info', duration: 5000 });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 5000) => {
    setSnackbar({ open: true, message, severity, duration });
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile as UserProfile | null);
      }
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile as UserProfile | null);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
