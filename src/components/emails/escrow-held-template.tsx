import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';

interface EscrowHeldEmailProps {
  customerName: string;
  sellerName: string;
  orderNumber: string;
  amount: number;
  escrowId: string;
  releaseDate: string;
}

export const EscrowHeldEmail = ({
  customerName = 'Valued Customer',
  sellerName = 'Seller',
  orderNumber = '#AF12345',
  amount = 0,
  escrowId = 'ESC123',
  releaseDate = '',
}: EscrowHeldEmailProps) => (
  <Html>
    <Head />
    <Preview>Your payment of £{amount.toFixed(2)} is securely held in escrow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔒 Payment Secured in Escrow</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Your payment has been securely held in escrow. The funds will be released to {sellerName} once you confirm delivery.
        </Text>

        <Section style={escrowBox}>
          <Text style={escrowLabel}>Escrow ID:</Text>
          <Text style={escrowValue}>{escrowId}</Text>
          <Text style={escrowLabel}>Amount Held:</Text>
          <Text style={escrowAmount}>£{amount.toFixed(2)}</Text>
          <Text style={escrowLabel}>Auto-Release Date:</Text>
          <Text style={escrowValue}>{releaseDate}</Text>
        </Section>

        <Section style={infoBox}>
          <Text style={infoTitle}>How Escrow Works:</Text>
          <Text style={infoText}>✓ Your payment is safely held until delivery</Text>
          <Text style={infoText}>✓ Confirm delivery to release funds to seller</Text>
          <Text style={infoText}>✓ Funds auto-release 7 days after delivery if no issues</Text>
          <Text style={infoText}>✓ Open a dispute if there's a problem</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={`https://africonnect.com/orders/${orderNumber}`}>
            View Order Status
          </Button>
        </Section>

        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EscrowHeldEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#0072CE', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const escrowBox = { backgroundColor: '#E6F2FF', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const, border: '2px solid #0072CE' };
const escrowLabel = { color: '#71717A', fontSize: '12px', margin: '15px 0 5px 0', textTransform: 'uppercase' as const };
const escrowValue = { color: '#2C2A4A', fontSize: '16px', fontWeight: '600', margin: '0' };
const escrowAmount = { color: '#0072CE', fontSize: '32px', fontWeight: 'bold', margin: '0' };
const infoBox = { backgroundColor: '#F4F4F5', borderRadius: '8px', padding: '20px', margin: '20px 40px' };
const infoTitle = { color: '#2C2A4A', fontSize: '16px', fontWeight: 'bold', margin: '0 0 15px 0' };
const infoText = { color: '#525252', fontSize: '14px', margin: '8px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#0072CE', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
