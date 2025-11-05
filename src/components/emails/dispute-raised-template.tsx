
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';

interface DisputeRaisedEmailProps {
  userName?: string;
  role?: 'buyer' | 'seller' | 'admin';
  orderNumber?: string;
  disputeId?: string;
  reason?: string;
  disputeUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const DisputeRaisedEmail = ({
  userName = 'User',
  role = 'buyer',
  orderNumber = '#AF12345',
  disputeId = 'DISP123',
  reason = 'Item not as described',
  disputeUrl = '#',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: DisputeRaisedEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Dispute raised for order ${orderNumber}`;

  const getHeading = () => {
    if (role === 'admin') return '⚠️ New Dispute Requires Attention';
    if (role === 'seller') return '⚠️ A Dispute Was Raised On Your Order';
    return 'Your Dispute Has Been Submitted';
  };

  const getMessage = () => {
    if (role === 'admin') return `A dispute has been raised for order ${orderNumber} and requires your attention.`;
    if (role === 'seller') return `A customer has raised a dispute for your order ${orderNumber}. Please review and respond promptly.`;
    return `Your dispute for order ${orderNumber} has been successfully submitted. Our support team will review it within 24-48 hours.`;
  };

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
                          <Heading style={h1}>{getHeading()}</Heading>
                          <Text style={text}>Hi {userName},</Text>
                          <Text style={text}>{getMessage()}</Text>
                          <Section style={disputeBox}>
                            <Text style={disputeLabel}>Dispute ID:</Text>
                            <Text style={disputeValue}>{disputeId}</Text>
                            <Text style={disputeLabel}>Order Number:</Text>
                            <Text style={disputeValue}>{orderNumber}</Text>
                            {reason && (
                              <>
                                <Text style={disputeLabel}>Reason:</Text>
                                <Text style={disputeReason}>"{reason}"</Text>
                              </>
                            )}
                          </Section>
                          <Section style={buttonContainer}>
                            <Button style={button} href={disputeUrl}>
                              {role === 'admin' ? 'Review Dispute' : 'View Dispute Details'}
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

export default DisputeRaisedEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#B91C1C', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const disputeBox = { backgroundColor: '#FEF2F2', borderRadius: '8px', padding: '20px', margin: '24px 0', border: '1px solid #FECACA' };
const disputeLabel = { color: '#7F1D1D', fontSize: '12px', margin: '0 0 4px', fontWeight: '600', textTransform: 'uppercase' as const };
const disputeValue = { color: '#7F1D1D', fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' };
const disputeReason = { color: '#374151', fontSize: '14px', margin: '0', fontStyle: 'italic' as const, borderLeft: '3px solid #F87171', paddingLeft: '12px' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#DC2626', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
