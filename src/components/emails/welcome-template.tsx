
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
}

export const WelcomeEmail = ({
  userName = "Valued User",
  app_name = "AfriConnect Exchange",
  previewText = "Welcome to AfriConnect Exchange!",
  logoUrl = "https://fkwcbvackexaqwlbecaz.supabase.co/storage/v1/object/public/assets/ae-logo.png",
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f9fc",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
          margin: 0,
          padding: "30px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            maxWidth: "600px",
            margin: "0 auto",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* LOGO HEADER */}
          <Section style={{ textAlign: "center", padding: "30px 0 20px" }}>
            <Img
              src={logoUrl}
              width="180"
              height="auto"
              alt={`${app_name} logo`}
              style={{ margin: "0 auto" }}
            />
          </Section>

          {/* GREETING + TITLE */}
          <Section style={{ padding: "0 40px" }}>
            <Heading
              as="h1"
              style={{
                color: "#222",
                fontSize: "20px",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              Welcome to {app_name}!
            </Heading>

            <Text
              style={{
                color: "#555",
                fontSize: "15px",
                lineHeight: "24px",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              Hi {userName},
            </Text>

            <Text
              style={{
                color: "#555",
                fontSize: "15px",
                lineHeight: "24px",
                textAlign: "center",
              }}
            >
              We’re thrilled to have you onboard. Dive into our marketplace to connect, trade, and grow with the community.
            </Text>
          </Section>

          {/* BUTTON */}
          <Section style={{ textAlign: "center", padding: "24px 40px 0" }}>
            <Button
              href="https://africonnect-exchange.vercel.app/"
              style={{
                backgroundColor: "#e00707",
                color: "#ffffff",
                borderRadius: "5px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Explore Marketplace
            </Button>
          </Section>

          {/* SUPPORT + CLOSING */}
          <Section style={{ padding: "24px 40px" }}>
            <Text
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: "22px",
                textAlign: "center",
              }}
            >
              Need help or want to learn more? Visit our{" "}
              <a
                href="https://africonnect-exchange.vercel.app/help"
                style={{ color: "#e00707", textDecoration: "none" }}
              >
                Help Center
              </a>{" "}
              or contact our support team.
            </Text>

            <Text
              style={{
                color: "#555",
                fontSize: "14px",
                lineHeight: "22px",
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              Cheers,<br />
              The {app_name} Team
            </Text>
          </Section>

          {/* FOOTER */}
          <Hr
            style={{
              borderColor: "#e6ebf1",
              margin: "0 40px",
            }}
          />
          <Section style={{ padding: "16px 40px 30px", textAlign: "center" }}>
            <Text
              style={{
                color: "#8898aa",
                fontSize: "11px",
                lineHeight: "18px",
                marginBottom: "8px",
              }}
            >
              © {new Date().getFullYear()} {app_name}. All rights reserved.
            </Text>
            <Text
              style={{
                color: "#8898aa",
                fontSize: "11px",
                lineHeight: "18px",
              }}
            >
              <a
                href="https://africonnect-exchange.vercel.app/privacy"
                style={{ color: "#8898aa", textDecoration: "none" }}
              >
                Privacy Policy
              </a>{" "}
              ·{" "}
              <a
                href="https://africonnect-exchange.vercel.app/terms"
                style={{ color: "#8898aa", textDecoration: "none" }}
              >
                Terms of Service
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;
