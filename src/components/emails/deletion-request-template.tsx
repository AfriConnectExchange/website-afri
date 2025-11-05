
import * as React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Button, Img, Hr } from '@react-email/components';

interface DeletionRequestEmailProps {
  userName?: string;
  scheduledAt?: string;
  cancelUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const DeletionRequestEmail = ({
  userName = 'User',
  scheduledAt = '24 hours',
  cancelUrl = '#',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: DeletionRequestEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Your account deletion is scheduled`;

  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ background: "#f7f7f7", width: "100%" }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "28px 16px" }}>
                <Container style={container}>
                  <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ background: "#ffffff", borderRadius: 10, overflow: "hidden", border: "1px solid #e6e6e9" }}>
                    <tbody>
                      {/* Header */}
                      <tr>
                        <td style={{ padding: "18px 20px", borderBottom: "1px solid #f0f0f2" }}>
                           <a href={homeUrl} style={{ textDecoration: 'none', display: 'inline-block' }}>
                             <span style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 700, fontSize: 16, color: '#000000' }}>
                               AFRICONNECT<span style={{ color: '#F4B400' }}> EXCHANGE</span>
                             </span>
                           </a>
                        </td>
                      </tr>
                      {/* Content */}
                      <tr>
                        <td style={{ padding: "28px 28px 8px 28px" }}>
                          <Heading style={h1}>Account Deletion Scheduled</Heading>
                          <Text style={text}>Hi {userName},</Text>
                          <Text style={text}>We received a request to delete your account. Your account is scheduled for permanent deletion on <strong>{scheduledAt}</strong>.</Text>
                          <Text style={text}>If you did not request this, or if you've changed your mind, you can cancel this process by clicking the button below.</Text>
                          <Section style={buttonContainer}>
                            <Button style={button} href={cancelUrl}>Cancel Deletion Request</Button>
                          </Section>
                        </td>
                      </tr>
                      {/* Footer */}
                      <tr>
                        <td style={{ background: "#2C2A4A", padding: "20px 28px", color: "#ffffff" }}>
                          <p style={{ margin: 0, fontSize: 12, color: "#bfc0c9" }}>© {year} {appName}. All rights reserved.</p>
                          <a href={`mailto:${supportEmail}`} style={{ color: "#F4B400", textDecoration: "none", fontSize: 12 }}>{supportEmail}</a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
};

export default DeletionRequestEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#B91C1C', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#DC2626', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
