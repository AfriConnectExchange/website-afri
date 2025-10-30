
'use client';

import React from 'react';
import { Mail, MapPin, Building2 } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/context/cart-context';

const LegalPageLayout = ({ title, children, lastUpdated }: { title: string; children: React.ReactNode; lastUpdated: string }) => {
  const { cartCount } = useCart();
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <Header cartCount={cartCount} />
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated on {lastUpdated}</p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 flex-1">
        <Card>
            <CardContent className="p-6 md:p-8">
                 {children}
            </CardContent>
        </Card>
      </main>
    </div>
  );
};


const Section = ({ title, number, children }: { title: string; number?: string; children: React.ReactNode }) => (
  <section className="mb-8 last:mb-0">
    <h2 className="text-xl font-semibold text-foreground mb-4 border-b pb-2">
      {number && <span className="text-primary">{number}. </span>}{title}
    </h2>
    <div className="prose prose-gray max-w-none text-muted-foreground leading-relaxed text-sm md:text-base">
      {children}
    </div>
  </section>
);


export const TermsOfService = () => (
  <LegalPageLayout title="Terms of Service" lastUpdated="July 23, 2024">
    <Section number="1" title="Welcome to AfriConnect Exchange">
      <p>These Terms of Service ("Terms") govern your access to and use of the AfriConnect Exchange platform ("Platform"), a digital community project operated by <strong>McBenLeo CIC</strong>, a registered Community Interest Company in Scotland (Company Number: SC859990). Our mission is to empower African diaspora communities through cultural commerce, resource sharing, and digital inclusion. By using our Platform, you agree to be bound by these Terms.</p>
    </Section>

    <Section number="2" title="Your Account & Responsibilities">
      <p>To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep this information updated. You are responsible for all activities that occur under your account and for keeping your password confidential. You must notify us immediately of any unauthorized use of your account.</p>
    </Section>

    <Section number="3" title="Marketplace Rules & Community Guidelines">
        <p>As a user of our Platform, you agree to:</p>
        <ul>
            <li>Ensure all listings for products or services are truthful, accurate, and culturally respectful.</li>
            <li>Fulfill all orders for products or services you offer in a timely and professional manner.</li>
            <li>Refrain from posting content that is illegal, fraudulent, discriminatory, or harmful.</li>
            <li>Communicate with other users respectfully and professionally.</li>
        </ul>
        <p>We reserve the right to moderate content and suspend or terminate accounts that violate these guidelines to maintain a safe and positive environment for all users.</p>
    </Section>

    <Section number="4" title="Payments, Fees & Escrow">
        <p>Our platform facilitates transactions through secure, third-party payment processors like Stripe and PayPal. We do not store your full payment card details.</p>
        <ul>
            <li><strong>Fees:</strong> Any transaction fees, commissions, or listing fees will be clearly disclosed to you before you confirm a transaction or listing.</li>
            <li><strong>Escrow Service:</strong> For your protection, we strongly recommend using our escrow service for transactions. When you pay using escrow, your funds are held securely by us and are only released to the seller after you have confirmed satisfactory receipt of your item. This service is designed to protect both buyers and sellers from fraud.</li>
        </ul>
    </Section>
    
    <Section number="5" title="Privacy and Data Protection">
        <p>Your privacy is important to us. Our collection and use of your personal data are governed by our <strong>Privacy Policy</strong>. By using the Platform, you consent to the data practices described therein.</p>
    </Section>

    <Section number="6" title="Limitation of Liability">
        <p>AfriConnect Exchange is a platform that connects buyers and sellers. While we strive to maintain a safe and reliable environment, McBenLeo CIC is not liable for user-generated content, the quality of products/services sold, or offline interactions between users. We do not guarantee uninterrupted access to the Platform. Our liability is limited to the maximum extent permitted by law.</p>
    </Section>

    <Section number="7" title="Changes to These Terms">
        <p>We may update these Terms periodically to reflect changes in our services or for legal reasons. We will notify you of significant changes via email or a notice on the Platform. Your continued use of the Platform after such changes constitutes your acceptance of the new Terms.</p>
    </Section>
    
    <Section number="8" title="Contact Us">
      <p>If you have any questions about these Terms, please contact us:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:info@africonnect-exchange.org">info@africonnect-exchange.org</a></li>
        <li><strong>Address:</strong> AfriConnect Exchange (McBenLeo CIC), 4 Orkney Drive, Kilmarnock, KA3 2HP, Scotland</li>
      </ul>
    </Section>
  </LegalPageLayout>
);


export const PrivacyPolicy = () => (
  <LegalPageLayout title="Privacy Policy" lastUpdated="July 23, 2024">
    <Section number="1" title="Our Commitment to Your Privacy">
      <p>AfriConnect Exchange, a project of McBenLeo CIC, is dedicated to protecting your personal data. This Privacy Policy details what information we collect, how we use and protect it, and the rights you have concerning your data under the UK General Data Protection Regulation (UK GDPR).</p>
    </Section>
    <Section number="2" title="Information We Collect">
      <p>We may collect and process the following types of personal data:</p>
      <ul>
        <li><strong>Identity Data:</strong> Includes your full name, email address, phone number, and date of birth.</li>
        <li><strong>Profile & Verification Data:</strong> Includes your chosen user role, biography, location, and documents provided for KYC verification (e.g., ID, proof of address).</li>
        <li><strong>Transaction Data:</strong> Details about payments to and from you, and other details of products and services you have purchased or sold on the Platform. Payment card details are processed by our secure payment providers and are not stored by us.</li>
        <li><strong>Usage Data:</strong> Information about how you use our website, products, and services, including login activity, page views, and interactions.</li>
      </ul>
    </Section>
    <Section number="3" title="How We Use Your Data">
      <p>We use your data for the following purposes:</p>
      <ul>
        <li>To create and manage your account and provide you with our services.</li>
        <li>To facilitate transactions, including processing payments and managing deliveries.</li>
        <li>To verify your identity (KYC) as required for certain user roles (e.g., Sellers).</li>
        <li>To improve platform performance, security, and user experience.</li>
        <li>To communicate with you about your account, transactions, and important updates.</li>
        <li>To comply with our legal and regulatory obligations.</li>
      </ul>
    </Section>
    <Section number="4" title="Your Data Protection Rights">
      <p>Under the UK GDPR, you have several rights regarding your personal data:</p>
      <ul>
        <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
        <li><strong>Right to Rectification:</strong> You can request to correct inaccurate or incomplete data.</li>
        <li><strong>Right to Erasure:</strong> You can request the deletion of your personal data ("right to be forgotten").</li>
        <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent for data processing at any time.</li>
        <li><strong>Right to Object:</strong> You can object to our processing of your data for certain purposes (e.g., direct marketing).</li>
        <li><strong>Right to Complain:</strong> You have the right to file a complaint with the Information Commissioner’s Office (ICO) if you have concerns about how we handle your data.</li>
      </ul>
    </Section>
    <Section number="5" title="Data Sharing and Security">
      <p>We do not sell your personal data. We only share it with trusted partners necessary to provide our services, such as payment processors (Stripe, PayPal), cloud hosting providers, and analytics services. We implement robust security measures, including SSL encryption, secure servers, and regular audits, to protect your data from unauthorized access.</p>
    </Section>
    <Section number="6" title="Cookie Usage">
      <p>Our Platform uses cookies to enhance your experience. Cookies are small files stored on your device that help with site functionality, analytics, and personalization. For detailed information, please see our <strong>Cookie Policy</strong>.</p>
    </Section>
    <Section number="7" title="Contact Us">
      <p>For any privacy-related questions or to exercise your data rights, please contact our Data Protection Officer at:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@africonnectexchange.org">privacy@africonnectexchange.org</a></li>
        <li><strong>Address:</strong> AfriConnect Exchange (McBenLeo CIC), 4 Orkney Drive, Kilmarnock, KA3 2HP, Scotland</li>
      </ul>
    </Section>
  </LegalPageLayout>
);


export const CookiePolicy = () => (
  <LegalPageLayout title="Cookie Policy" lastUpdated="July 23, 2024">
    <Section number="1" title="What Are Cookies?">
      <p>Cookies are small text files placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the site owners. Cookies help us improve your experience by remembering your preferences and understanding how you interact with our Platform.</p>
    </Section>
    <Section number="2" title="Types of Cookies We Use">
        <p>We use the following categories of cookies on AfriConnect Exchange:</p>
        <ul>
            <li><strong>Essential Cookies:</strong> These are strictly necessary for the website to function. They enable core functionalities such as user authentication (logging in), managing your shopping cart, and security. You cannot opt out of these cookies.</li>
            <li><strong>Performance & Analytics Cookies:</strong> These cookies help us understand how visitors interact with our Platform by collecting and reporting information anonymously. We use this data (e.g., from Google Analytics) to improve our services and identify areas for enhancement.</li>
            <li><strong>Preference Cookies:</strong> Also known as functionality cookies, these remember choices you make (like your username, language, or region) to provide a more personalized experience.</li>
            <li><strong>Marketing Cookies:</strong> These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not directly store personal information but are based on uniquely identifying your browser and internet device.</li>
        </ul>
    </Section>
    <Section number="3" title="How to Manage Your Cookies">
        <p>You have full control over your cookie preferences. You can manage them in the following ways:</p>
        <ul>
            <li><strong>Our Cookie Banner:</strong> When you first visit our site, you can set your preferences using our cookie consent banner.</li>
            <li><strong>Browser Settings:</strong> Most web browsers allow you to view, manage, and delete cookies through their settings. You can configure your browser to block all cookies or to alert you when a cookie is being sent. Please note that if you block essential cookies, some parts of our Platform may not function correctly.</li>
        </ul>
    </Section>
    <Section number="4" title="Third-Party Cookies">
      <p>In addition to our own cookies, we may also use various third-parties’ cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on. For example, we use Google Analytics to monitor traffic and Stripe to process payments, both of which may set their own cookies. These are governed by their respective privacy policies.</p>
    </Section>
    <Section number="5" title="Policy Updates">
      <p>We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any changes will be posted on this page with an updated revision date.</p>
    </Section>
  </LegalPageLayout>
);

    
