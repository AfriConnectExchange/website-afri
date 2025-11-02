'use server';

import admin from './firebaseAdmin';
import { logActivity } from './activity-logger';

interface SMSOptions {
  to: string; // E.164 format: +447700900123
  message: string;
  userId?: string;
  from?: string; // Optional: Override default Twilio number
  mediaUrls?: string[]; // Optional: Media URLs (US/Canada only)
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const TWILIO_PHONE_NUMBER = '+447360542158';
const TWILIO_MESSAGING_SERVICE_SID = 'MGdb75fa29eba562e2f88bd9e577378c7d';

/**
 * Send SMS via Twilio Firebase Extension
 * Uses Firestore collection 'messages' which is monitored by the extension
 * @param options - SMS options (to, message, userId, from, mediaUrls)
 * @returns Promise with success status and messageId
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResponse> {
  try {
    // Validate phone number format
    if (!options.to.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format (e.g., +447700900123)');
    }

    // Truncate message if longer than 1600 characters (SMS limit)
    const body = options.message.length > 1600 
      ? options.message.substring(0, 1597) + '...' 
      : options.message;

    const db = admin.firestore();
    
    // Create message document in 'messages' collection
    // The Twilio extension monitors this collection and sends messages automatically
    const messageData: any = {
      to: options.to,
      body: body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Optional: Override from number/service
    if (options.from) {
      messageData.from = options.from;
    } else {
      // Use Messaging Service SID for better deliverability
      messageData.from = TWILIO_MESSAGING_SERVICE_SID;
    }

    // Optional: Add media URLs (US/Canada only)
    if (options.mediaUrls && options.mediaUrls.length > 0) {
      messageData.mediaUrls = options.mediaUrls;
    }

    const docRef = await db.collection('messages').add(messageData);

    // Log SMS activity
    if (options.userId) {
      await logActivity({
        userId: options.userId,
        action: 'sms_queued',
        category: 'notification',
        status: 'success',
        metadata: {
          to: options.to,
          messageDocId: docRef.id,
          messageLength: body.length,
        },
      });
    }

    console.log(`SMS queued for delivery. Document ID: ${docRef.id}`);

    return {
      success: true,
      messageId: docRef.id,
    };

  } catch (error: any) {
    console.error('Failed to queue SMS:', error);

    // Log failed SMS attempt
    if (options.userId) {
      await logActivity({
        userId: options.userId,
        action: 'sms_failed',
        category: 'notification',
        status: 'failure',
        metadata: {
          to: options.to,
          error: error.message,
        },
      });
    }

    return {
      success: false,
      error: error.message || 'Failed to queue SMS',
    };
  }
}

/**
 * Send OTP code via SMS
 * @param phoneNumber - Phone number in E.164 format
 * @param code - 6-digit OTP code
 * @param userId - Optional user ID for logging
 */
export async function sendOTPSMS(phoneNumber: string, code: string, userId?: string): Promise<SMSResponse> {
  const message = `Your AfriConnect verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send order confirmation SMS
 * @param phoneNumber - Phone number
 * @param orderNumber - Order number
 * @param totalAmount - Order total
 * @param userId - User ID
 */
export async function sendOrderConfirmationSMS(
  phoneNumber: string,
  orderNumber: string,
  totalAmount: number,
  userId: string
): Promise<SMSResponse> {
  const message = `AfriConnect Order Confirmed!\n\nOrder #${orderNumber}\nTotal: £${totalAmount.toFixed(2)}\n\nTrack your order: africonnect.com/orders/${orderNumber}`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send payment confirmation SMS
 * @param phoneNumber - Phone number
 * @param amount - Payment amount
 * @param paymentMethod - Payment method
 * @param userId - User ID
 */
export async function sendPaymentConfirmationSMS(
  phoneNumber: string,
  amount: number,
  paymentMethod: string,
  userId: string
): Promise<SMSResponse> {
  const message = `Payment Received!\n\n£${amount.toFixed(2)} via ${paymentMethod}\n\nThank you for your purchase on AfriConnect!`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send delivery notification SMS
 * @param phoneNumber - Phone number
 * @param orderNumber - Order number
 * @param trackingUrl - Tracking URL
 * @param userId - User ID
 */
export async function sendDeliveryNotificationSMS(
  phoneNumber: string,
  orderNumber: string,
  trackingUrl: string,
  userId: string
): Promise<SMSResponse> {
  const message = `Your AfriConnect order #${orderNumber} is out for delivery!\n\nTrack: ${trackingUrl}\n\nExpected delivery today.`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send cash on delivery reminder SMS
 * @param phoneNumber - Phone number
 * @param orderNumber - Order number
 * @param amount - Amount to pay
 * @param userId - User ID
 */
export async function sendCashOnDeliveryReminderSMS(
  phoneNumber: string,
  orderNumber: string,
  amount: number,
  userId: string
): Promise<SMSResponse> {
  const message = `Delivery arriving soon!\n\nOrder #${orderNumber}\nPrepare cash: £${amount.toFixed(2)}\n\nAfriConnect - Cash on Delivery`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send barter proposal notification SMS
 * @param phoneNumber - Phone number
 * @param proposerName - Name of person proposing barter
 * @param productName - Product being offered
 * @param userId - User ID
 */
export async function sendBarterProposalSMS(
  phoneNumber: string,
  proposerName: string,
  productName: string,
  userId: string
): Promise<SMSResponse> {
  const message = `New Barter Proposal!\n\n${proposerName} wants to trade for your item.\nOffering: ${productName}\n\nView: africonnect.com/barter/inbox`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send escrow release notification SMS
 * @param phoneNumber - Phone number
 * @param amount - Amount released
 * @param orderId - Order ID
 * @param userId - User ID
 */
export async function sendEscrowReleaseSMS(
  phoneNumber: string,
  amount: number,
  orderId: string,
  userId: string
): Promise<SMSResponse> {
  const message = `Funds Released!\n\n£${amount.toFixed(2)} from order #${orderId} has been released to your account.\n\nAfriConnect Escrow`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}

/**
 * Send low stock alert SMS to seller
 * @param phoneNumber - Seller phone
 * @param productName - Product name
 * @param stockLevel - Current stock
 * @param userId - Seller ID
 */
export async function sendLowStockAlertSMS(
  phoneNumber: string,
  productName: string,
  stockLevel: number,
  userId: string
): Promise<SMSResponse> {
  const message = `Low Stock Alert!\n\n"${productName}" has only ${stockLevel} units left.\n\nRestock soon: africonnect.com/vendor/products`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    userId,
  });
}
