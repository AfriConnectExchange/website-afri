
import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { cn } from '@/lib/utils';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import { Providers } from './providers';


export const metadata: Metadata = {
  title: 'AfriConnect Exchange',
  description: 'Connecting the diaspora, one exchange at a time.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch the server session and pass it into the client-side SessionProvider
  // so the client has the initial session without relying solely on client fetch.
  const session = (await getServerSession(authOptions as any)) as Session | null;

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
          <Providers session={session}>
            <div className="flex-1">
              {children}
            </div>
            <ConditionalFooter />
            <Toaster />
            <SonnerToaster richColors position="top-right" />
          </Providers>
      </body>
    </html>
  );
}
