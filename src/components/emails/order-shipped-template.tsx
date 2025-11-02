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

interface OrderShippedEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  trackingUrl: string;
}

export const OrderShippedEmail = ({
  customerName = 'Valued Customer',
  orderNumber = '#AF12345',
  trackingNumber = 'TRACK123456',
  carrier = 'Royal Mail',
  estimatedDelivery = 'Tomorrow',
  trackingUrl = '',
}: OrderShippedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your order {orderNumber} has shipped!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📦 Your Order is On Its Way!</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Great news! Your order has been shipped and is on its way to you.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}><strong>Order Number:</strong> {orderNumber}</Text>
          <Text style={infoText}><strong>Tracking Number:</strong> {trackingNumber}</Text>
          <Text style={infoText}><strong>Carrier:</strong> {carrier}</Text>
          <Text style={infoText}><strong>Estimated Delivery:</strong> {estimatedDelivery}</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={trackingUrl}>
            Track Your Package
          </Button>
        </Section>

        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderShippedEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#F4B400', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const infoBox = { backgroundColor: '#F4F4F5', borderRadius: '8px', padding: '20px', margin: '20px 40px' };
const infoText = { color: '#2C2A4A', fontSize: '14px', margin: '8px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#F4B400', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
