
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
