
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr, Row, Column } from '@react-email/components';

interface PaymentReceiptEmailProps {
  customerName?: string;
  transactionId?: string;
  paymentDate?: string;
  paymentMethod?: string;
  amount?: number;
  orderNumber?: string;
  last4?: string;
  cardType?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const PaymentReceiptEmail = ({
  customerName = 'Customer',
  transactionId = 'TXN123',
  paymentDate = new Date().toLocaleDateString(),
  paymentMethod = 'Card',
  amount = 0,
  orderNumber = '#AF12345',
  last4 = '4242',
  cardType = 'Visa',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: PaymentReceiptEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Your payment receipt for order ${orderNumber}`;

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
                          <Heading style={h1}>✓ Payment Confirmed</Heading>
                          <Text style={text}>Hi {customerName},</Text>
                          <Text style={text}>Your payment has been successfully processed. Here is your receipt.</Text>
                          <Section style={receiptBox}>
                            <Text style={totalLabel}>Total Paid:</Text>
                            <Text style={totalValue}>£{amount.toFixed(2)}</Text>
                            <Hr style={{ borderColor: '#E5E7EB', margin: '20px 0' }} />
                            <Row style={receiptRow}><Column style={receiptLabelCol}>Transaction ID:</Column><Column style={receiptValueCol}>{transactionId}</Column></Row>
                            <Row style={receiptRow}><Column style={receiptLabelCol}>Date:</Column><Column style={receiptValueCol}>{paymentDate}</Column></Row>
                            <Row style={receiptRow}><Column style={receiptLabelCol}>Order Number:</Column><Column style={receiptValueCol}>{orderNumber}</Column></Row>
                            <Row style={receiptRow}><Column style={receiptLabelCol}>Payment Method:</Column><Column style={receiptValueCol}>{paymentMethod === 'card' ? `${cardType} ending in ${last4}` : paymentMethod}</Column></Row>
                          </Section>
                          <Section style={buttonContainer}>
                            <Button style={button} href={`${homeUrl}/orders/${orderNumber}`}>View Order Details</Button>
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

export default PaymentReceiptEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#16A34A', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const receiptBox = { backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '24px', margin: '24px 0', border: '1px solid #F3F4F6' };
const totalLabel = { color: '#6B7280', fontSize: '14px', margin: 0 };
const totalValue = { color: '#16A34A', fontSize: '32px', fontWeight: 'bold', margin: '4px 0 0 0' };
const receiptRow = { margin: '8px 0' };
const receiptLabelCol = { color: '#6B7280', fontSize: '14px', paddingRight: '12px' };
const receiptValueCol = { color: '#1F2937', fontSize: '14px', fontWeight: '600', textAlign: 'right' as const };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = { backgroundColor: '#0072CE', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
