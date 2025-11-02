// Review Request Template
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Row, Column } from '@react-email/components';

interface ReviewRequestEmailProps {
  customerName: string;
  productName: string;
  orderNumber: string;
  reviewUrl: string;
}

export const ReviewRequestEmail = ({ customerName = 'Customer', productName = 'Product', orderNumber = '#AF12345', reviewUrl = '' }: ReviewRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>How was your experience with {productName}?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⭐ Share Your Experience</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>We hope you're enjoying your recent purchase! Your feedback helps other shoppers make informed decisions.</Text>
        <Section style={productBox}>
          <Text style={productLabel}>{productName}</Text>
          <Text style={orderLabel}>Order: {orderNumber}</Text>
        </Section>
        <Text style={ratingPrompt}>How would you rate this product?</Text>
        <Section style={starsContainer}>
          <Text style={stars}>★ ★ ★ ★ ★</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={reviewUrl}>Write a Review</Button>
        </Section>
        <Text style={footer}>© {new Date().getFullYear()} AfriConnect.</Text>
      </Container>
    </Body>
  </Html>
);

export default ReviewRequestEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const h1 = { color: '#F4B400', fontSize: '28px', fontWeight: 'bold', margin: '40px 40px 20px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const productBox = { backgroundColor: '#F4F4F5', borderRadius: '12px', padding: '30px', margin: '30px 40px', textAlign: 'center' as const };
const productLabel = { color: '#2C2A4A', fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' };
const orderLabel = { color: '#71717A', fontSize: '14px', margin: '0' };
const ratingPrompt = { color: '#2C2A4A', fontSize: '18px', fontWeight: '600', margin: '30px 40px 10px', textAlign: 'center' as const };
const starsContainer = { textAlign: 'center' as const, margin: '10px 40px 30px' };
const stars = { color: '#F4B400', fontSize: '36px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#F4B400', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', margin: '20px 40px', textAlign: 'center' as const };
