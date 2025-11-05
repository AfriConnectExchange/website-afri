
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  images?: Array<{ url: string, alt?: string }> | string[]; // Can be array of objects or strings
  seller_id?: string;
}

/**
 * POST /api/stripe/checkout-session
 * Create a Stripe Checkout Session for embedded checkout
 * 
 * Request body:
 * - cartItems: CartItem[] (cart items to purchase)
 * 
 * Response:
 * - clientSecret: string (Stripe client secret for EmbeddedCheckout)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartItems } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Create line items for Stripe, ensuring image URLs are public and not base64
    const lineItems = cartItems.map((item: CartItem) => {
      let imageUrl: string | undefined;

      if (item.images && item.images.length > 0) {
        const firstImage = item.images[0];
        if (typeof firstImage === 'string') {
          imageUrl = firstImage;
        } else if (typeof firstImage === 'object' && firstImage.url) {
          imageUrl = firstImage.url;
        }
      }

      // Filter out base64 data URIs
      const finalImages = imageUrl && !imageUrl.startsWith('data:') ? [imageUrl] : [];

      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.title,
            images: finalImages,
            metadata: {
              product_id: item.id,
              seller_id: item.seller_id || 'unknown',
            },
          },
          unit_amount: Math.round(item.price * 100), // Convert to pence
        },
        quantity: item.quantity,
      };
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: lineItems,
      mode: 'payment',
      return_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        cart_items: JSON.stringify(cartItems.map((item: CartItem) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          seller_id: item.seller_id,
        }))),
      },
      payment_intent_data: {
        metadata: {
          integration_check: 'accept_a_payment',
        },
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'NG', 'KE', 'GH', 'ZA'],
      },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Failed to create Stripe checkout session:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/checkout-session?session_id=xxx
 * Retrieve checkout session status (for post-payment verification)
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    });

  } catch (error: any) {
    console.error('Failed to retrieve checkout session:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
