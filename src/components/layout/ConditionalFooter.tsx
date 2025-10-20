"use client";
import Footer from './footer';
import { usePathname } from 'next/navigation';

const hideFooterRoutes = [
  '/auth', '/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email',
  '/onboarding', '/kyc', '/support', '/help', '/error', '/not-found'
];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const shouldHideFooter = hideFooterRoutes.some(route => pathname.startsWith(route));
  if (shouldHideFooter) return null;
  return <Footer />;
}
