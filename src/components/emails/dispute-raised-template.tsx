import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';

interface DisputeRaisedEmailProps {
  userName: string;
  role: 'buyer' | 'seller' | 'admin';
  orderNumber: string;
  disputeId: string;
  reason: string;
  disputeUrl: string;
}

export const DisputeRaisedEmail = ({
  userName = 'User',
  role = 'buyer',
  orderNumber = '#AF12345',
  disputeId = 'DISP123',
  reason = '',
  disputeUrl = '',
}: DisputeRaisedEmailProps) => {
  const getHeading = () => {
    if (role === 'admin') return '⚠️ New Dispute Requires Attention';
    if (role === 'seller') return '⚠️ Dispute Raised on Your Order';
    return '⚠️ Your Dispute Has Been Submitted';
  };

  const getMessage = () => {
    if (role === 'admin') {
      return `A dispute has been raised for order ${orderNumber} and requires your attention.`;
    }
    if (role === 'seller') {
      return `A customer has raised a dispute for order ${orderNumber}. Please review and respond.`;
    }
    return `Your dispute for order ${orderNumber} has been submitted. Our team will review it within 24 hours.`;
  };

  return (
    <Html>
      <Head />
      <Preview>Dispute raised for order {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{getHeading()}</Heading>
          
          <Text style={text}>Hi {userName},</Text>
          
          <Text style={text}>{getMessage()}</Text>

          <Section style={disputeBox}>
            <Text style={disputeLabel}>Dispute ID:</Text>
            <Text style={disputeValue}>{disputeId}</Text>
            <Text style={disputeLabel}>Order Number:</Text>
            <Text style={disputeValue}>{orderNumber}</Text>
            {reason && (
              <>
                <Text style={disputeLabel}>Reason:</Text>
                <Text style={disputeReason}>{reason}</Text>
              </>
            )}
          </Section>

          {role !== 'buyer' && (
            <Section style={warningBox}>
              <Text style={warningText}>
                {role === 'admin' 
                  ? '🔔 This requires immediate attention. Please review the dispute details and take action within 24 hours.'
                  : '⏰ Please respond within 48 hours to avoid automatic resolution in buyer\'s favor.'}
              </Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={disputeUrl}>
              {role === 'admin' ? 'Review Dispute' : role === 'seller' ? 'Respond to Dispute' : 'View Dispute Status'}
            </Button>
          </Section>

          <Text style={footer}>
            © {new Date().getFullYear()} AfriConnect. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default DisputeRaisedEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px', maxWidth: '600px' };
const h1 = { color: '#EA4335', fontSize: '28px', fontWeight: 'bold', margin: '40px 0 20px', padding: '0 40px', textAlign: 'center' as const };
const text = { color: '#525252', fontSize: '16px', lineHeight: '24px', margin: '16px 40px' };
const disputeBox = { backgroundColor: '#FFF3E0', borderRadius: '12px', padding: '30px', margin: '30px 40px', border: '2px solid #F4B400' };
const disputeLabel = { color: '#71717A', fontSize: '12px', margin: '15px 0 5px 0', textTransform: 'uppercase' as const };
const disputeValue = { color: '#2C2A4A', fontSize: '16px', fontWeight: '600', margin: '0 0 10px 0' };
const disputeReason = { color: '#525252', fontSize: '14px', margin: '0', fontStyle: 'italic' as const };
const warningBox = { backgroundColor: '#FEE', borderRadius: '8px', padding: '20px', margin: '20px 40px', border: '1px solid #EA4335' };
const warningText = { color: '#EA4335', fontSize: '14px', margin: '0', fontWeight: '600' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 40px' };
const button = { backgroundColor: '#EA4335', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px' };
const footer = { color: '#71717A', fontSize: '12px', lineHeight: '20px', margin: '20px 40px', textAlign: 'center' as const };
