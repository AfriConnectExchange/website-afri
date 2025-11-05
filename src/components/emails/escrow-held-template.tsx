
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';

interface EscrowHeldEmailProps {
  customerName?: string;
  sellerName?: string;
  orderNumber?: string;
  amount?: number;
  escrowId?: string;
  releaseDate?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const EscrowHeldEmail = ({
  customerName = 'Customer',
  sellerName = 'the seller',
  orderNumber = '#AF12345',
  amount = 0,
  escrowId = 'ESC123',
  releaseDate = new Date().toLocaleDateString(),
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: EscrowHeldEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Your payment of £${amount.toFixed(2)} is securely held in escrow`;

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
                          <Heading style={h1}>🔒 Payment Secured in Escrow</Heading>
                          <Text style={text}>Hi {customerName},</Text>
                          <Text style={text}>Your payment for order <strong>{orderNumber}</strong> has been securely held in escrow. The funds will be released to {sellerName} after you confirm successful delivery.</Text>
                          <Section style={escrowBox}>
                            <Text style={escrowLabel}>Amount Held:</Text>
                            <Text style={escrowAmount}>£{amount.toFixed(2)}</Text>
                            <Hr style={{ borderColor: '#93C5FD', margin: '16px 0' }} />
                            <Text style={infoText}><strong>Escrow ID:</strong> {escrowId}</Text>
                            <Text style={infoText}><strong>Auto-Release Date:</strong> {releaseDate}</Text>
                          </Section>
                          <Text style={text}>You can track your order and confirm delivery from your account.</Text>
                          <Section style={buttonContainer}>
                            <Button style={button} href={`${homeUrl}/orders/${orderNumber}`}>View Order Status</Button>
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

export default EscrowHeldEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#2563EB', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const escrowBox = { backgroundColor: '#EFF6FF', borderRadius: '8px', padding: '24px', margin: '24px 0', border: '1px solid #BFDBFE' };
const escrowLabel = { color: '#1E40AF', fontSize: '14px', margin: '0 0 8px', fontWeight: '600' };
const escrowAmount = { color: '#1D4ED8', fontSize: '32px', fontWeight: 'bold', margin: '0' };
const infoText = { color: '#1E3A8A', fontSize: '12px', margin: '4px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#3B82F6', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
