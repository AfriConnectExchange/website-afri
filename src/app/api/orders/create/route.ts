
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { logActivity } from '@/lib/activity-logger';
import { OrderConfirmationEmail } from '@/components/emails/order-confirmation-template';
import { NewOrderAlertEmail } from '@/components/emails/new-order-alert-template';
import { sendEmail } from '@/lib/email-service';
import { sendOrderConfirmationSMS } from '@/lib/sms-service';
import { render } from '@react-email/render';

const db = admin.firestore();
const auth = admin.auth();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { cartItems, subtotal, total, paymentMethod, shippingAddress, payment_details } = body;

    // Idempotency: if this payload includes a Stripe session id, and orders
    // already exist for that session, return existing order IDs instead of
    // creating duplicates. This covers webhook/client reconciliation races.
    const stripeSession = payment_details?.stripe_session || null;
    if (stripeSession) {
      try {
        const existing = await db.collection('orders').where('stripe_session', '==', stripeSession).get();
        if (!existing.empty) {
          const existingIds: string[] = [];
          existing.forEach(d => existingIds.push(d.id));
          return NextResponse.json({ success: true, order_ids: existingIds, already_exists: true });
        }
      } catch (e) {
        console.warn('Idempotency check failed, proceeding to create orders:', e);
      }
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }
    
    const buyerDoc = await db.collection('users').doc(userId).get();
    const buyerData = buyerDoc.data();

    // Group items by seller
    const ordersBySeller: { [sellerId: string]: any[] } = {};
    for (const item of cartItems) {
      if (!item.seller_id) {
        return NextResponse.json({ error: `Missing seller ID for product ${item.title}`}, { status: 400 });
      }
      if (!ordersBySeller[item.seller_id]) {
        ordersBySeller[item.seller_id] = [];
      }
      ordersBySeller[item.seller_id].push({
        product_id: item.id, // Use item.id which is the product ID
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.images?.[0]?.url || item.image || null, // Include an image
      });
    }

    const orderCreationPromises = Object.keys(ordersBySeller).map(async (sellerId) => {
      const sellerItems = ordersBySeller[sellerId];
      const sellerSubtotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      // Create order document
      const orderRef = db.collection('orders').doc();
      const orderData = {
        buyer_id: userId,
        seller_id: sellerId,
        buyer_name: buyerData?.full_name || buyerData?.display_name || 'Customer',
        items: sellerItems,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        subtotal: sellerSubtotal,
        shipping_cost: 0, // Determined by seller later
        total_amount: sellerSubtotal,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Attach payment details and stripe session (if available) for
        // idempotency and reconciliation.
        payment_details: payment_details || null,
        stripe_session: stripeSession,
      };
      
      await orderRef.set(orderData);
      
      const orderId = orderRef.id;

      // Log activity
      await logActivity({
        user_id: userId,
        action: 'order_created',
        entity_type: 'order',
        entity_id: orderId,
        changes: { total: orderData.total_amount, items: orderData.items.length },
      });

      // Create notifications for buyer and seller
      const notificationPromises = [
        db.collection('notifications').add({
          user_id: userId, // Buyer
          type: 'order',
          title: 'Order Placed!',
          message: `Your order #${orderId.substring(0, 6)} has been placed successfully.`,
          link_url: `/orders`,
          read: false,
          created_at: new Date().toISOString(),
        }),
        db.collection('notifications').add({
          user_id: sellerId, // Seller
          type: 'order',
          title: 'New Order Received!',
          message: `You have received a new order: #${orderId.substring(0, 6)}.`,
          link_url: `/seller/orders`,
          read: false,
          created_at: new Date().toISOString(),
        })
      ];
      await Promise.all(notificationPromises);

      // Send emails and SMS
      const sellerDoc = await db.collection('users').doc(sellerId).get();
      const sellerData = sellerDoc.data();

      // Buyer Email
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

      // Seller Email
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

      // Buyer SMS
      if (buyerData?.phone) {
        sendOrderConfirmationSMS(
            buyerData.phone,
            orderId,
            sellerSubtotal,
            userId
        ).catch(console.error);
      }

      return orderId;
    });

    const orderIds = await Promise.all(orderCreationPromises);

    return NextResponse.json({
      success: true,
      order_ids: orderIds,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
