
import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components";

interface WelcomeEmailProps {
  userName?: string;
  appName?: string;
  previewText?: string;
  logoUrl?: string;
  ctaUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
}

export const WelcomeEmail = ({
  userName = "there",
  appName = "AfriConnect Exchange",
  previewText = "Welcome to AfriConnect Exchange!",
  logoUrl = "", // This is not used, the text logo is hardcoded
  ctaUrl = "https://africonnect-exchange.org/marketplace",
  homeUrl = "https://africonnect-exchange.org",
  supportEmail = "support@africonnect-exchange.org",
}: WelcomeEmailProps) => {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400;600&family=Ubuntu:ital@1&display=swap" rel="stylesheet" />
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
                          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                            <tbody>
                              <tr>
                                <td style={{ verticalAlign: "middle" }}>
                                  <a href={homeUrl} style={{ textDecoration: 'none', display: 'inline-block' }}>
                                    <span style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 700, fontSize: 16, color: '#000000' }}>
                                      AFRICONNECT<span style={{ color: '#F4B400' }}> EXCHANGE</span>
                                    </span>
                                  </a>
                                </td>
                                <td style={{ verticalAlign: "middle", textAlign: "right" }}>
                                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 6, background: "#f3f4f6", color: "#374151", fontFamily: "'Open Sans', Arial, sans-serif", fontSize: 12 }}>Welcome</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Hero Section */}
                      <tr>
                        <td style={{ padding: "28px 28px 8px 28px" }}>
                          <Heading style={h1}>Welcome to {appName}!</Heading>
                          <Text style={text}>Hi {userName} — we're glad you’re here. {appName} connects the African diaspora to trusted marketplaces, learning resources, and secure remittance tools.</Text>
                        </td>
                      </tr>

                      {/* Features Section */}
                      <tr>
                        <td style={{ padding: "12px 28px 20px 28px" }}>
                          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                            <tbody>
                              <tr><td style={featureItem}>
                                  <strong style={featureTitle}>Marketplace</strong>
                                  <p style={featureText}>Buy and sell authentic African products across borders with trusted sellers and buyer protections.</p>
                              </td></tr>
                              <tr><td style={featureItem}>
                                  <strong style={featureTitle}>Learning Hub</strong>
                                  <p style={featureText}>Access expert-led courses and earn certifications to help advance your career.</p>
                              </td></tr>
                              <tr><td style={featureItem}>
                                  <strong style={featureTitle}>Secure Remittance</strong>
                                  <p style={featureText}>Send money securely with transparent fees and real-time tracking.</p>
                              </td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Quote */}
                      <tr>
                        <td style={{ padding: "0 28px 18px 28px" }}>
                          <p style={quote}>"Learn, connect, and grow with AfriConnect Exchange."</p>
                        </td>
                      </tr>

                      {/* CTA Button */}
                      <tr>
                        <td style={{ padding: "10px 28px 24px 28px" }}>
                          <Button href={ctaUrl} style={button}>Get Started</Button>
                          <p style={linkText}>Or visit <a href={homeUrl} style={link}>{homeUrl.replace(/^https?:\/\//, '')}</a></p>
                        </td>
                      </tr>

                      {/* Footer */}
                      <tr>
                        <td style={{ background: "#2C2A4A", padding: "20px 28px", color: "#ffffff" }}>
                          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                            <tbody>
                              <tr>
                                <td style={{ verticalAlign: "top" }}>
                                  <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#ffffff" }}>
                                    Need help? <a href={`mailto:${supportEmail}`} style={{ color: "#F4B400", textDecoration: "none" }}>{supportEmail}</a>
                                  </p>
                                  <p style={{ margin: 0, fontSize: 12, color: "#bfc0c9" }}>© {year} {appName}</p>
                                </td>
                                <td style={{ verticalAlign: "top", textAlign: "right" }}>
                                  {/* Social icons can be added here if needed */}
                                </td>
                              </tr>
                               <tr>
                                <td colSpan={2} style={{ paddingTop: 14 }}>
                                  <p style={{ margin: 0, fontSize: 11, color: "#bfc0c9", lineHeight: 1.4 }}>
                                    <a href={`${homeUrl}/privacy`} style={{ color: "#bfc0c9", textDecoration: "underline" }}>Privacy Policy</a> &nbsp;•&nbsp;
                                    <a href={`${homeUrl}/terms`} style={{ color: "#bfc0c9", textDecoration: "underline" }}>Terms</a> &nbsp;•&nbsp;
                                    <a href={`${homeUrl}/unsubscribe`} style={{ color: "#bfc0c9", textDecoration: "underline" }}>Unsubscribe</a>
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
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

export default WelcomeEmail;

// --- STYLES ---
const main = { margin: 0, padding: 0, background: '#f7f7f7', fontFamily: "'Open Sans', Arial, sans-serif" };
const container = { maxWidth: '600px', padding: 0 };
const h1 = { margin: '0 0 16px', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '22px', color: '#000000', lineHeight: 1.2 };
const text = { margin: '0 0 16px', fontSize: '15px', color: '#374151', lineHeight: 1.6 };
const featureItem = { paddingBottom: '12px' };
const featureTitle = { display: 'block', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '14px', color: '#000000', fontWeight: 'bold', marginBottom: '4px' };
const featureText = { margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 };
const quote = { margin: 0, fontFamily: "'Ubuntu', Arial, sans-serif", fontStyle: 'italic', color: '#0072CE', borderLeft: '4px solid #F4B400', paddingLeft: '12px', fontSize: '15px', lineHeight: 1.5 };
const buttonContainer = { padding: '10px 28px 24px 28px' };
const button = { display: 'inline-block', background: '#F4B400', color: '#ffffff', padding: '12px 22px', borderRadius: 6, textDecoration: 'none', fontWeight: 'bold', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '14px' };
const linkText = { margin: '12px 0 0 0', fontSize: '13px', color: '#6b7280' };
const link = { color: '#0072CE', textDecoration: 'none' };
