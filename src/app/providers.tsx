"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import type { Session } from "next-auth";

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}