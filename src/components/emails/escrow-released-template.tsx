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

interface EscrowReleasedEmailProps {
  sellerName: string;
  orderNumber: string;
  amount: number;
  buyerName: string;
  releaseDate: string;
}

export const EscrowReleasedEmail = ({
  sellerName = 'Seller',
  orderNumber = '#AF12345',
  amount = 0,
  buyerName = 'Customer',
  releaseDate = new Date().toLocaleDateString(),
}: EscrowReleasedEmailProps) => (
  <Html>
    <Head />
    <Preview>£{amount.toFixed(2)} released from escrow for order {orderNumber}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💰 Funds Released!</Heading>
        
        <Text style={text}>Hi {sellerName},</Text>
        
        <Text style={text}>
          Great news! The escrow funds for order <strong>{orderNumber}</strong> have been released to your account.
        </Text>

        <Section style={amountBox}>
          <Text style={amountLabel}>Amount Released:</Text>
          <Text style={amount}>£{amount.toFixed(2)}</Text>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}><strong>Order Number:</strong> {orderNumber}</Text>
          <Text style={infoText}><strong>Buyer:</strong> {buyerName}</Text>
          <Text style={infoText}><strong>Release Date:</strong> {releaseDate}</Text>
        </Section>

        <Text style={text}>
          The funds should appear in your account within 2-5 business days.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://africonnect.com/vendor/transactions">
            View Transaction History
          </Button>
        </Section>

        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EscrowReleasedEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#34A853', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const amountBox = { backgroundColor: '#E8F5E9', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const, border: '2px solid #34A853' };
const amountLabel = { color: '#71717A', fontSize: '14px', margin: '0 0 10px 0', textTransform: 'uppercase' as const };
const amount = { color: '#34A853', fontSize: '48px', fontWeight: 'bold', margin: '0' };
const infoBox = { backgroundColor: '#F4F4F5', borderRadius: '8px', padding: '20px', margin: '20px 40px' };
const infoText = { color: '#2C2A4A', fontSize: '14px', margin: '8px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#34A853', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
