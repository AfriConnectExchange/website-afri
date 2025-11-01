import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/escrow/[id]/release
 * Release escrowed funds to seller after delivery confirmed (US021-AC02)
 * 
 * Acceptance Criteria:
 * - US021-AC02: Release funds within 24 hours when both parties confirm
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const escrowId = params.id;

    // Get escrow record
    const escrowRef = adminDb.collection('escrow').doc(escrowId);
    const escrowDoc = await escrowRef.get();

    if (!escrowDoc.exists) {
      return NextResponse.json({ error: 'Escrow record not found' }, { status: 404 });
    }

    const escrowData = escrowDoc.data();

    // Check if funds already released
    if (escrowData!.status !== 'Escrowed') {
      return NextResponse.json(
        { error: `Escrow already ${escrowData!.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Determine who is confirming (buyer or seller)
    const isBuyer = escrowData!.buyer_id === userId;
    const isSeller = escrowData!.seller_id === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'You are not part of this transaction' }, { status: 403 });
    }

    // Update confirmation flags
    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isBuyer) {
      updateData.delivery_confirmed_by_buyer = true;
      updateData.buyer_confirmed_at = admin.firestore.FieldValue.serverTimestamp();
    }

    if (isSeller) {
      updateData.delivery_confirmed_by_seller = true;
      updateData.seller_confirmed_at = admin.firestore.FieldValue.serverTimestamp();
    }

    await escrowRef.update(updateData);

    // Refresh escrow data
    const updatedEscrowDoc = await escrowRef.get();
    const updatedEscrowData = updatedEscrowDoc.data();

    // US021-AC02: Check if both parties confirmed
    const bothConfirmed = 
      updatedEscrowData!.delivery_confirmed_by_buyer && 
      updatedEscrowData!.delivery_confirmed_by_seller;

    if (bothConfirmed) {
      // Release funds to seller
      await escrowRef.update({
        status: 'Released',
        released_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update order status
      await adminDb.collection('orders').doc(escrowData!.order_id).update({
        payment_status: 'Released',
        status: 'completed',
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update payment record
      const paymentQuery = await adminDb
        .collection('payments')
        .where('escrow_id', '==', escrowId)
        .limit(1)
        .get();

      if (!paymentQuery.empty) {
        await paymentQuery.docs[0].ref.update({
          status: 'Released',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Notify both parties
      await notifyEscrowRelease(
        escrowData!.buyer_id,
        escrowData!.seller_id,
        escrowData!.amount,
        escrowData!.currency
      );

      return NextResponse.json({
        success: true,
        status: 'Released',
        message: 'Funds released to seller successfully',
        amount: escrowData!.amount,
      });
    } else {
      // Waiting for other party
      const waitingFor = isBuyer ? 'seller' : 'buyer';
      return NextResponse.json({
        success: true,
        status: 'Escrowed',
        message: `Delivery confirmed. Waiting for ${waitingFor} confirmation.`,
        buyer_confirmed: updatedEscrowData!.delivery_confirmed_by_buyer,
        seller_confirmed: updatedEscrowData!.delivery_confirmed_by_seller,
      });
    }

  } catch (error) {
    console.error('Escrow release error:', error);
    return NextResponse.json(
      { error: 'Failed to release escrow funds' },
      { status: 500 }
    );
  }
}

/**
 * Notify both parties of escrow release
 */
async function notifyEscrowRelease(
  buyerId: string,
  sellerId: string,
  amount: number,
  currency: string
): Promise<void> {
  const notifications = [
    {
      user_id: buyerId,
      type: 'order',
      title: 'Escrow Funds Released',
      message: `Funds of ${currency} ${amount.toFixed(2)} have been released to the seller. Transaction complete.`,
      action_url: `/orders`,
      read: false,
      created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    },
    {
      user_id: sellerId,
      type: 'order',
      title: 'Payment Released',
      message: `You have received ${currency} ${amount.toFixed(2)} from escrow. Funds will arrive in 1-3 business days.`,
      action_url: `/vendor/orders`,
      read: false,
      created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    },
  ];

  const batch = adminDb.batch();
  notifications.forEach(notif => {
    const ref = adminDb.collection('notifications').doc();
    batch.set(ref, notif);
  });
  await batch.commit();
}
