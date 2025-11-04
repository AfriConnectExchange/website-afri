// API to manage payout settings
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    if (payout_method === 'stripe_connect' && !stripe_connect) {
      return NextResponse.json({ error: 'Stripe Connect details are required' }, { status: 400 });
    }

    if (payout_method === 'paypal' && (!paypal_email || String(paypal_email).trim() === '')) {
      return NextResponse.json({ error: 'PayPal email is required' }, { status: 400 });
    }

    const db = admin.firestore();

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payout_method: userData.payout_method,
      bank_account: userData.bank_account,
      paypal_email: userData.paypal_email,
    });
  } catch (error: any) {
    console.error('Error fetching payout settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await req.json();
  const { payout_method, bank_account, paypal_email } = body;

    if (!payout_method) {
      return NextResponse.json({ error: 'Payout method is required' }, { status: 400 });
    }

    if (payout_method === 'bank_transfer' && !bank_account) {
      return NextResponse.json({ error: 'Bank account details are required' }, { status: 400 });
    }

    if (payout_method === 'paypal' && (!paypal_email || String(paypal_email).trim() === '')) {
      return NextResponse.json({ error: 'PayPal email is required' }, { status: 400 });
    }

    const db = admin.firestore();
    
    const updateData: any = {
      payout_method,
      updated_at: admin.firestore.Timestamp.now(),
    };

    // Clear previous payout data
    updateData.bank_account = null;
    updateData.paypal_email = null;

    // Set new payout data based on method
    if (payout_method === 'bank_transfer' && bank_account) {
      updateData.bank_account = bank_account;
    } else if (payout_method === 'paypal' && paypal_email) {
      updateData.paypal_email = paypal_email;
    }

    await db.collection('users').doc(userId).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Payout settings saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving payout settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
