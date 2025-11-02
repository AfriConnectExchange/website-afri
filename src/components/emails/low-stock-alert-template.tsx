// Low Stock Alert for Seller
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components';

interface LowStockAlertEmailProps {
  sellerName: string;
  productName: string;
  currentStock: number;
  productUrl: string;
}

export const LowStockAlertEmail = ({ sellerName = 'Seller', productName = 'Product', currentStock = 0, productUrl = '' }: LowStockAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>Low stock alert: {productName} has only {currentStock} units left</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ Low Stock Alert</Heading>
        <Text style={text}>Hi {sellerName},</Text>
        <Text style={text}>Your product is running low on stock and needs attention.</Text>
        <Section style={alertBox}>
          <Text style={productLabel}>{productName}</Text>
          <Text style={stockText}>{currentStock} units remaining</Text>
        </Section>
        <Text style={warningText}>Restock soon to avoid missing out on sales!</Text>
        <Section style={buttonContainer}>
          <Button style={button} href={productUrl}>Update Inventory</Button>
        </Section>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

export default LowStockAlertEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1 = { color: '#F4B400', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const alertBox = { backgroundColor: '#FFF9E6', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const, border: '2px solid #F4B400' };
const productLabel = { color: '#2C2A4A', fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' };
const stockText = { color: '#EA4335', fontSize: '28px', fontWeight: 'bold', margin: '0' };
const warningText = { color: '#F4B400', fontSize: '16px', fontWeight: '600', margin: '20px 40px', textAlign: 'center' as const };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#F4B400', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
