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
  Hr,
} from '@react-email/components';

interface PaymentReceiptEmailProps {
  customerName: string;
  transactionId: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  orderNumber: string;
  last4?: string;
  cardType?: string;
}

export const PaymentReceiptEmail = ({
  customerName = 'Valued Customer',
  transactionId = 'TXN123456',
  paymentDate = new Date().toLocaleDateString(),
  paymentMethod = 'Card',
  amount = 0,
  orderNumber = '#AF12345',
  last4 = '4242',
  cardType = 'Visa',
}: PaymentReceiptEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment receipt for {orderNumber} - £{amount.toFixed(2)}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Confirmed ✓</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Your payment has been successfully processed. Thank you for your purchase!
        </Text>

        <Section style={receiptBox}>
          <Heading style={receiptTitle}>Receipt</Heading>
          
          <Section style={receiptRow}>
            <Text style={receiptLabel}>Transaction ID:</Text>
            <Text style={receiptValue}>{transactionId}</Text>
          </Section>
          
          <Section style={receiptRow}>
            <Text style={receiptLabel}>Date:</Text>
            <Text style={receiptValue}>{paymentDate}</Text>
          </Section>
          
          <Section style={receiptRow}>
            <Text style={receiptLabel}>Order Number:</Text>
            <Text style={receiptValue}>{orderNumber}</Text>
          </Section>
          
          <Section style={receiptRow}>
            <Text style={receiptLabel}>Payment Method:</Text>
            <Text style={receiptValue}>
              {paymentMethod === 'card' ? `${cardType} ending in ${last4}` : paymentMethod}
            </Text>
          </Section>
          
          <Hr style={hr} />
          
          <Section style={receiptRow}>
            <Text style={totalLabel}>Total Paid:</Text>
            <Text style={totalValue}>£{amount.toFixed(2)}</Text>
          </Section>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={`https://africonnect.com/orders/${orderNumber}`}>
            View Order Details
          </Button>
        </Section>

        <Text style={footer}>
          Keep this receipt for your records. If you have any questions, contact us at support@africonnect-exchange.org
        </Text>
        
        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentReceiptEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#34A853',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 40px',
};

const receiptBox = {
  backgroundColor: '#F4F4F5',
  borderRadius: '12px',
  padding: '30px',
  margin: '30px 40px',
  border: '2px solid #E4E4E7',
};

const receiptTitle = {
  color: '#2C2A4A',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const receiptRow = {
  margin: '12px 0',
};

const receiptLabel = {
  color: '#71717A',
  fontSize: '14px',
  margin: '0 0 4px 0',
};

const receiptValue = {
  color: '#2C2A4A',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const hr = {
  borderColor: '#E4E4E7',
  margin: '20px 0',
};

const totalLabel = {
  color: '#2C2A4A',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const totalValue = {
  color: '#34A853',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 40px',
};

const button = {
  backgroundColor: '#0072CE',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const footer = {
  color: '#71717A',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '20px 40px',
  textAlign: 'center' as const,
};
