
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';

interface LowStockAlertEmailProps {
  sellerName?: string;
  productName?: string;
  currentStock?: number;
  productUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const LowStockAlertEmail = ({
  sellerName = 'Seller',
  productName = 'Your Product',
  currentStock = 0,
  productUrl = '#',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: LowStockAlertEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Low stock alert: ${productName} has only ${currentStock} units left`;

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
                          <Heading style={h1}>⚠️ Low Stock Alert</Heading>
                          <Text style={text}>Hi {sellerName},</Text>
                          <Text style={text}>Your product, "{productName}", is running low on stock and needs your attention.</Text>
                          <Section style={alertBox}>
                            <Text style={productLabel}>{productName}</Text>
                            <Text style={stockText}>{currentStock} units remaining</Text>
                          </Section>
                          <Text style={text}>Restock soon to avoid missing out on potential sales!</Text>
                          <Section style={buttonContainer}>
                            <Button style={button} href={productUrl}>Update Inventory</Button>
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

export default LowStockAlertEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#F59E0B', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const alertBox = { backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '24px', margin: '24px 0', textAlign: 'center' as const, border: '1px solid #FDE68A' };
const productLabel = { color: '#1F2937', fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' };
const stockText = { color: '#B45309', fontSize: '28px', fontWeight: 'bold', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#F59E0B', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
