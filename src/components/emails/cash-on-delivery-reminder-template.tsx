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
} from '@react-email/components';

interface CashOnDeliveryReminderEmailProps {
  customerName: string;
  orderNumber: string;
  amount: number;
  deliveryDate: string;
  deliveryAddress: string;
}

export const CashOnDeliveryReminderEmail = ({
  customerName = 'Valued Customer',
  orderNumber = '#AF12345',
  amount = 0,
  deliveryDate = 'Tomorrow',
  deliveryAddress = '',
}: CashOnDeliveryReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Prepare £{amount.toFixed(2)} cash for delivery tomorrow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💷 Cash on Delivery Reminder</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Your order <strong>{orderNumber}</strong> will be delivered on <strong>{deliveryDate}</strong>.
        </Text>

        <Section style={cashBox}>
          <Text style={cashAmount}>£{amount.toFixed(2)}</Text>
          <Text style={cashLabel}>Amount to Prepare</Text>
        </Section>

        <Text style={text}>
          Please have exact cash ready for the delivery driver at:
        </Text>

        <Section style={addressBox}>
          <Text style={addressText}>{deliveryAddress}</Text>
        </Section>

        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CashOnDeliveryReminderEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#F4B400', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const cashBox = { backgroundColor: '#FFF9E6', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const, border: '2px solid #F4B400' };
const cashAmount = { color: '#F4B400', fontSize: '48px', fontWeight: 'bold', margin: '0' };
const cashLabel = { color: '#2C2A4A', fontSize: '16px', margin: '10px 0 0 0' };
const addressBox = { backgroundColor: '#F4F4F5', borderRadius: '8px', padding: '20px', margin: '15px 40px' };
const addressText = { color: '#2C2A4A', fontSize: '14px', margin: '4px 0' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
