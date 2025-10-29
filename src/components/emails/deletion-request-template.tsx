import * as React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Button, Hr, Img } from '@react-email/components';

interface Props { userName?: string; scheduledAt?: string }

export const DeletionRequestEmail = ({ userName = 'User', scheduledAt }: Props) => {
  const preview = `Your account deletion is scheduled for ${scheduledAt}`;
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
            <Heading as="h1" style={{ color: '#222', fontSize: 20, textAlign: 'center', marginBottom: 12 }}>Account Deletion Scheduled</Heading>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: '24px', textAlign: 'center' }}>Hi {userName},</Text>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: '24px', textAlign: 'center', marginTop: 12 }}>We received a request to delete your account. Your account is scheduled for permanent deletion on <strong>{scheduledAt}</strong>. If you did not request this, or you would like to cancel, please sign in and cancel the request within 24 hours.</Text>
          </Section>
          <Section style={{ textAlign: 'center', padding: '24px 40px 0' }}>
            <Button href="__PROFILE_CANCEL_URL__" style={{ backgroundColor: '#e00707', color: '#fff', borderRadius: 5, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Cancel Deletion</Button>
          </Section>
          <Section style={{ padding: '24px 40px' }}>
            <Text style={{ color: '#555', fontSize: 14, lineHeight: '22px', textAlign: 'center' }}>If you need help, visit our <a href="/help" style={{ color: '#e00707' }}>Help Center</a> or contact support.</Text>
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

export default DeletionRequestEmail;
