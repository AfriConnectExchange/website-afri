import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Button, Text } from '@react-email/components';

type Props = {
  name?: string;
  actionUrl?: string;
};

export default function WelcomeEmail({ name, actionUrl = 'https://app.africonnect.exchange/onboarding' }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to AfriConnect Exchange</Preview>
      <Body style={{ backgroundColor: '#f3f4f6', margin: 0, padding: 0 }}>
        <Container style={{ backgroundColor: '#ffffff', marginTop: 20, marginBottom: 20, borderRadius: 8, padding: 24 }}>
          <Section>
            <Text style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Welcome to AfriConnect Exchange</Text>
            <Text style={{ color: '#374151' }}>Hi {name || 'there'},</Text>
            <Text style={{ color: '#374151' }}>We're excited to have you on board. Complete your profile to discover opportunities on the marketplace.</Text>

            <Section style={{ textAlign: 'center', paddingTop: 16 }}>
              <Button
                href={actionUrl}
                style={{ backgroundColor: '#111827', color: '#fff', padding: '12px 20px', borderRadius: 6, textDecoration: 'none', display: 'inline-block' }}
              >
                Complete your profile
              </Button>
            </Section>

            <Text style={{ color: '#6b7280', marginTop: 20 }}>— The AfriConnect Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
