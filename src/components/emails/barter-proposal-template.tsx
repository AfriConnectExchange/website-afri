
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';

interface BarterProposalEmailProps {
  recipientName?: string;
  proposerName?: string;
  productOffered?: string;
  productRequested?: string;
  estimatedValue?: number;
  description?: string;
  proposalUrl?: string;
  expiryDate?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const BarterProposalEmail = ({
  recipientName = 'Seller',
  proposerName = 'User',
  productOffered = 'An Interesting Item',
  productRequested = 'Your Product',
  estimatedValue = 0,
  description = '',
  proposalUrl = '#',
  expiryDate = new Date().toLocaleDateString(),
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: BarterProposalEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `${proposerName} wants to barter for ${productRequested}`;

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
                          <Heading style={h1}>🔄 New Barter Proposal!</Heading>
                          <Text style={text}>Hi {recipientName},</Text>
                          <Text style={text}>{proposerName} has proposed a trade for your item, "{productRequested}".</Text>
                          <Section style={offerBox}>
                            <Text style={offerLabel}>Their Offer:</Text>
                            <Text style={offerValue}>{productOffered}</Text>
                            {description && <Text style={offerDesc}>"{description}"</Text>}
                            <Text style={offerLabel}>Estimated Value:</Text>
                            <Text style={offerPrice}>~£{estimatedValue.toFixed(2)}</Text>
                            <Text style={expiryText}>This proposal expires on: {expiryDate}</Text>
                          </Section>
                          <Section style={buttonContainer}>
                            <Button style={button} href={proposalUrl}>View & Respond</Button>
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

export default BarterProposalEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#0072CE', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const offerBox = { backgroundColor: '#F0F9FF', borderRadius: '8px', padding: '20px', margin: '24px 0', border: '1px solid #BAE6FD' };
const offerLabel = { color: '#0369A1', fontSize: '12px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' as const };
const offerValue = { color: '#0C4A6E', fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0' };
const offerDesc = { color: '#374151', fontSize: '14px', margin: '0 0 12px', fontStyle: 'italic' as const, borderLeft: '3px solid #BAE6FD', paddingLeft: '12px' };
const offerPrice = { color: '#0C4A6E', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' };
const expiryText = { color: '#71717A', fontSize: '12px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#0072CE', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
