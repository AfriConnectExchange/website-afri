
"use client";

import { SessionProvider, getSession, useSession } from "next-auth/react";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SessionDebug from '@/components/dev/SessionDebug';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SessionSync />
        <SessionDebug />
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

function SessionSync() {
  // This small client effect ensures the client app (AuthProvider and components)
  // know about the currently authenticated session as soon as possible.
  // It also triggers the server-side session logging endpoint so activity/device
  // rows are created when a session is available.
  const { status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      try {
        const sess = await getSession();
        if (!mounted) return;
        if (sess) {
          // Notify server to persist session/device/activity info. Include credentials.
          await fetch('/api/auth/log-session', { method: 'POST', credentials: 'include' });
        }
      } catch (err) {
        // ignore errors silently — this is best-effort
      }
    };

    // Run on mount and when session status becomes 'authenticated' or on route change
    sync();
    return () => { mounted = false; };
  }, [status, pathname]);

  return null;
}
