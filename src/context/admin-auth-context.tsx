"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type AdminUser = { username: string } | null;

type AdminAuthContextValue = {
  user: AdminUser;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createAccount: (username: string, password: string) => Promise<boolean>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const ADMIN_ACCOUNT_KEY = "__afri_admin_account";
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
    try {
      const account = { username, password };
      localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(account));
      toast({ title: "Admin account created", description: `Account ${username} created.` });
      return true;
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message || "Could not create account." });
      return false;
    }
  }, [toast]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(ADMIN_ACCOUNT_KEY);
      if (!raw) {
        toast({ title: "No admin account", description: "No admin account exists. Create one first." });
        setLoading(false);
        return false;
      }
      const acct = JSON.parse(raw) as { username: string; password: string };
      // simple check (client-side only for now)
      if (acct.username === username && acct.password === password) {
        const session = { username, token: Math.random().toString(36).slice(2) };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        setUser({ username });
        toast({ title: "Signed in", description: `Welcome back, ${username}` });
        return true;
      }
      toast({ title: "Invalid credentials", description: "Username or password incorrect." });
      return false;
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Login failed." });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(null);
    // navigate back to login
    try { router.push("/admin/login"); } catch (e) {}
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
