import admin from './firebaseAdmin';
import { logActivity } from './activity-logger';
import { sendEmail } from './email-service';
import { sendOrderConfirmationSMS } from './sms-service';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '@/components/emails/order-confirmation-template';
import { NewOrderAlertEmail } from '@/components/emails/new-order-alert-template';

const db = admin.firestore();

export interface CreateOrdersOptions {
  buyerId: string | null;
  buyerData: any;
  cartItems: any[];
  shippingAddress?: any;
  paymentMethod?: string;
  payment_details?: any;
}

/**
 * Create orders grouped by seller and perform side-effects (notifications, emails, SMS, activity logs).
 * Returns array of created order IDs.
 */
export async function createOrders(options: CreateOrdersOptions): Promise<string[]> {
  const { buyerId, buyerData, cartItems, shippingAddress, paymentMethod, payment_details } = options;

  // Group items by seller
  const ordersBySeller: { [sellerId: string]: any[] } = {};
  for (const item of cartItems) {
    if (!item.seller_id) {
      throw new Error(`Missing seller ID for product ${item.title}`);
    }
    if (!ordersBySeller[item.seller_id]) ordersBySeller[item.seller_id] = [];
    ordersBySeller[item.seller_id].push({
      product_id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      image: item.images?.[0]?.url || item.image || null,
    });
  }

  const orderCreationPromises = Object.keys(ordersBySeller).map(async (sellerId) => {
    const sellerItems = ordersBySeller[sellerId];
    const sellerSubtotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const orderRef = db.collection('orders').doc();
    const orderData: any = {
      buyer_id: buyerId,
      seller_id: sellerId,
      buyer_name: buyerData?.full_name || buyerData?.display_name || 'Customer',
      items: sellerItems,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      subtotal: sellerSubtotal,
      shipping_cost: 0,
      total_amount: sellerSubtotal,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_details: payment_details || null,
      stripe_session: payment_details?.stripe_session || null,
    };

    await orderRef.set(orderData);
    const orderId = orderRef.id;

    // Log activity
    await logActivity({
      user_id: buyerId ?? 'guest',
      action: 'order_created',
      entity_type: 'order',
      entity_id: orderId,
      changes: { total: orderData.total_amount, items: orderData.items.length },
    });

    // Create notifications
    await Promise.all([
      db.collection('notifications').add({
        user_id: buyerId,
        type: 'order',
        title: 'Order Placed!',
        message: `Your order #${orderId.substring(0,6)} has been placed successfully.`,
        link_url: `/orders`,
        read: false,
        created_at: new Date().toISOString(),
      }),
      db.collection('notifications').add({
        user_id: sellerId,
        type: 'order',
        title: 'New Order Received!',
        message: `You have received a new order: #${orderId.substring(0,6)}.`,
        link_url: `/seller/orders`,
        read: false,
        created_at: new Date().toISOString(),
      }),
    ]);

    // Send emails and SMS (best-effort)
    const sellerDoc = await db.collection('users').doc(sellerId).get();
    const sellerData = sellerDoc.data();

    if (buyerData?.email) {
      const emailHtml = render(
        OrderConfirmationEmail({
          customerName: buyerData.full_name || 'Customer',
          orderNumber: orderId,
          orderDate: new Date().toLocaleDateString(),
          items: sellerItems,
          total: sellerSubtotal,
          trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tracking/${orderId}`,
        })
      );
      sendEmail({
        to: buyerData.email,
        subject: `Your AfriConnect order ${orderId} is confirmed!`,
        html: emailHtml,
        text: `Your order ${orderId} has been placed. Total: £${sellerSubtotal.toFixed(2)}.`,
      }).catch(console.error);
    }

    if (sellerData?.email) {
      const emailHtml = render(
        NewOrderAlertEmail({
          sellerName: sellerData.full_name || 'Seller',
          orderNumber: orderId,
          buyerName: buyerData?.full_name || 'A customer',
          items: sellerItems,
          total: sellerSubtotal,
          orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/orders`,
        })
      );
      sendEmail({
        to: sellerData.email,
        subject: `New Order Received - #${orderId}`,
        html: emailHtml,
        text: `You have a new order: #${orderId}. Total: £${sellerSubtotal.toFixed(2)}.`,
      }).catch(console.error);
    }

    if (buyerData?.phone) {
      sendOrderConfirmationSMS(buyerData.phone, orderId, sellerSubtotal, buyerId || 'guest').catch(console.error);
    }

    return orderId;
  });

  const orderIds = await Promise.all(orderCreationPromises);
  return orderIds;
}

export default createOrders;
