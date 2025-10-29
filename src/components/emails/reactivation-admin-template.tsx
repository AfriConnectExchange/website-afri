import React from 'react';
import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Text } from '@react-email/text';
import { Button } from '@react-email/button';

export const AdminReactivationNotifyEmail = ({ userEmail, message }: { userEmail: string; message: string }) => {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: 8 }}>
          <Section>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>New reactivation request</Text>
            <Text style={{ marginTop: 12 }}>Email: {userEmail}</Text>
            {message ? <Text style={{ marginTop: 8 }}>Message: {message}</Text> : null}
            <Section style={{ marginTop: 16 }}>
              <Button href="/admin/users" style={{ backgroundColor: '#0b5cff' }}>Open Admin</Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminReactivationNotifyEmail;
