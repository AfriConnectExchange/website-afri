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
  Row,
  Column,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: {
    street: string;
    city: string;
    postcode: string;
  };
  trackingUrl: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Valued Customer',
  orderNumber = '#AF12345',
  orderDate = new Date().toLocaleDateString(),
  items = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  deliveryAddress = { street: '', city: '', postcode: '' },
  trackingUrl = '',
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your AfriConnect order {orderNumber} is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Order Confirmed! 🎉</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Thank you for your order! We've received your purchase and it's being prepared for shipment.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}><strong>Order Number:</strong> {orderNumber}</Text>
          <Text style={infoText}><strong>Order Date:</strong> {orderDate}</Text>
        </Section>

        <Heading style={h2}>Order Details</Heading>
        
        {items.map((item, index) => (
          <Section key={index} style={itemRow}>
            <Row>
              <Column style={{ width: '60%' }}>
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemQty}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={{ width: '40%', textAlign: 'right' }}>
                <Text style={itemPrice}>£{item.price.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>
        ))}

        <Hr style={hr} />

        <Section style={totalsSection}>
          <Row>
            <Column style={{ width: '70%' }}><Text style={totalsLabel}>Subtotal:</Text></Column>
            <Column style={{ width: '30%', textAlign: 'right' }}><Text style={totalsValue}>£{subtotal.toFixed(2)}</Text></Column>
          </Row>
          <Row>
            <Column style={{ width: '70%' }}><Text style={totalsLabel}>Delivery:</Text></Column>
            <Column style={{ width: '30%', textAlign: 'right' }}><Text style={totalsValue}>£{deliveryFee.toFixed(2)}</Text></Column>
          </Row>
          <Row>
            <Column style={{ width: '70%' }}><Text style={totalsLabelBold}>Total:</Text></Column>
            <Column style={{ width: '30%', textAlign: 'right' }}><Text style={totalsValueBold}>£{total.toFixed(2)}</Text></Column>
          </Row>
        </Section>

        <Hr style={hr} />

        <Heading style={h2}>Delivery Address</Heading>
        <Section style={addressBox}>
          <Text style={addressText}>{deliveryAddress.street}</Text>
          <Text style={addressText}>{deliveryAddress.city}</Text>
          <Text style={addressText}>{deliveryAddress.postcode}</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={trackingUrl}>
            Track Your Order
          </Button>
        </Section>

        <Text style={footer}>
          Questions? Contact us at support@africonnect-exchange.org
        </Text>
        
        <Text style={footer}>
          © {new Date().getFullYear()} AfriConnect. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmationEmail;

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
  color: '#0072CE',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#2C2A4A',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 40px 15px',
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 40px',
};

const infoBox = {
  backgroundColor: '#F4F4F5',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
};

const infoText = {
  color: '#2C2A4A',
  fontSize: '14px',
  margin: '8px 0',
};

const itemRow = {
  margin: '15px 40px',
  padding: '15px 0',
  borderBottom: '1px solid #E4E4E7',
};

const itemName = {
  color: '#2C2A4A',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const itemQty = {
  color: '#71717A',
  fontSize: '14px',
  margin: '0',
};

const itemPrice = {
  color: '#2C2A4A',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const hr = {
  borderColor: '#E4E4E7',
  margin: '30px 40px',
};

const totalsSection = {
  margin: '20px 40px',
};

const totalsLabel = {
  color: '#71717A',
  fontSize: '14px',
  margin: '8px 0',
};

const totalsValue = {
  color: '#2C2A4A',
  fontSize: '14px',
  margin: '8px 0',
};

const totalsLabelBold = {
  color: '#2C2A4A',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '15px 0 8px 0',
};

const totalsValueBold = {
  color: '#0072CE',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '15px 0 8px 0',
};

const addressBox = {
  backgroundColor: '#F4F4F5',
  borderRadius: '8px',
  padding: '20px',
  margin: '15px 40px',
};

const addressText = {
  color: '#2C2A4A',
  fontSize: '14px',
  margin: '4px 0',
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
