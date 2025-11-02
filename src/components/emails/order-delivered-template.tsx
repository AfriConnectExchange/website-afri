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

interface OrderDeliveredEmailProps {
  customerName: string;
  orderNumber: string;
  deliveryDate: string;
  reviewUrl: string;
}

export const OrderDeliveredEmail = ({
  customerName = 'Valued Customer',
  orderNumber = '#AF12345',
  deliveryDate = new Date().toLocaleDateString(),
  reviewUrl = '',
}: OrderDeliveredEmailProps) => (
  <Html>
    <Head />
    <Preview>Your order {orderNumber} has been delivered!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✓ Order Delivered Successfully!</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Your order <strong>{orderNumber}</strong> was delivered on {deliveryDate}.
        </Text>

        <Text style={text}>
          We hope you love your purchase! Please take a moment to share your experience.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={reviewUrl}>
            Leave a Review
          </Button>
        </Section>

        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderDeliveredEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#34A853', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#F4B400', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
