'use server';
import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const headersList = headers();
  const { cartItems } = await req.json();
  const origin = headersList.get('origin') || 'http://localhost:9002';

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key is not set.');
    return NextResponse.json({ error: 'Server configuration error: Stripe secret key is missing.' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
  }

  try {
    const line_items = cartItems.map((item: any) => {
      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.name,
            images: [item.image],
            metadata: {
              productId: item.id,
              sellerId: item.seller_id,
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
       return_url: `${origin}/checkout?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    console.error('Stripe Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
