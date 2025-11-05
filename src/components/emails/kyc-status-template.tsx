
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';

interface KYCStatusEmailProps {
  userName?: string;
  status: 'approved' | 'rejected';
  reason?: string;
  resubmitUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const KYCStatusEmail = ({
  userName = 'User',
  status,
  reason = '',
  resubmitUrl = '#',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: KYCStatusEmailProps) => {
  const year = new Date().getFullYear();
  const isApproved = status === 'approved';
  const previewText = `Your KYC verification has been ${status}`;

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
                          <Heading style={isApproved ? h1Approved : h1Rejected}>
                            {isApproved ? '✓ KYC Approved!' : '⚠️ KYC Verification Update'}
                          </Heading>
                          <Text style={text}>Hi {userName},</Text>
                          <Text style={text}>
                            {isApproved 
                              ? 'Your identity verification has been successfully approved! You can now access all seller features on the platform.'
                              : 'We were unable to approve your KYC submission at this time. Please see the details below.'}
                          </Text>
                          {!isApproved && reason && (
                            <Section style={reasonBox}>
                              <Text style={reasonLabel}>Reason for Rejection:</Text>
                              <Text style={reasonText}>"{reason}"</Text>
                            </Section>
                          )}
                          <Section style={buttonContainer}>
                            <Button style={isApproved ? buttonApproved : buttonRejected} href={isApproved ? `${homeUrl}/seller/products` : resubmitUrl}>
                              {isApproved ? 'Start Selling Now' : 'Resubmit Documents'}
                            </Button>
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

export default KYCStatusEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1Approved = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#16A34A', lineHeight: 1.2 };
const h1Rejected = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#B91C1C', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const reasonBox = { backgroundColor: '#FEF2F2', borderRadius: '8px', padding: '20px', margin: '24px 0', border: '1px solid #FECACA' };
const reasonLabel = { color: '#991B1B', fontSize: '12px', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase' as const };
const reasonText = { color: '#B91C1C', fontSize: '14px', margin: '0', fontStyle: 'italic' as const };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const buttonApproved = { backgroundColor: '#22C55E', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
const buttonRejected = { backgroundColor: '#DC2626', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
