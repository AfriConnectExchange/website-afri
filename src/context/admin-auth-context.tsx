"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth as clientAuth } from '@/lib/firebaseClient';

type AdminUser = { username: string } | null;

type AdminAuthContextValue = {
  user: AdminUser;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createAccount: (username: string, password: string) => Promise<boolean>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const ADMIN_SESSION_KEY = "__afri_admin_session";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // hydrate session from sessionStorage
    try {
      const s = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.username) setUser({ username: parsed.username });
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }, []);
  const createAccount = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-auth/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast({ title: 'Admin account created', description: `Account ${username} created.` });
        return true;
      }
      toast({ title: 'Failed', description: json?.error || 'Could not create account.' });
      return false;
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Could not create account.' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json?.ok && json.token) {
        const session = { username, token: json.token };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        setUser({ username });
        toast({ title: 'Signed in', description: `Welcome back, ${username}` });
        return true;
      }
      toast({ title: 'Invalid credentials', description: json?.error || 'Username or password incorrect.' });
      return false;
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Login failed.' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      const s = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        const token = parsed?.token;
        if (token) await fetch('/api/admin-auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(null);
    try { router.push('/admin/login'); } catch (e) {}
  }, [router]);

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, createAccount }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export default AdminAuthContext;
