import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/escrow/[id]/dispute
 * Raise a dispute and freeze escrowed funds (US021-AC03)
 * 
 * Acceptance Criteria:
 * - US021-AC03: Freeze funds and notify admin within 60 seconds
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

    const body = await request.json();
    const { reason, description } = body;

    if (!reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: reason, description' },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    const escrowId = params.id;

    // Get escrow record
    const escrowRef = adminDb.collection('escrow').doc(escrowId);
    const escrowDoc = await escrowRef.get();

    if (!escrowDoc.exists) {
      return NextResponse.json({ error: 'Escrow record not found' }, { status: 404 });
    }

    const escrowData = escrowDoc.data();

    // Verify user is buyer or seller
    const isBuyer = escrowData!.buyer_id === userId;
    const isSeller = escrowData!.seller_id === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'You are not part of this transaction' }, { status: 403 });
    }

    // Check if dispute already exists
    if (escrowData!.status === 'Disputed') {
      return NextResponse.json({ error: 'Dispute already raised for this escrow' }, { status: 400 });
    }

    if (escrowData!.status === 'Released') {
      return NextResponse.json({ error: 'Cannot dispute after funds released' }, { status: 400 });
    }

    // US021-AC03: Freeze funds
    await escrowRef.update({
      status: 'Disputed',
      dispute_raised_by: userId,
      dispute_raised_at: admin.firestore.FieldValue.serverTimestamp(),
      dispute_reason: reason,
      dispute_description: description,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create dispute record
    const disputeRef = adminDb.collection('disputes').doc();
    const disputeData = {
      dispute_id: disputeRef.id,
      escrow_id: escrowId,
      order_id: escrowData!.order_id,
      raised_by: userId,
      raised_by_role: isBuyer ? 'buyer' : 'seller',
      buyer_id: escrowData!.buyer_id,
      seller_id: escrowData!.seller_id,
      amount: escrowData!.amount,
      currency: escrowData!.currency,
      reason,
      description,
      status: 'Open',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await disputeRef.set(disputeData);

    // Update order status
    await adminDb.collection('orders').doc(escrowData!.order_id).update({
      status: 'disputed',
      dispute_id: disputeRef.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // US021-AC03: Notify admin within 60 seconds
    await notifyAdminOfDispute(disputeRef.id, escrowData!, isBuyer ? 'buyer' : 'seller', reason);

    // Notify other party
    const otherPartyId = isBuyer ? escrowData!.seller_id : escrowData!.buyer_id;
    await notifyDisputeRaised(otherPartyId, disputeRef.id, isBuyer ? 'buyer' : 'seller');

    return NextResponse.json({
      success: true,
      dispute_id: disputeRef.id,
      status: 'Disputed',
      message: 'Dispute raised successfully. An admin will review and respond within 48 hours.',
    });

  } catch (error) {
    console.error('Escrow dispute error:', error);
    return NextResponse.json(
      { error: 'Failed to raise dispute' },
      { status: 500 }
    );
  }
}

/**
 * Notify admin of new dispute (US021-AC03)
 */
async function notifyAdminOfDispute(
  disputeId: string,
  escrowData: any,
  raisedBy: string,
  reason: string
): Promise<void> {
  // Get all admin users
  const adminsQuery = await adminDb
    .collection('users')
    .where('role', '==', 'admin')
    .limit(10)
    .get();

  if (adminsQuery.empty) {
    console.warn('No admins found to notify about dispute');
    return;
  }

  const batch = adminDb.batch();

  adminsQuery.docs.forEach(adminDoc => {
    const notificationRef = adminDb.collection('notifications').doc();
    batch.set(notificationRef, {
      user_id: adminDoc.id,
      type: 'system',
      title: 'New Dispute Requires Review',
      message: `Dispute raised by ${raisedBy} for order ${escrowData.order_id}. Reason: ${reason}`,
      action_url: `/admin/disputes/${disputeId}`,
      read: false,
      created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    });
  });

  await batch.commit();
}

/**
 * Notify other party that dispute was raised
 */
async function notifyDisputeRaised(
  userId: string,
  disputeId: string,
  raisedBy: string
): Promise<void> {
  const notificationRef = adminDb.collection('notifications').doc();
  await notificationRef.set({
    user_id: userId,
    type: 'order',
    title: 'Dispute Raised',
    message: `The ${raisedBy} has raised a dispute for this order. An admin will review.`,
    action_url: `/disputes/${disputeId}`,
    read: false,
    created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
  });
}
