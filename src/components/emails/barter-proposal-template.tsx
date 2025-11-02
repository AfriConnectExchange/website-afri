// Barter Proposal Email
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components';

interface BarterProposalEmailProps {
  recipientName: string;
  proposerName: string;
  productOffered: string;
  productRequested: string;
  estimatedValue: number;
  description: string;
  proposalUrl: string;
  expiryDate: string;
}

export const BarterProposalEmail = ({
  recipientName = 'Seller',
  proposerName = 'User',
  productOffered = 'Product',
  productRequested = 'Your Item',
  estimatedValue = 0,
  description = '',
  proposalUrl = '',
  expiryDate = '',
}: BarterProposalEmailProps) => (
  <Html>
    <Head />
    <Preview>{proposerName} wants to barter for {productRequested}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔄 New Barter Proposal!</Heading>
        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>{proposerName} has proposed a barter trade for your item "{productRequested}".</Text>
        <Section style={offerBox}>
          <Text style={offerLabel}>They're Offering:</Text>
          <Text style={offerValue}>{productOffered}</Text>
          <Text style={offerLabel}>Estimated Value:</Text>
          <Text style={offerPrice}>£{estimatedValue.toFixed(2)}</Text>
          {description && <Text style={offerDesc}>{description}</Text>}
          <Text style={expiryText}>⏰ Expires: {expiryDate}</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={acceptButton} href={proposalUrl}>Accept Proposal</Button>
          <Button style={viewButton} href={proposalUrl}>View Details</Button>
        </Section>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
);

export default BarterProposalEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#F4B400', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const offerBox = { backgroundColor: '#FFF9E6', borderRadius: '12px', padding: '30px', margin: '30px 40px', border: '2px solid #F4B400' };
const offerLabel = { color: '#71717A', fontSize: '12px', margin: '15px 0 5px 0', textTransform: 'uppercase' as const };
const offerValue = { color: '#2C2A4A', fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' };
const offerPrice = { color: '#F4B400', fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' };
const offerDesc = { color: '#525252', fontSize: '14px', margin: '15px 0', fontStyle: 'italic' as const };
const expiryText = { color: '#EA4335', fontSize: '14px', margin: '15px 0 0 0', fontWeight: '600' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const acceptButton = { backgroundColor: '#34A853', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px', margin: '0 5px' };
const viewButton = { backgroundColor: '#0072CE', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px', margin: '0 5px' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
