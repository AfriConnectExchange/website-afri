"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth as clientAuth } from '@/lib/firebaseClient';
import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

type AdminUser = { 
  uid: string;
  email: string;
  roles: string[];
} | null;

type AdminAuthContextValue = {
  adminUser: AdminUser;
  isAdminLoading: boolean;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signOutAdmin: () => Promise<void>;
  getAdminToken: () => Promise<string | null>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = clientAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user has admin role
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        const data = await res.json();
        
        if (data.success && data.is_admin) {
          setAdminUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            roles: data.roles || [],
          });
        } else {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
      setIsAdminLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAdmin = useCallback(async (email: string, password: string) => {
    setIsAdminLoading(true);
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Verify admin role
      const res = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (!data.success || !data.is_admin) {
        // Not an admin, sign out
        await signOut(clientAuth);
        throw new Error('User does not have admin privileges');
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome to the Admin Portal",
      });
      
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin sign in error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or insufficient permissions",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAdminLoading(false);
    }
  }, [router, toast]);

  const signOutAdmin = useCallback(async () => {
    try {
      await signOut(clientAuth);
      setAdminUser(null);
      router.push('/admin/login');
      toast({
        title: "Signed Out",
        description: "You have been logged out of the admin portal",
      });
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
  }, [router, toast]);

  const value: AdminAuthContextValue = {
    adminUser,
    isAdminLoading,
    signInAdmin,
    signOutAdmin,
    getAdminToken: async () => {
      try {
        const user = clientAuth.currentUser;
        if (!user) return null;
        const t = await user.getIdToken();
        return t;
      } catch (e) {
        return null;
      }
    },
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
