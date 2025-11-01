
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { CartProvider } from '@/context/cart-context';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';

import { AuthProvider } from '@/context/auth-context';
import { AdminAuthProvider } from '@/context/admin-auth-context';

import { GlobalProvider } from '@/lib/context/GlobalContext';

export const metadata: Metadata = {
  title: 'AfriConnect Exchange',
  description: 'Connecting the diaspora, one exchange at a time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only show footer on main content pages
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const hideFooterRoutes = [
    '/auth', '/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email',
    '/onboarding', '/kyc', '/support', '/help', '/error', '/not-found',
    // Hide footer for admin area routes
    '/admin'
  ];
  const shouldHideFooter = hideFooterRoutes.some(route => pathname.startsWith(route));
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col'
        )}
      >
        <GlobalProvider>
        <AuthProvider>
          <AdminAuthProvider>
          <CartProvider>
            <div className="flex-1">
              {children}
            </div>
            <ConditionalFooter />
            <CookieConsentBanner />
            <Toaster />
          </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
