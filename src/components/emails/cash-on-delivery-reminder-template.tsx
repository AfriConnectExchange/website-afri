
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr } from '@react-email/components';

interface CashOnDeliveryReminderEmailProps {
  customerName?: string;
  orderNumber?: string;
  amount?: number;
  deliveryDate?: string;
  deliveryAddress?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const CashOnDeliveryReminderEmail = ({
  customerName = 'Customer',
  orderNumber = '#AF12345',
  amount = 0,
  deliveryDate = 'Tomorrow',
  deliveryAddress = 'Your specified address',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: CashOnDeliveryReminderEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Reminder: Prepare £${amount.toFixed(2)} cash for your delivery`;

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
                          <Heading style={h1}>💷 Cash on Delivery Reminder</Heading>
                          <Text style={text}>Hi {customerName},</Text>
                          <Text style={text}>This is a friendly reminder that your order <strong>{orderNumber}</strong> is scheduled for delivery on <strong>{deliveryDate}</strong>.</Text>
                          <Section style={cashBox}>
                            <Text style={cashLabel}>Amount to Prepare:</Text>
                            <Text style={cashAmount}>£{amount.toFixed(2)}</Text>
                          </Section>
                          <Text style={text}>Please have the exact cash amount ready for our delivery partner at:</Text>
                          <Section style={addressBox}>
                            <Text style={addressText}>{deliveryAddress}</Text>
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

export default CashOnDeliveryReminderEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#F4B400', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const cashBox = { backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '24px', margin: '24px 0', textAlign: 'center' as const, border: '1px solid #FDE68A' };
const cashLabel = { color: '#78350F', fontSize: '14px', margin: '0 0 8px' };
const cashAmount = { color: '#B45309', fontSize: '32px', fontWeight: 'bold', margin: '0' };
const addressBox = { backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '16px', margin: '16px 0', border: '1px solid #F3F4F6' };
const addressText = { color: '#374151', fontSize: '14px', margin: 0, lineHeight: 1.5 };
