// KYC Status Template (Approved/Rejected)
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components';

interface KYCStatusEmailProps {
  userName: string;
  status: 'approved' | 'rejected';
  reason?: string;
  resubmitUrl?: string;
}

export const KYCStatusEmail = ({ userName = 'User', status = 'approved', reason = '', resubmitUrl = '' }: KYCStatusEmailProps) => (
  <Html>
    <Head />
    <Preview>Your KYC verification {status === 'approved' ? 'has been approved' : 'requires attention'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={status === 'approved' ? h1Approved : h1Rejected}>
          {status === 'approved' ? '✓ KYC Approved!' : '⚠️ KYC Verification Update'}
        </Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>
          {status === 'approved' 
            ? 'Your KYC verification has been approved! You now have full access to all AfriConnect features.'
            : 'We were unable to verify your KYC documents at this time.'}
        </Text>
        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonLabel}>Reason:</Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>
        )}
        {status === 'approved' ? (
          <Section style={buttonContainer}>
            <Button style={buttonApproved} href="https://africonnect.com/marketplace">Start Selling</Button>
          </Section>
        ) : (
          <Section style={buttonContainer}>
            <Button style={buttonRejected} href={resubmitUrl}>Resubmit Documents</Button>
          </Section>
        )}
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

export default KYCStatusEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1Approved = { color: '#34A853', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const h1Rejected = { color: '#EA4335', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const reasonBox = { backgroundColor: '#FEE', borderRadius: '8px', padding: '20px', margin: '20px 40px', border: '1px solid #EA4335' };
const reasonLabel = { color: '#EA4335', fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' };
const reasonText = { color: '#525252', fontSize: '14px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const buttonApproved = { backgroundColor: '#34A853', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const buttonRejected = { backgroundColor: '#EA4335', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
