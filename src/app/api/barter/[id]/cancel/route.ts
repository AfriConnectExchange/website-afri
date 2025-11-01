import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/barter/[id]/cancel
 * Cancel a barter proposal (US022-AC03)
 * 
 * Acceptance Criteria:
 * - US022-AC03: Mark as "Cancelled" and notify other party instantly
 * - Only proposer can cancel while status is Pending
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

    const barterId = params.id;

    // Get barter proposal
    const barterRef = adminDb.collection('barters').doc(barterId);
    const barterDoc = await barterRef.get();

    if (!barterDoc.exists) {
      return NextResponse.json({ error: 'Barter proposal not found' }, { status: 404 });
    }

    const barterData = barterDoc.data();

    // US022-AC03: Only proposer can cancel
    if (barterData!.proposer_id !== userId) {
      return NextResponse.json({ error: 'Only the proposer can cancel this proposal' }, { status: 403 });
    }

    // Can only cancel if still pending
    if (barterData!.status !== 'Pending') {
      return NextResponse.json(
        { error: `Cannot cancel a ${barterData!.status.toLowerCase()} proposal` },
        { status: 400 }
      );
    }

    // US022-AC03: Mark as "Cancelled"
    await barterRef.update({
      status: 'Cancelled',
      cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify recipient instantly
    await notifyCancellation(
      barterData!.recipient_id,
      barterId,
      barterData!.offer_item_name,
      barterData!.target_product_title
    );

    return NextResponse.json({
      success: true,
      status: 'Cancelled',
      message: 'Barter proposal cancelled successfully',
    });

  } catch (error) {
    console.error('Barter cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel barter proposal' },
      { status: 500 }
    );
  }
}

/**
 * Notify recipient of cancellation
 */
async function notifyCancellation(
  recipientId: string,
  barterId: string,
  offerItemName: string,
  targetProductTitle: string
): Promise<void> {
  const notificationRef = adminDb.collection('notifications').doc();
  await notificationRef.set({
    user_id: recipientId,
    type: 'message',
    title: 'Barter Proposal Cancelled',
    message: `The barter offer of "${offerItemName}" for your "${targetProductTitle}" was cancelled`,
    action_url: `/barter/${barterId}`,
    read: false,
    created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
  });
}
