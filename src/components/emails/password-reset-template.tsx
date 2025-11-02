// Password Reset Template
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiryMinutes?: number;
}

export const PasswordResetEmail = ({ userName = 'User', resetUrl = '', expiryMinutes = 15 }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your AfriConnect password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔐 Reset Your Password</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>We received a request to reset your password. Click the button below to create a new password:</Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>Reset Password</Button>
        </Section>
        <Text style={warningText}>This link expires in {expiryMinutes} minutes. If you didn't request this, please ignore this email.</Text>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1 = { color: '#2C2A4A', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#0072CE', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' };
const warningText = { color: '#EA4335', fontSize: '14px', margin: '20px 40px', textAlign: 'center' as const };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
