import React from 'react';
import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Text } from '@react-email/text';
import { Button } from '@react-email/button';

export const ReactivationRequestEmail = ({ userEmail }: { userEmail: string }) => {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: 8 }}>
          <Section>
            <Text style={{ fontSize: 20, fontWeight: 700 }}>We received your reactivation request</Text>
            <Text style={{ marginTop: 12 }}>Hello {userEmail},</Text>
            <Text style={{ marginTop: 12 }}>Thanks — we received your request to reactivate your account. Our team will review the request and reply by email.</Text>
            <Text style={{ marginTop: 12 }}>If you submitted this by mistake, you can ignore this message.</Text>
            <Section style={{ marginTop: 16 }}>
              <Button href="/" style={{ backgroundColor: '#0b5cff' }}>Open Afri</Button>
            </Section>
            <Text style={{ marginTop: 16, color: '#666', fontSize: 12 }}>If you need faster help, reply to this email or contact support.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ReactivationRequestEmail;
