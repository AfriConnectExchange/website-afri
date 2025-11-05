
import * as React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Img, Hr, Row, Column } from '@react-email/components';

interface Item {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  items?: Item[];
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  deliveryAddress?: {
    street: string;
    city: string;
    postcode: string;
  };
  trackingUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Customer',
  orderNumber = '#AF12345',
  orderDate = new Date().toLocaleDateString(),
  items = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  deliveryAddress = { street: '', city: '', postcode: '' },
  trackingUrl = '#',
  homeUrl = '#',
  supportEmail = 'support@africonnect-exchange.org',
  appName = 'AfriConnect Exchange'
}: OrderConfirmationEmailProps) => {
  const year = new Date().getFullYear();
  const previewText = `Your ${appName} order ${orderNumber} is confirmed!`;

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
                          <Heading style={h1}>🎉 Order Confirmed!</Heading>
                          <Text style={text}>Hi {customerName},</Text>
                          <Text style={text}>Thank you for your order! We've received it and are preparing it for shipment.</Text>
                          
                          <Section style={infoBox}>
                            <Row>
                              <Column><Text style={infoText}><strong>Order Number:</strong> {orderNumber}</Text></Column>
                              <Column style={{textAlign: 'right'}}><Text style={infoText}><strong>Date:</strong> {orderDate}</Text></Column>
                            </Row>
                          </Section>

                          <Heading style={h2}>Order Summary</Heading>
                          
                          <Section style={itemsBox}>
                            {items.map((item, index) => (
                              <Row key={index} style={{ marginBottom: '12px' }}>
                                <Column><Text style={itemName}>{item.name} (x{item.quantity})</Text></Column>
                                <Column style={{textAlign: 'right'}}><Text style={itemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text></Column>
                              </Row>
                            ))}
                          </Section>

                          <Hr style={hr} />

                          <Section>
                             <Row><Column><Text style={totalsLabel}>Subtotal:</Text></Column><Column style={{textAlign: 'right'}}><Text style={totalsValue}>£{subtotal.toFixed(2)}</Text></Column></Row>
                             <Row><Column><Text style={totalsLabel}>Delivery:</Text></Column><Column style={{textAlign: 'right'}}><Text style={totalsValue}>£{deliveryFee.toFixed(2)}</Text></Column></Row>
                             <Hr style={{borderColor: '#E5E7EB', margin: '8px 0'}}/>
                             <Row><Column><Text style={totalsLabelBold}>Total:</Text></Column><Column style={{textAlign: 'right'}}><Text style={totalsValueBold}>£{total.toFixed(2)}</Text></Column></Row>
                          </Section>
                          
                          <Hr style={hr} />

                          <Heading style={h2}>Delivery Address</Heading>
                          <Section style={addressBox}>
                            <Text style={addressText}>{deliveryAddress.street}</Text>
                            <Text style={addressText}>{deliveryAddress.city}, {deliveryAddress.postcode}</Text>
                          </Section>

                          <Section style={buttonContainer}>
                            <Button style={button} href={trackingUrl}>Track Your Order</Button>
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

export default OrderConfirmationEmail;

const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#0072CE', lineHeight: 1.2 };
const h2 = { margin: '24px 0 12px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '18px', color: '#1F2937', fontWeight: 'bold' };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const infoBox = { backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '16px', margin: '24px 0', border: '1px solid #F3F4F6' };
const infoText = { color: '#374151', fontSize: '14px', margin: 0 };
const itemsBox = { padding: '0' };
const itemName = { color: '#1F2937', fontSize: '14px', fontWeight: '600', margin: 0 };
const itemPrice = { color: '#374151', fontSize: '14px', fontWeight: '600', margin: 0 };
const hr = { borderColor: '#E5E7EB', margin: '20px 0' };
const totalsLabel = { color: '#6B7280', fontSize: '14px', margin: '4px 0' };
const totalsValue = { color: '#374151', fontSize: '14px', margin: '4px 0' };
const totalsLabelBold = { color: '#1F2937', fontSize: '16px', fontWeight: 'bold', margin: '8px 0' };
const totalsValueBold = { color: '#0072CE', fontSize: '16px', fontWeight: 'bold', margin: '8px 0' };
const addressBox = { backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '16px', border: '1px solid #F3F4F6' };
const addressText = { color: '#374151', fontSize: '14px', margin: '2px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0 16px' };
const button = { backgroundColor: '#0072CE', borderRadius: '6px', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' };
