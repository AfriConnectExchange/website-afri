
import * as React from 'react';

interface WelcomeEmailProps {
  userName?: string;
  previewText?: string;
  app_name?: string;
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '26px',
};

const btn = {
  backgroundColor: '#e00707',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};


export const WelcomeTemplate = ({
  userName = 'Valued User',
  previewText = 'Welcome to AfriConnect Exchange!',
  app_name = 'AfriConnect Exchange'
}: WelcomeEmailProps) => (
  <div style={main}>
    <div style={container}>
      <div style={box}>
        <h1 style={h1}>Welcome to {app_name}!</h1>
        <p style={text}>Hi {userName},</p>
        <p style={text}>
          Thank you for joining our community. We are thrilled to have you on board and look forward to helping you connect, trade, and thrive.
        </p>
        <p style={text}>
          To get started, we recommend exploring the marketplace to discover authentic products, or completing your profile to unlock all features.
        </p>
        <a href="https://africonnect-exchange.vercel.app/" style={btn}>
          Explore the Marketplace
        </a>
        <p style={{ ...text, marginTop: '20px' }}>
          If you have any questions, feel free to visit our Help Center or contact our support team.
        </p>
        <p style={text}>
          Best,
          <br />
          The {app_name} Team
        </p>
        <hr style={{...text, borderColor: '#e6ebf1', margin: '20px 0'}} />
        <p style={footer}>
          AfriConnect Exchange - 4 Orkney Drive, Kilmarnock, KA3 2HP, Scotland.
        </p>
      </div>
    </div>
  </div>
);

export default WelcomeTemplate;
