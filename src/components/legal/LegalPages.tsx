import React from 'react';
import { Mail, MapPin, Building2 } from 'lucide-react';

import ConditionalFooter from '@/components/layout/ConditionalFooter';
const LegalPageLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-2">AfriConnect Exchange - A Project of McBenLeo CIC</p>
      </div>
    </header>
    <main className="max-w-4xl mx-auto px-4 py-8 flex-1">
      <div className="bg-white rounded-lg shadow-sm p-8">{children}</div>
    </main>
    <ConditionalFooter />
  </div>
);

const Section = ({ title, number, children }: { title: string; number?: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">
      {number && <span className="text-blue-600">{number}. </span>}{title}
    </h2>
    <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export const TermsOfService = () => (
  <LegalPageLayout title="Terms of Service">
    {/* ...terms content... */}
    <Section number="1" title="Welcome">
      <p>AfriConnect Exchange is a digital platform operated by <strong>McBenLeo CIC</strong>, a registered Community Interest Company in Scotland. This platform exists to empower African diaspora communities through resource sharing, cultural commerce, and digital inclusion.</p>
    </Section>
    {/* Add other sections as needed */}
  </LegalPageLayout>
);

export const PrivacyPolicy = () => (
  <LegalPageLayout title="Privacy Policy">
    {/* ...privacy content... */}
    <Section number="1" title="Your Privacy Matters">
      <p>AfriConnect Exchange, operated by McBenLeo CIC, is committed to protecting your personal data. This policy explains what we collect, why we collect it, and how you can control it.</p>
    </Section>
    {/* Add other sections as needed */}
  </LegalPageLayout>
);

export const CookiePolicy = () => (
  <LegalPageLayout title="Cookie Policy">
    {/* ...cookie content... */}
    <Section number="1" title="What Are Cookies?">
      <p>Cookies are small text files stored on your device when you visit our website. They help us improve your experience and understand how our platform is used.</p>
    </Section>
    {/* Add other sections as needed */}
  </LegalPageLayout>
);
