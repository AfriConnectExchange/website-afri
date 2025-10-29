import * as React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Img } from '@react-email/components';

interface Props { userName?: string }

export const DeletionCompleteEmail = ({ userName = 'User' }: Props) => {
  const preview = `Your account has been permanently deleted`;
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif', margin: 0, padding: '30px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', maxWidth: '600px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)'}}>
          <Section style={{ textAlign: 'center', padding: '30px 0 20px' }}>
            <Img src="https://fkwcbvackexaqwlbecaz.supabase.co/storage/v1/object/public/assets/ae-logo.png" width={140} alt="logo" />
          </Section>
          <Section style={{ padding: '0 40px' }}>
            <Heading as="h1" style={{ color: '#222', fontSize: 20, textAlign: 'center', marginBottom: 12 }}>Account Deleted</Heading>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: '24px', textAlign: 'center' }}>Hi {userName},</Text>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: '24px', textAlign: 'center', marginTop: 12 }}>Your account and all associated data have been permanently deleted from our systems. If you believe this was done in error, please contact support.</Text>
          </Section>
          <Hr style={{ borderColor: '#e6ebf1', margin: '0 40px' }} />
          <Section style={{ padding: '16px 40px 30px', textAlign: 'center' }}>
            <Text style={{ color: '#8898aa', fontSize: 11 }}>© {new Date().getFullYear()} AfriConnect Exchange. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DeletionCompleteEmail;
