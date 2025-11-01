import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/barter/[id]/complete
 * Mark barter as completed (US022-AC04)
 * 
 * Acceptance Criteria:
 * - US022-AC04: Both parties mark as "Delivered/Received" → move to "Completed"
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

    // Can only complete confirmed barters
    if (barterData!.status !== 'Confirmed') {
      return NextResponse.json(
        { error: `Cannot complete a ${barterData!.status.toLowerCase()} barter` },
        { status: 400 }
      );
    }

    // Verify user is part of this barter
    const isProposer = barterData!.proposer_id === userId;
    const isRecipient = barterData!.recipient_id === userId;

    if (!isProposer && !isRecipient) {
      return NextResponse.json({ error: 'You are not part of this barter' }, { status: 403 });
    }

    // Update confirmation flags
    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (isProposer) {
      updateData.proposer_confirmed_delivery = true;
      updateData.proposer_confirmed_at = admin.firestore.FieldValue.serverTimestamp();
    }

    if (isRecipient) {
      updateData.recipient_confirmed_delivery = true;
      updateData.recipient_confirmed_at = admin.firestore.FieldValue.serverTimestamp();
    }

    await barterRef.update(updateData);

    // Refresh barter data
    const updatedBarterDoc = await barterRef.get();
    const updatedBarterData = updatedBarterDoc.data();

    // US022-AC04: Check if both parties confirmed
    const bothConfirmed = 
      updatedBarterData!.proposer_confirmed_delivery && 
      updatedBarterData!.recipient_confirmed_delivery;

    if (bothConfirmed) {
      // Mark as completed
      await barterRef.update({
        status: 'Completed',
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify both parties
      await notifyBarterCompleted(
        barterData!.proposer_id,
        barterData!.recipient_id,
        barterId
      );

      return NextResponse.json({
        success: true,
        status: 'Completed',
        message: 'Barter completed successfully',
      });
    } else {
      // Waiting for other party
      const waitingFor = isProposer ? 'recipient' : 'proposer';
      return NextResponse.json({
        success: true,
        status: 'Confirmed',
        message: `Delivery confirmed. Waiting for ${waitingFor} confirmation.`,
        proposer_confirmed: updatedBarterData!.proposer_confirmed_delivery || false,
        recipient_confirmed: updatedBarterData!.recipient_confirmed_delivery || false,
      });
    }

  } catch (error) {
    console.error('Barter completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete barter' },
      { status: 500 }
    );
  }
}

/**
 * Notify both parties of barter completion
 */
async function notifyBarterCompleted(
  proposerId: string,
  recipientId: string,
  barterId: string
): Promise<void> {
  const notifications = [
    {
      user_id: proposerId,
      type: 'message',
      title: 'Barter Completed',
      message: 'Your barter exchange has been completed successfully',
      action_url: `/barter/${barterId}`,
      read: false,
      created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    },
    {
      user_id: recipientId,
      type: 'message',
      title: 'Barter Completed',
      message: 'Your barter exchange has been completed successfully',
      action_url: `/barter/${barterId}`,
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
