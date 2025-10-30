
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
  app_name?: string;
  previewText?: string;
  logoUrl?: string;
  ctaUrl?: string;
  homeUrl?: string;
  supportEmail?: string;
}

export const WelcomeEmail = ({
  userName = "there",
  app_name = "AfriConnect Exchange",
  previewText = "Welcome to AfriConnect Exchange",
  logoUrl = "",
  ctaUrl = "https://africonnect-exchange.com/login",
  homeUrl = "https://africonnect-exchange.com",
  supportEmail = "support@africonnect-exchange.com",
}: WelcomeEmailProps) => {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head>
        {/* Google fonts included where supported; email clients may ignore external fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400;600&family=Ubuntu:ital@1&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Preview>{previewText}</Preview>

      <Body
        style={{
          margin: 0,
          padding: 0,
          background: "#f7f7f7",
          color: "#111827",
          fontFamily: "'Open Sans', Arial, sans-serif",
        }}
      >
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ background: "#f7f7f7", width: "100%" }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "28px 16px" }}>
                <Container style={{ maxWidth: "600px", padding: 0 }}>
                  <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ background: "#ffffff", borderRadius: 10, overflow: "hidden", border: "1px solid #e6e6e9" }}>
                    <tbody>
                      {/* Header */}
                      <tr>
                        <td style={{ padding: "18px 20px", borderBottom: "1px solid #f0f0f2" }}>
                          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                            <tbody>
                              <tr>
                                <td style={{ verticalAlign: "middle" }}>
                                  <a href={homeUrl} style={{ textDecoration: "none", display: "inline-block" }}>
                                    <div style={{ display: "inline-block", verticalAlign: "middle" }}>
                                      <div style={{ width: 100, height: 36, borderRadius: 8, background: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0 }}>
                                        {/* Text badge logo fallback */}
                                        <span style={{ display: "inline-block", fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 700, fontSize: 16, color: "#000000" }}>
                                          AFRICONNECT<span style={{ color: "#F4B400" }}> EXCHANGE</span>
                                        </span>
                                      </div>
                                    </div>
                                  </a>
                                </td>

                                <td style={{ verticalAlign: "middle", textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 6, background: "#f3f4f6", color: "#374151", fontFamily: "'Open Sans', Arial, sans-serif" }}>Welcome</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Hero */}
                      <tr>
                        <td style={{ padding: "28px 28px 8px 28px", textAlign: "left" }}>
                          <h1 style={{ margin: 0, fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 22, color: "#000000", lineHeight: 1.2 }}>
                            Welcome to {app_name}
                          </h1>
                          <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
                            Hi {userName} — glad you’re here. {app_name} connects the African diaspora to trusted marketplaces, learning resources, and secure remittance tools.
                          </p>
                        </td>
                      </tr>

                      {/* Body content */}
                      <tr>
                        <td style={{ padding: "12px 28px 20px 28px" }}>
                          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                            <tbody>
                              <tr>
                                <td style={{ paddingBottom: 12 }}>
                                  <strong style={{ display: "block", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14, color: "#000000", marginBottom: 6 }}>Marketplace</strong>
                                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>Buy and sell authentic African products across borders with trusted sellers and buyer protections.</p>
                                </td>
                              </tr>
                              <tr>
                                <td style={{ paddingBottom: 12 }}>
                                  <strong style={{ display: "block", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14, color: "#000000", marginBottom: 6 }}>Learning Hub</strong>
                                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>Access expert-led courses and earn certifications to help advance your career.</p>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <strong style={{ display: "block", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14, color: "#000000", marginBottom: 6 }}>Secure Remittance</strong>
                                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>Send money securely with transparent fees and real-time tracking.</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      {/* Quote */}
                      <tr>
                        <td style={{ padding: "0 28px 18px 28px" }}>
                          <p style={{ margin: 0, fontFamily: "'Ubuntu', Arial, sans-serif", fontStyle: "italic", color: "#0072CE", borderLeft: "4px solid #F4B400", paddingLeft: 12, fontSize: 15, lineHeight: 1.5 }}>
                            "Learn, connect, and grow with AfriConnect Exchange."
                          </p>
                        </td>
                      </tr>

                      {/* CTA */}
                      <tr>
                        <td style={{ padding: "10px 28px 24px 28px", textAlign: "left" }}>
                          <a href={ctaUrl} style={{ display: "inline-block", background: "#F4B400", color: "#ffffff", padding: "12px 22px", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14 }}>
                            Get Started
                          </a>
                          <p style={{ margin: "12px 0 0 0", fontSize: 13, color: "#6b7280" }}>Or visit <a href={homeUrl} style={{ color: "#0072CE", textDecoration: "none" }}>{homeUrl.replace(/^https?:\/\//, '')}</a></p>
                        </td>
                      </tr>

                      {/* Divider */}
                      <tr>
                        <td style={{ padding: "0 28px" }}>
                          <div style={{ height: 1, background: "#f0f0f2", margin: 0 }} />
                        </td>
                      </tr>

                      {/* Footer */}
                      <tr>
                        <td style={{ background: "#2C2A4A", padding: "20px 20px 28px 20px", color: "#ffffff" }}>
                          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                            <tbody>
                              <tr>
                                <td style={{ verticalAlign: "top", paddingRight: 12 }}>
                                  <p style={{ margin: "0 0 8px 0", fontSize: 14, color: "#ffffff" }}>
                                    Need help? <a href={`mailto:${supportEmail}`} style={{ color: "#F4B400", textDecoration: "none" }}>{supportEmail}</a>
                                  </p>
                                  <p style={{ margin: 0, fontSize: 12, color: "#cfcfd6" }}>© {year} {app_name}</p>
                                </td>
                                <td style={{ verticalAlign: "top", textAlign: "right" }}>
                                  <table cellPadding={0} cellSpacing={0} role="presentation" style={{ display: "inline-table" }}>
                                    <tbody>
                                      <tr>
                                        <td style={{ paddingLeft: 8 }}>
                                          <a href="https://facebook.com/AfriConnectExchange"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="26" height="26" style={{ display: "block", border: 0 }} /></a>
                                        </td>
                                        <td style={{ paddingLeft: 8 }}>
                                          <a href="https://x.com/AfriConnectExchange"><img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" alt="X" width="26" height="26" style={{ display: "block", border: 0 }} /></a>
                                        </td>
                                        <td style={{ paddingLeft: 8 }}>
                                          <a href="https://linkedin.com/company/AfriConnectExchange"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="26" height="26" style={{ display: "block", border: 0 }} /></a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
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
