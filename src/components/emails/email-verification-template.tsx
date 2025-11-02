// Email Verification Template
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components';

interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
  verificationCode?: string;
}

export const EmailVerificationEmail = ({ userName = 'User', verificationUrl = '', verificationCode = '' }: EmailVerificationProps) => (
  <Html>
    <Head />
    <Preview>Verify your AfriConnect email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✓ Verify Your Email</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>Welcome to AfriConnect! Please verify your email address to get started.</Text>
        {verificationCode && (
          <Section style={codeBox}>
            <Text style={codeLabel}>Verification Code:</Text>
            <Text style={code}>{verificationCode}</Text>
          </Section>
        )}
        <Section style={buttonContainer}>
          <Button style={button} href={verificationUrl}>Verify Email Address</Button>
        </Section>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

export default EmailVerificationEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1 = { color: '#34A853', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const codeBox = { backgroundColor: '#E8F5E9', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const };
const codeLabel = { color: '#71717A', fontSize: '14px', margin: '0 0 10px 0' };
const code = { color: '#34A853', fontSize: '32px', fontWeight: 'bold', letterSpacing: '8px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#34A853', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
