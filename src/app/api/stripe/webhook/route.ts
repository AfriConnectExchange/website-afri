import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import admin from '@/lib/firebaseAdmin';
import { createOrders } from '@/lib/order-helpers';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' as any });

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET; webhook cannot validate signatures.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const sig = request.headers.get('stripe-signature') || '';

  let buf: ArrayBuffer;
  try {
    buf = await request.arrayBuffer();
  } catch (err) {
    console.error('Failed to read webhook request body:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Write an initial webhook event record for debugging/visibility.
  // This helps confirm Stripe delivery regardless of signature verification.
  const db = admin.firestore();
  const webhookDocRef = db.collection('webhook_events').doc();
  await webhookDocRef.set({
    status: 'received',
    received_at: admin.firestore.FieldValue.serverTimestamp(),
    stripe_signature: sig,
    note: 'raw webhook received, signature present in headers',
  }).catch((e) => console.error('Failed to write initial webhook_events doc:', e));

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, webhookSecret);
    // Signature valid — update webhook_events record
    try {
      await webhookDocRef.update({
        status: 'verified',
        event_id: event.id,
        event_type: event.type,
        verified_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to update webhook_events after verification:', e);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    // Update webhook_events with failure reason
    try {
      await webhookDocRef.update({
        status: 'invalid_signature',
        error: err.message,
        verified_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to update webhook_events on signature error:', e);
    }
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve the full session to access metadata and shipping info
      const full = await stripe.checkout.sessions.retrieve(session.id);

  const fullAny: any = full as any;
  const metadata = fullAny.metadata || {};
  const cartItemsJson = metadata.cart_items as string | undefined;
      const cartItems = cartItemsJson ? JSON.parse(cartItemsJson) : [];

      // Attempt to map the session's customer email to an existing user
      const db = admin.firestore();
      let buyerId: string | null = null;
      let buyerData: any = {};

      const customerEmail = full.customer_details?.email;
      if (customerEmail) {
        const q = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
        if (!q.empty) {
          const d = q.docs[0];
          buyerId = d.id;
          buyerData = d.data();
        } else {
          buyerId = null;
          buyerData = { email: customerEmail, full_name: full.customer_details?.name || null, phone: full.customer_details?.phone };
        }
      } else {
        buyerId = null;
        buyerData = { email: null };
      }

      // Build shipping address from session if available
      const shippingAddress = fullAny.shipping ? {
        name: fullAny.shipping.name,
        street: fullAny.shipping.address?.line1,
        city: fullAny.shipping.address?.city,
        postcode: fullAny.shipping.address?.postal_code,
        country: fullAny.shipping.address?.country,
      } : undefined;

      const payment_details = {
        transactionId: full.payment_intent || full.id,
        stripe_session: full.id,
      };

      // Create orders server-side (idempotent helper will check stripe_session)
      const created = await createOrders({
        buyerId,
        buyerData,
        cartItems,
        shippingAddress,
        paymentMethod: 'card',
        payment_details,
      } as any);

      // Log successful creation on webhook_events doc for quick visibility
      try {
        await webhookDocRef.update({
          status: 'processed',
          created_orders: created,
          processed_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error('Failed to update webhook_events after processing:', e);
      }

      return NextResponse.json({ received: true, created });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Failed to handle webhook event:', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
