// Advert Expired Template
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from '@react-email/components';

interface AdvertExpiredEmailProps {
  sellerName: string;
  advertTitle: string;
  expiryDate: string;
  renewUrl: string;
}

export const AdvertExpiredEmail = ({ sellerName = 'Seller', advertTitle = 'Your Advert', expiryDate = '', renewUrl = '' }: AdvertExpiredEmailProps) => (
  <Html>
    <Head />
    <Preview>Your advert "{advertTitle}" has expired</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Advert Expired</Heading>
        <Text style={text}>Hi {sellerName},</Text>
        <Text style={text}>Your advert has reached its expiration date and is no longer visible to customers.</Text>
        <Section style={advertBox}>
          <Text style={advertTitle}>{advertTitle}</Text>
          <Text style={expiryText}>Expired on: {expiryDate}</Text>
        </Section>
        <Text style={text}>Want to reach more customers? Renew your advert now!</Text>
        <Section style={buttonContainer}>
          <Button style={button} href={renewUrl}>Renew Advert</Button>
        </Section>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

export default AdvertExpiredEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1 = { color: '#EA4335', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const advertBox = { backgroundColor: '#FEE', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const, border: '2px solid #EA4335' };
const advertTitle = { color: '#2C2A4A', fontSize: '20px', fontWeight: 'bold', margin: '0 0 15px 0' };
const expiryText = { color: '#EA4335', fontSize: '14px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#F4B400', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
