// New Order Alert for Seller
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Row, Column } from '@react-email/components';

interface NewOrderAlertEmailProps {
  sellerName: string;
  orderNumber: string;
  buyerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  orderUrl: string;
}

export const NewOrderAlertEmail = ({ sellerName = 'Seller', orderNumber = '#AF12345', buyerName = 'Customer', items = [], total = 0, orderUrl = '' }: NewOrderAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>New order {orderNumber} received!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 New Order Received!</Heading>
        <Text style={text}>Hi {sellerName},</Text>
        <Text style={text}>You have received a new order from {buyerName}.</Text>
        <Section style={orderBox}>
          <Text style={orderLabel}>Order #{orderNumber}</Text>
          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Column style={{ width: '70%' }}><Text style={itemName}>{item.name} (x{item.quantity})</Text></Column>
              <Column style={{ width: '30%', textAlign: 'right' }}><Text style={itemPrice}>£{item.price.toFixed(2)}</Text></Column>
            </Row>
          ))}
          <Text style={totalText}>Total: £{total.toFixed(2)}</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={orderUrl}>View & Process Order</Button>
        </Section>
        <Text style={urgentText}>⏰ Please process this order within 24 hours to maintain your seller rating.</Text>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

export default NewOrderAlertEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1 = { color: '#34A853', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const orderBox = { backgroundColor: '#F4F4F5', borderRadius: '12px', padding: '30px', margin: '30px 40px' };
const orderLabel = { color: '#2C2A4A', fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' };
const itemRow = { margin: '10px 0' };
const itemName = { color: '#525252', fontSize: '14px', margin: '0' };
const itemPrice = { color: '#2C2A4A', fontSize: '14px', fontWeight: '600', margin: '0' };
const totalText = { color: '#34A853', fontSize: '20px', fontWeight: 'bold', margin: '20px 0 0 0', textAlign: 'right' as const };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#34A853', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const urgentText = { color: '#F4B400', fontSize: '14px', fontWeight: '600', margin: '20px 40px', textAlign: 'center' as const };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
